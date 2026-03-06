import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the STYX_KNOWLEDGE import used in worker
vi.mock('../../web/lib/styx-knowledge', () => ({
  STYX_KNOWLEDGE: 'mock-knowledge-base',
}));

import worker from '../worker/index';

function makeEnv(overrides: Partial<Record<string, string>> = {}) {
  return {
    GROQ_API_KEY: 'test-key',
    ALLOWED_ORIGIN: 'https://styx.io',
    LLM_MODEL: 'llama-3.3-70b-versatile',
    LLM_BASE_URL: 'https://api.groq.com/openai/v1',
    ...overrides,
  };
}

function makeRequest(method: string, body?: unknown, headers: Record<string, string> = {}) {
  return new Request('https://worker.styx.io/api/chat', {
    method,
    headers: {
      'Content-Type': 'application/json',
      'cf-connecting-ip': '127.0.0.1',
      ...headers,
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
}

describe('Ask Styx Worker', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('returns 204 for OPTIONS (CORS preflight)', async () => {
    const req = makeRequest('OPTIONS');
    const res = await worker.fetch(req, makeEnv() as any);

    expect(res.status).toBe(204);
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('https://styx.io');
    expect(res.headers.get('Access-Control-Allow-Methods')).toContain('POST');
  });

  it('returns 405 for non-POST methods', async () => {
    const req = makeRequest('GET');
    const res = await worker.fetch(req, makeEnv() as any);

    expect(res.status).toBe(405);
    const body = await res.json() as { error: string };
    expect(body.error).toBe('Method not allowed');
  });

  it('returns 400 for invalid JSON body', async () => {
    const req = new Request('https://worker.styx.io/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
        'cf-connecting-ip': '10.0.0.1',
      },
      body: 'not json{{{',
    });
    const res = await worker.fetch(req, makeEnv() as any);

    expect(res.status).toBe(400);
    const body = await res.json() as { error: string };
    expect(body.error).toBe('Invalid JSON body');
  });

  it('returns 400 when messages array is missing', async () => {
    const req = makeRequest('POST', { noMessages: true }, { 'cf-connecting-ip': '10.0.0.2' });
    const res = await worker.fetch(req, makeEnv() as any);

    expect(res.status).toBe(400);
    const body = await res.json() as { error: string };
    expect(body.error).toBe('messages array is required');
  });

  it('returns 400 when messages array is empty', async () => {
    const req = makeRequest('POST', { messages: [] }, { 'cf-connecting-ip': '10.0.0.3' });
    const res = await worker.fetch(req, makeEnv() as any);

    expect(res.status).toBe(400);
    const body = await res.json() as { error: string };
    expect(body.error).toBe('messages array is required');
  });

  it('returns streaming response for valid request', async () => {
    // Mock the global fetch used to call the LLM API
    const mockStream = new ReadableStream({
      start(controller) {
        const encoder = new TextEncoder();
        controller.enqueue(encoder.encode('data: {"choices":[{"delta":{"content":"Hello"}}]}\n\n'));
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      },
    });

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(mockStream, { status: 200 }),
    );

    const req = makeRequest(
      'POST',
      { messages: [{ role: 'user', content: 'hi' }] },
      { 'cf-connecting-ip': '10.0.0.4' },
    );
    const res = await worker.fetch(req, makeEnv() as any);

    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('text/event-stream');
  });

  it('returns 502 when LLM API returns an error', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response('Unauthorized', { status: 401 }),
    );

    const req = makeRequest(
      'POST',
      { messages: [{ role: 'user', content: 'hi' }] },
      { 'cf-connecting-ip': '10.0.0.5' },
    );
    const res = await worker.fetch(req, makeEnv() as any);

    expect(res.status).toBe(502);
    const body = await res.json() as { error: string };
    expect(body.error).toContain('LLM API error');
  });

  it('sets CORS headers using ALLOWED_ORIGIN env', async () => {
    const req = makeRequest('GET', undefined, { 'cf-connecting-ip': '10.0.0.6' });
    const res = await worker.fetch(req, makeEnv({ ALLOWED_ORIGIN: 'https://custom.io' }) as any);

    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('https://custom.io');
  });

  it('defaults CORS origin to * when ALLOWED_ORIGIN is empty', async () => {
    const req = makeRequest('GET', undefined, { 'cf-connecting-ip': '10.0.0.7' });
    const res = await worker.fetch(req, makeEnv({ ALLOWED_ORIGIN: '' }) as any);

    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');
  });
});
