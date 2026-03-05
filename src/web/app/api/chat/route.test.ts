// --- Mock openai BEFORE importing route ---
const mockCreate = jest.fn();

class MockAPIError extends Error {
  status: number;
  constructor(message: string, status = 500) {
    super(message);
    this.name = "APIError";
    this.status = status;
  }
}

jest.mock("openai", () => {
  const OpenAIClass = jest.fn().mockImplementation(() => ({
    chat: { completions: { create: mockCreate } },
  }));
  (OpenAIClass as any).APIError = MockAPIError;
  return { __esModule: true, default: OpenAIClass };
});

jest.mock("next/server", () => ({
  NextRequest: jest.fn(),
  NextResponse: {
    json: jest.fn((body: unknown, init?: ResponseInit) => ({
      _body: body,
      status: init?.status ?? 200,
      json: async () => body,
    })),
  },
}));

import { NextRequest, NextResponse } from "next/server";
import { POST } from "./route";

function makeRequest(
  body: unknown,
  headers: Record<string, string> = {},
): NextRequest {
  return {
    json: async () => body,
    headers: new Headers({ "x-forwarded-for": "127.0.0.1", ...headers }),
  } as unknown as NextRequest;
}

function makeBadJsonRequest(ip = "192.0.2.1"): NextRequest {
  return {
    json: async () => { throw new SyntaxError("Unexpected token"); },
    headers: new Headers({ "x-forwarded-for": ip }),
  } as unknown as NextRequest;
}

function makeFakeStream(...chunks: string[]) {
  return {
    [Symbol.asyncIterator]: async function* () {
      for (const c of chunks) {
        yield { choices: [{ delta: { content: c } }] };
      }
    },
  };
}

// Each test uses a unique IP to avoid cross-test rate limiting
let ipCounter = 0;
function uniqueIp(): string {
  return `10.${Math.floor(ipCounter / 256)}.${ipCounter++ % 256}.1`;
}

describe("POST /api/chat", () => {
  beforeEach(() => {
    process.env.GROQ_API_KEY = "test-key";
    jest.clearAllMocks();
  });

  afterEach(() => {
    delete process.env.GROQ_API_KEY;
  });

  it("returns 400 for invalid JSON body", async () => {
    const res = await POST(makeBadJsonRequest(uniqueIp()));
    expect(NextResponse.json).toHaveBeenCalledWith(
      { error: "Invalid JSON body" },
      { status: 400 },
    );
    expect((res as any).status).toBe(400);
  });

  it("returns 400 when messages field is absent", async () => {
    const res = await POST(makeRequest({ no: "messages" }, { "x-forwarded-for": uniqueIp() }));
    expect(NextResponse.json).toHaveBeenCalledWith(
      { error: "messages array is required" },
      { status: 400 },
    );
  });

  it("returns 400 when messages is not an array", async () => {
    const res = await POST(makeRequest({ messages: "string" }, { "x-forwarded-for": uniqueIp() }));
    expect((res as any).status).toBe(400);
  });

  it("returns 400 when messages is an empty array", async () => {
    const res = await POST(makeRequest({ messages: [] }, { "x-forwarded-for": uniqueIp() }));
    expect((res as any).status).toBe(400);
  });

  it("returns 503 when GROQ_API_KEY is not set", async () => {
    delete process.env.GROQ_API_KEY;
    const res = await POST(makeRequest(
      { messages: [{ role: "user", content: "hi" }] },
      { "x-forwarded-for": uniqueIp() },
    ));
    expect(NextResponse.json).toHaveBeenCalledWith(
      { error: "LLM not configured (missing GROQ_API_KEY)" },
      { status: 503 },
    );
  });

  it("returns 429 after 30 requests from the same IP", async () => {
    const ip = "203.0.113.42";
    mockCreate.mockResolvedValue(makeFakeStream("ok"));

    for (let i = 0; i < 30; i++) {
      await POST(makeRequest(
        { messages: [{ role: "user", content: "hi" }] },
        { "x-forwarded-for": ip },
      ));
    }

    const res = await POST(makeRequest(
      { messages: [{ role: "user", content: "hi" }] },
      { "x-forwarded-for": ip },
    ));
    expect(NextResponse.json).toHaveBeenLastCalledWith(
      { error: "Rate limit exceeded. Try again in a minute." },
      { status: 429 },
    );
  });

  it("returns SSE streaming response with correct headers", async () => {
    mockCreate.mockResolvedValue(makeFakeStream("Hello", " world"));
    const res = await POST(makeRequest(
      { messages: [{ role: "user", content: "hi" }] },
      { "x-forwarded-for": uniqueIp() },
    ));

    expect(res).toBeInstanceOf(Response);
    expect(res.headers.get("Content-Type")).toBe("text/event-stream");
    expect(res.headers.get("Cache-Control")).toBe("no-cache");
    expect(res.headers.get("Connection")).toBe("keep-alive");
  });

  it("streams correct SSE data chunks and terminates with [DONE]", async () => {
    mockCreate.mockResolvedValue(makeFakeStream("chunk1", "chunk2"));
    const res = await POST(makeRequest(
      { messages: [{ role: "user", content: "test" }] },
      { "x-forwarded-for": uniqueIp() },
    ));

    const text = await res.text();
    expect(text).toContain(`data: ${JSON.stringify({ content: "chunk1" })}`);
    expect(text).toContain(`data: ${JSON.stringify({ content: "chunk2" })}`);
    expect(text).toContain("data: [DONE]");
  });

  it("prepends system prompt and passes stream: true to OpenAI client", async () => {
    mockCreate.mockResolvedValue(makeFakeStream("ok"));
    await POST(makeRequest(
      { messages: [{ role: "user", content: "what is styx?" }] },
      { "x-forwarded-for": uniqueIp() },
    ));

    expect(mockCreate).toHaveBeenCalledTimes(1);
    const args = mockCreate.mock.calls[0][0];
    expect(args.messages[0].role).toBe("system");
    expect(args.messages[1]).toMatchObject({ role: "user", content: "what is styx?" });
    expect(args.stream).toBe(true);
  });

  it("forwards OpenAI APIError with its status code", async () => {
    const apiErr = new MockAPIError("Unauthorized", 401);
    // Make it look like an OpenAI.APIError to the instanceof check
    Object.setPrototypeOf(apiErr, MockAPIError.prototype);
    mockCreate.mockRejectedValue(apiErr);

    const res = await POST(makeRequest(
      { messages: [{ role: "user", content: "fail" }] },
      { "x-forwarded-for": uniqueIp() },
    ));
    expect(NextResponse.json).toHaveBeenCalledWith(
      { error: "LLM API error: Unauthorized" },
      { status: 401 },
    );
  });

  it("returns 500 for unexpected non-API errors", async () => {
    mockCreate.mockRejectedValue(new Error("network timeout"));
    const res = await POST(makeRequest(
      { messages: [{ role: "user", content: "boom" }] },
      { "x-forwarded-for": uniqueIp() },
    ));
    expect(NextResponse.json).toHaveBeenCalledWith(
      { error: "Internal server error" },
      { status: 500 },
    );
  });

  // ================================================================
  // Knowledge base integration tests
  // ================================================================

  describe("system prompt with knowledge base", () => {
    beforeEach(() => {
      mockCreate.mockResolvedValue(makeFakeStream("ok"));
    });

    it("system prompt contains KNOWLEDGE BASE section", async () => {
      await POST(makeRequest(
        { messages: [{ role: "user", content: "hi" }] },
        { "x-forwarded-for": uniqueIp() },
      ));
      const systemContent = mockCreate.mock.calls[0][0].messages[0].content;
      expect(systemContent).toContain("KNOWLEDGE BASE:");
    });

    it("system prompt contains GUIDELINES section", async () => {
      await POST(makeRequest(
        { messages: [{ role: "user", content: "hi" }] },
        { "x-forwarded-for": uniqueIp() },
      ));
      const systemContent = mockCreate.mock.calls[0][0].messages[0].content;
      expect(systemContent).toContain("GUIDELINES:");
      expect(systemContent).toContain("plain, accessible language");
    });

    it("system prompt identifies the assistant as Styx AI", async () => {
      await POST(makeRequest(
        { messages: [{ role: "user", content: "hi" }] },
        { "x-forwarded-for": uniqueIp() },
      ));
      const systemContent = mockCreate.mock.calls[0][0].messages[0].content;
      expect(systemContent).toContain("Styx AI assistant");
    });

    it("system prompt includes behavioral logic constants", async () => {
      await POST(makeRequest(
        { messages: [{ role: "user", content: "hi" }] },
        { "x-forwarded-for": uniqueIp() },
      ));
      const systemContent = mockCreate.mock.calls[0][0].messages[0].content;
      expect(systemContent).toContain("LOSS_AVERSION_COEFFICIENT");
      expect(systemContent).toContain("1.955");
    });

    it("system prompt includes integrity score algorithm", async () => {
      await POST(makeRequest(
        { messages: [{ role: "user", content: "hi" }] },
        { "x-forwarded-for": uniqueIp() },
      ));
      const systemContent = mockCreate.mock.calls[0][0].messages[0].content;
      expect(systemContent).toContain("calculateIntegrity");
      expect(systemContent).toContain("BASE_INTEGRITY");
    });

    it("system prompt includes database schema", async () => {
      await POST(makeRequest(
        { messages: [{ role: "user", content: "hi" }] },
        { "x-forwarded-for": uniqueIp() },
      ));
      const systemContent = mockCreate.mock.calls[0][0].messages[0].content;
      expect(systemContent).toContain("CREATE TABLE");
      expect(systemContent).toContain("contracts");
    });

    it("system prompt includes oath categories", async () => {
      await POST(makeRequest(
        { messages: [{ role: "user", content: "hi" }] },
        { "x-forwarded-for": uniqueIp() },
      ));
      const systemContent = mockCreate.mock.calls[0][0].messages[0].content;
      expect(systemContent).toContain("OathCategory");
      expect(systemContent).toContain("BIOLOGICAL");
      expect(systemContent).toContain("RECOVERY");
    });

    it("system prompt includes Phase 1 beta scope", async () => {
      await POST(makeRequest(
        { messages: [{ role: "user", content: "hi" }] },
        { "x-forwarded-for": uniqueIp() },
      ));
      const systemContent = mockCreate.mock.calls[0][0].messages[0].content;
      expect(systemContent).toContain("Phase 1 Private Beta");
    });

    it("system prompt includes seed.yaml project metadata", async () => {
      await POST(makeRequest(
        { messages: [{ role: "user", content: "hi" }] },
        { "x-forwarded-for": uniqueIp() },
      ));
      const systemContent = mockCreate.mock.calls[0][0].messages[0].content;
      expect(systemContent).toContain("peer-audited--behavioral-blockchain");
    });
  });

  // ================================================================
  // Conversation history tests
  // ================================================================

  describe("conversation history handling", () => {
    beforeEach(() => {
      mockCreate.mockResolvedValue(makeFakeStream("ok"));
    });

    it("passes multi-turn conversation to the model", async () => {
      const messages = [
        { role: "user", content: "What is Styx?" },
        { role: "assistant", content: "Styx is a behavioral market." },
        { role: "user", content: "Tell me more." },
      ];
      await POST(makeRequest(
        { messages },
        { "x-forwarded-for": uniqueIp() },
      ));

      const args = mockCreate.mock.calls[0][0];
      // System prompt + 3 conversation messages
      expect(args.messages).toHaveLength(4);
      expect(args.messages[0].role).toBe("system");
      expect(args.messages[1]).toMatchObject({ role: "user", content: "What is Styx?" });
      expect(args.messages[2]).toMatchObject({ role: "assistant", content: "Styx is a behavioral market." });
      expect(args.messages[3]).toMatchObject({ role: "user", content: "Tell me more." });
    });

    it("uses max_tokens of 2048", async () => {
      await POST(makeRequest(
        { messages: [{ role: "user", content: "hi" }] },
        { "x-forwarded-for": uniqueIp() },
      ));
      const args = mockCreate.mock.calls[0][0];
      expect(args.max_tokens).toBe(2048);
    });

    it("uses temperature of 0.7", async () => {
      await POST(makeRequest(
        { messages: [{ role: "user", content: "hi" }] },
        { "x-forwarded-for": uniqueIp() },
      ));
      const args = mockCreate.mock.calls[0][0];
      expect(args.temperature).toBe(0.7);
    });

    it("uses the correct model identifier", async () => {
      await POST(makeRequest(
        { messages: [{ role: "user", content: "hi" }] },
        { "x-forwarded-for": uniqueIp() },
      ));
      const args = mockCreate.mock.calls[0][0];
      expect(args.model).toBe("llama-3.3-70b-versatile");
    });
  });

  // ================================================================
  // Edge case tests
  // ================================================================

  describe("edge cases", () => {
    it("handles request with missing x-forwarded-for header", async () => {
      mockCreate.mockResolvedValue(makeFakeStream("ok"));
      const req = {
        json: async () => ({ messages: [{ role: "user", content: "hi" }] }),
        headers: new Headers({}),
      } as unknown as NextRequest;

      const res = await POST(req);
      // Should still work — falls back to "unknown" IP
      expect(res).toBeInstanceOf(Response);
    });

    it("handles stream with empty delta content", async () => {
      const stream = {
        [Symbol.asyncIterator]: async function* () {
          yield { choices: [{ delta: { content: undefined } }] };
          yield { choices: [{ delta: { content: "actual" } }] };
        },
      };
      mockCreate.mockResolvedValue(stream);

      const res = await POST(makeRequest(
        { messages: [{ role: "user", content: "test" }] },
        { "x-forwarded-for": uniqueIp() },
      ));
      const text = await res.text();
      expect(text).toContain(`data: ${JSON.stringify({ content: "actual" })}`);
      expect(text).toContain("data: [DONE]");
    });

    it("handles stream error mid-response", async () => {
      const stream = {
        [Symbol.asyncIterator]: async function* () {
          yield { choices: [{ delta: { content: "partial" } }] };
          throw new Error("stream died");
        },
      };
      mockCreate.mockResolvedValue(stream);

      const res = await POST(makeRequest(
        { messages: [{ role: "user", content: "test" }] },
        { "x-forwarded-for": uniqueIp() },
      ));
      const text = await res.text();
      expect(text).toContain(`data: ${JSON.stringify({ content: "partial" })}`);
      expect(text).toContain(`"error":"stream died"`);
    });

    it("handles empty choices array in stream chunk", async () => {
      const stream = {
        [Symbol.asyncIterator]: async function* () {
          yield { choices: [] };
          yield { choices: [{ delta: { content: "ok" } }] };
        },
      };
      mockCreate.mockResolvedValue(stream);

      const res = await POST(makeRequest(
        { messages: [{ role: "user", content: "test" }] },
        { "x-forwarded-for": uniqueIp() },
      ));
      const text = await res.text();
      expect(text).toContain("data: [DONE]");
    });
  });
});
