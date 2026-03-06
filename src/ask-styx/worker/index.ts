/// <reference types="@cloudflare/workers-types" />
import { STYX_KNOWLEDGE } from '../../web/lib/styx-knowledge';

interface Env {
  GROQ_API_KEY: string;
  ALLOWED_ORIGIN: string;
  LLM_MODEL: string;
  LLM_BASE_URL: string;
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
const rateLimitMap = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const timestamps = rateLimitMap.get(ip) ?? [];
  const recent = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  if (recent.length >= RATE_LIMIT_MAX) {
    rateLimitMap.set(ip, recent);
    return true;
  }
  recent.push(now);
  rateLimitMap.set(ip, recent);
  return false;
}

function corsHeaders(origin: string) {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = env.ALLOWED_ORIGIN || '*';
    const headers = corsHeaders(origin);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers });
    }

    if (request.method !== 'POST') {
      return Response.json({ error: 'Method not allowed' }, { status: 405, headers });
    }

    const ip = request.headers.get('cf-connecting-ip') ?? 'unknown';
    if (isRateLimited(ip)) {
      return Response.json(
        { error: 'Rate limit exceeded. Try again in a minute.' },
        { status: 429, headers },
      );
    }

    let body: { messages?: Array<{ role: string; content: string }> };
    try {
      body = await request.json();
    } catch {
      return Response.json({ error: 'Invalid JSON body' }, { status: 400, headers });
    }

    const messages = body.messages;
    if (!Array.isArray(messages) || messages.length === 0) {
      return Response.json({ error: 'messages array is required' }, { status: 400, headers });
    }

    const apiUrl = `${env.LLM_BASE_URL}/chat/completions`;
    const llmResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: env.LLM_MODEL,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          ...messages.map((m) => ({ role: m.role, content: m.content })),
        ],
        stream: true,
        max_tokens: 2048,
        temperature: 0.7,
      }),
    });

    if (!llmResponse.ok) {
      await llmResponse.text().catch(() => 'LLM API error');
      return Response.json(
        { error: `LLM API error (${llmResponse.status})` },
        { status: 502, headers },
      );
    }

    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const encoder = new TextEncoder();

    (async () => {
      const reader = llmResponse.body!.getReader();
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
        const msg = err instanceof Error ? err.message : 'Stream error';
        await writer.write(
          encoder.encode(`data: ${JSON.stringify({ error: msg })}\n\n`),
        );
      } finally {
        await writer.close();
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
  },
} satisfies ExportedHandler<Env>;
