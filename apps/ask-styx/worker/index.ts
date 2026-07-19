/// <reference types="@cloudflare/workers-types" />
import { STYX_KNOWLEDGE } from '../../web/lib/styx-knowledge';

interface Env {
  GROQ_API_KEY: string;
  ALLOWED_ORIGIN: string;
  LLM_MODEL: string;
  LLM_BASE_URL: string;
  RATE_LIMIT_KV: KVNamespace;
}

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

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 30;

// Input-validation bounds for the chat request. These cap untrusted client
// payloads so a single request cannot exhaust the LLM token budget, drive up
// cost, or smuggle in an alternate system prompt.
const MAX_MESSAGES = 40;
const MAX_CONTENT_CHARS = 8_000;
const MAX_TOTAL_CONTENT_CHARS = 24_000;
// Only client-supplied turns are accepted. The trusted `system` prompt is
// injected server-side; accepting a client `system` message would let a caller
// override the assistant's guardrails (prompt injection).
const ALLOWED_ROLES = new Set(['user', 'assistant']);

const REQUIRED_ENV_KEYS: Array<keyof Env> = ['GROQ_API_KEY', 'LLM_BASE_URL', 'LLM_MODEL'];

type ChatMessage = { role: string; content: string };

/**
 * Emit a single structured (JSON) log line. Cloudflare captures stdout, so
 * this gives queryable, correlatable logs keyed by request id. Logging must
 * never throw and never break request handling.
 */
function logEvent(
  level: 'info' | 'warn' | 'error',
  event: string,
  fields: Record<string, unknown> = {},
): void {
  try {
    console.log(
      JSON.stringify({
        ts: new Date().toISOString(),
        service: 'ask-styx-worker',
        level,
        event,
        ...fields,
      }),
    );
  } catch {
    // Never let logging interfere with the response.
  }
}

function newRequestId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    // crypto is always present in the Workers runtime; the guard keeps the
    // worker resilient under non-standard test harnesses.
    return 'req-unknown';
  }
}

function corsHeaders(origin: string, requestId: string) {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'x-request-id': requestId,
  };
}

function jsonError(
  message: string,
  status: number,
  headers: Record<string, string>,
  requestId: string,
): Response {
  return Response.json({ error: message, request_id: requestId }, { status, headers });
}

type ValidationResult =
  | { ok: true; messages: ChatMessage[] }
  | { ok: false; error: string };

/**
 * Validate and normalize untrusted chat messages. Rejects oversized payloads,
 * unknown/unsafe roles, and malformed entries, and strips every field except
 * the sanitized `role`/`content` so nothing unexpected is forwarded upstream.
 */
function validateMessages(raw: unknown): ValidationResult {
  if (!Array.isArray(raw) || raw.length === 0) {
    return { ok: false, error: 'messages array is required' };
  }
  if (raw.length > MAX_MESSAGES) {
    return { ok: false, error: `messages array exceeds the maximum of ${MAX_MESSAGES}` };
  }

  const sanitized: ChatMessage[] = [];
  let totalChars = 0;

  for (let i = 0; i < raw.length; i++) {
    const entry = raw[i];
    if (!entry || typeof entry !== 'object') {
      return { ok: false, error: `message at index ${i} must be an object` };
    }
    const { role, content } = entry as Record<string, unknown>;

    if (typeof role !== 'string' || !ALLOWED_ROLES.has(role)) {
      return {
        ok: false,
        error: `message at index ${i} has an invalid role (expected one of: ${[...ALLOWED_ROLES].join(', ')})`,
      };
    }
    if (typeof content !== 'string') {
      return { ok: false, error: `message at index ${i} content must be a string` };
    }
    const trimmed = content.trim();
    if (trimmed.length === 0) {
      return { ok: false, error: `message at index ${i} content must not be empty` };
    }
    if (content.length > MAX_CONTENT_CHARS) {
      return {
        ok: false,
        error: `message at index ${i} content exceeds the maximum of ${MAX_CONTENT_CHARS} characters`,
      };
    }

    totalChars += content.length;
    if (totalChars > MAX_TOTAL_CONTENT_CHARS) {
      return {
        ok: false,
        error: `combined message content exceeds the maximum of ${MAX_TOTAL_CONTENT_CHARS} characters`,
      };
    }

    sanitized.push({ role, content });
  }

  return { ok: true, messages: sanitized };
}

async function isRateLimited(ip: string, kv: KVNamespace): Promise<boolean> {
  const now = Date.now();
  const key = `ratelimit:${ip}`;

  let timestamps: number[] = [];
  const raw = await kv.get(key);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        timestamps = parsed.filter((t): t is number => typeof t === 'number');
      }
    } catch {
      // Corrupt KV entry — treat as no prior history; it is overwritten below.
      logEvent('warn', 'rate_limit_kv_corrupt', { key });
    }
  }

  const recent = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  const ttl = Math.ceil(RATE_LIMIT_WINDOW_MS / 1000);
  if (recent.length >= RATE_LIMIT_MAX) {
    await kv.put(key, JSON.stringify(recent), { expirationTtl: ttl });
    return true;
  }
  recent.push(now);
  await kv.put(key, JSON.stringify(recent), { expirationTtl: ttl });
  return false;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const requestId = newRequestId();
    const origin = env.ALLOWED_ORIGIN || '*';
    const headers = corsHeaders(origin, requestId);

    try {
      if (request.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers });
      }

      if (request.method !== 'POST') {
        return jsonError('Method not allowed', 405, headers, requestId);
      }

      // Fail fast (and loudly) on misconfiguration rather than leaking a raw
      // upstream/runtime error to the client.
      const missingEnv = REQUIRED_ENV_KEYS.filter((key) => !env[key]);
      if (missingEnv.length > 0) {
        logEvent('error', 'config_missing', { requestId, missing: missingEnv });
        return jsonError('Service is not configured', 500, headers, requestId);
      }

      const ip = request.headers.get('cf-connecting-ip') ?? 'unknown';

      let limited = false;
      try {
        limited = await isRateLimited(ip, env.RATE_LIMIT_KV);
      } catch (err) {
        // Fail open on KV outages so chat stays available, but record it.
        logEvent('error', 'rate_limit_check_failed', {
          requestId,
          error: err instanceof Error ? err.message : String(err),
        });
      }
      if (limited) {
        logEvent('warn', 'rate_limited', { requestId });
        return jsonError('Rate limit exceeded. Try again in a minute.', 429, headers, requestId);
      }

      let body: unknown;
      try {
        body = await request.json();
      } catch {
        return jsonError('Invalid JSON body', 400, headers, requestId);
      }

      if (!body || typeof body !== 'object') {
        return jsonError('Request body must be a JSON object', 400, headers, requestId);
      }

      const validation = validateMessages((body as { messages?: unknown }).messages);
      if (!validation.ok) {
        logEvent('warn', 'invalid_request', { requestId, reason: validation.error });
        return jsonError(validation.error, 400, headers, requestId);
      }

      logEvent('info', 'chat_request', {
        requestId,
        messageCount: validation.messages.length,
      });

      const apiUrl = `${env.LLM_BASE_URL}/chat/completions`;
      let llmResponse: Response;
      try {
        llmResponse = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${env.GROQ_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: env.LLM_MODEL,
            messages: [
              { role: 'system', content: SYSTEM_PROMPT },
              ...validation.messages,
            ],
            stream: true,
            max_tokens: 2048,
            temperature: 0.7,
          }),
        });
      } catch (err) {
        logEvent('error', 'llm_fetch_failed', {
          requestId,
          error: err instanceof Error ? err.message : String(err),
        });
        return jsonError('Upstream LLM request failed', 502, headers, requestId);
      }

      if (!llmResponse.ok) {
        // Drain the body so the connection can be reused; never surface the
        // upstream error text (it may contain provider internals).
        await llmResponse.text().catch(() => undefined);
        logEvent('error', 'llm_error_status', { requestId, status: llmResponse.status });
        return jsonError(`LLM API error (${llmResponse.status})`, 502, headers, requestId);
      }

      if (!llmResponse.body) {
        logEvent('error', 'llm_empty_body', { requestId });
        return jsonError('Upstream LLM returned an empty response', 502, headers, requestId);
      }

      const { readable, writable } = new TransformStream();
      const writer = writable.getWriter();
      const encoder = new TextEncoder();
      const upstreamBody = llmResponse.body;

      (async () => {
        const reader = upstreamBody.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() ?? '';

            for (const line of lines) {
              if (!line.startsWith('data: ')) continue;
              const data = line.slice(6);
              if (data === '[DONE]') {
                await writer.write(encoder.encode('data: [DONE]\n\n'));
                continue;
              }
              try {
                const parsed = JSON.parse(data);
                const delta = parsed.choices?.[0]?.delta?.content;
                if (delta) {
                  await writer.write(
                    encoder.encode(`data: ${JSON.stringify({ content: delta })}\n\n`),
                  );
                }
              } catch {
                // skip malformed chunks
              }
            }
          }
          await writer.write(encoder.encode('data: [DONE]\n\n'));
        } catch (err) {
          logEvent('error', 'stream_failed', {
            requestId,
            error: err instanceof Error ? err.message : String(err),
          });
          // Do not echo internal error details to the client stream.
          await writer
            .write(encoder.encode(`data: ${JSON.stringify({ error: 'Stream interrupted' })}\n\n`))
            .catch(() => undefined);
        } finally {
          await writer.close().catch(() => undefined);
        }
      })();

      return new Response(readable, {
        headers: {
          ...headers,
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        },
      });
    } catch (err) {
      // Last-resort guard: any unexpected throw becomes a structured 500
      // instead of an opaque runtime error with a leaked stack trace.
      logEvent('error', 'unhandled_exception', {
        requestId,
        error: err instanceof Error ? err.message : String(err),
      });
      return jsonError('Internal server error', 500, headers, requestId);
    }
  },
} satisfies ExportedHandler<Env>;
