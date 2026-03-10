# Replace Anthropic SDK with free open-source LLM

**Date**: 2026-03-04
**Status**: IMPLEMENTED

## Context

The stakeholder portal's `/api/chat` route needs an LLM-powered chat endpoint. Instead of using the paid Anthropic Claude API, we use Groq's free tier with Llama 3.3 70B.

## Approach: Groq free tier + OpenAI-compatible SDK

**Groq** provides free inference for open-source models with no credit card required:
- **Llama 3.3 70B** — excellent quality, 128K context, free at 30 RPM / 14,400 RPD
- OpenAI-compatible API (`https://api.groq.com/openai/v1`)
- Get a free API key at `console.groq.com`

Uses the `openai` npm package pointed at Groq's base URL. Provider is configurable via env vars so it works with any OpenAI-compatible endpoint (Groq, Together, Ollama, etc).

## Files modified

| File | Change |
|------|--------|
| `src/web/app/api/chat/route.ts` | Created: OpenAI SDK chat route with Groq endpoint + Llama 3.3 70B, SSE streaming, rate limiting |
| `src/web/package.json` | Added `openai` ^4.80.0 dependency |
| `.env.example` | Added `GROQ_API_KEY`, `LLM_BASE_URL`, `LLM_MODEL` |
| `CLAUDE.md` | Updated Infrastructure section to document Groq/Llama chat endpoint |
| `seed.yaml` | Added tags including groq, llama |

## Verification

- `tsc --noEmit` passes cleanly (zero errors)
- `npm install` succeeds
- `next build` has pre-existing p5.js/zod failure unrelated to this change
