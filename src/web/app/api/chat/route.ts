import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { STYX_KNOWLEDGE } from "../../../lib/styx-knowledge";

const client = new OpenAI({
  apiKey: process.env.GROQ_API_KEY || "",
  baseURL: process.env.LLM_BASE_URL || "https://api.groq.com/openai/v1",
});

const MODEL = process.env.LLM_MODEL || "llama-3.3-70b-versatile";

const SYSTEM_PROMPT = `You are the Styx AI assistant — an expert on the Styx peer-audited behavioral market platform. You help stakeholders (investors, partners, developers) understand how Styx works.

GUIDELINES:
- Use plain, accessible language — your audience may be non-technical (investors, partners, advisors).
- Be concise, confident, and precise.
- Answer from the knowledge base below. Cite specific numbers, algorithms, and constants when relevant.
- If you don't know something or it's not in the knowledge base, say so rather than guessing.
- For technical questions, reference specific files, modules, or database tables.
- Keep responses focused — aim for 2-4 paragraphs unless the question warrants more detail.

KNOWLEDGE BASE:
${STYX_KNOWLEDGE}`;

// Simple in-memory rate limiter: max 30 requests per minute per IP
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 30;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const timestamps = rateLimitMap.get(ip) || [];
  const recent = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  if (recent.length >= RATE_LIMIT_MAX) {
    rateLimitMap.set(ip, recent);
    return true;
  }
  recent.push(now);
  rateLimitMap.set(ip, recent);
  return false;
}

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown";

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Try again in a minute." },
      { status: 429 }
    );
  }

  let body: { messages?: Array<{ role: string; content: string }> };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const messages = body.messages;
  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json(
      { error: "messages array is required" },
      { status: 400 }
    );
  }

  if (!process.env.GROQ_API_KEY) {
    return NextResponse.json(
      { error: "LLM not configured (missing GROQ_API_KEY)" },
      { status: 503 }
    );
  }

  try {
    const stream = await client.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ...messages.map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        })),
      ],
      stream: true,
      max_tokens: 2048,
      temperature: 0.7,
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const delta = chunk.choices[0]?.delta?.content;
            if (delta) {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ content: delta })}\n\n`)
              );
            }
          }
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (err) {
          const msg =
            err instanceof Error ? err.message : "Stream error";
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ error: msg })}\n\n`
            )
          );
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (err) {
    if (err instanceof OpenAI.APIError) {
      const status = err.status || 500;
      return NextResponse.json(
        { error: `LLM API error: ${err.message}` },
        { status: status >= 400 && status < 600 ? status : 500 }
      );
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
