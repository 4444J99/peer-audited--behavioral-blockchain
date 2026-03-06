# ADR-005: Dual Rate Limiting (API Throttle + Edge Limiting)

## Status

Accepted

## Context

Styx exposes two distinct attack surfaces that require rate limiting:

1. **NestJS API** (`src/api/`) — authenticated endpoints for contracts, wallet, fury, escrow operations
2. **Ask-Styx Cloudflare Worker** (`src/ask-styx/`) — public-facing AI chat endpoint (unauthenticated)

A single rate-limiting strategy cannot cover both: the API needs per-user throttling tied to JWT identity, while the edge worker needs IP-based limiting without access to the user database.

## Decision

Implement **two independent rate-limiting layers**:

### Layer 1: API Throttle (NestJS)

- **Scope**: All authenticated API endpoints
- **Identity**: JWT user ID (extracted by auth guard)
- **Strategy**: NestJS `@nestjs/throttler` with per-route configuration
- **Storage**: Redis (shared across API instances)
- **Defaults**: Configured per endpoint sensitivity (stricter for financial operations)

### Layer 2: Edge Rate Limiting (Cloudflare Worker)

- **Scope**: `src/ask-styx/worker/index.ts` — public AI chat
- **Identity**: Client IP (`request.headers.get('cf-connecting-ip')`)
- **Strategy**: In-memory sliding window (Map-based)
- **Window**: 60 seconds, max 30 requests per IP
- **Response**: HTTP 429 with `Retry-After` header

```typescript
// From src/ask-styx/worker/index.ts
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 30;
```

### Why Two Layers

| Concern | API Throttle | Edge Limiter |
|---------|-------------|--------------|
| Identity | JWT user ID | IP address |
| Storage | Redis (persistent) | In-memory Map (ephemeral) |
| Scope | Authenticated endpoints | Public AI chat |
| Reset | Per-user, persists across requests | Per-worker instance, resets on deploy |
| Cost | Redis read/write per request | Zero (in-memory) |

## Consequences

**Positive:**
- Edge limiting protects the LLM API key (Groq) from abuse without requiring authentication
- API throttle prevents authenticated users from abusing financial endpoints
- Each layer is independently tunable — edge limits can be tightened without affecting logged-in users
- Edge limiter has zero external dependencies (no Redis needed at the edge)

**Negative:**
- In-memory edge limiting resets on worker redeploy (acceptable for abuse prevention, not for billing)
- IP-based limiting can be bypassed by distributed attacks or VPNs (mitigated by Cloudflare's built-in DDoS protection)
- Two separate implementations to maintain
- Edge limiter Map grows unbounded in theory (mitigated by worker lifecycle — Cloudflare recycles workers)

## Alternatives Considered

1. **Single Redis-backed limiter for both** — rejected. The ask-styx worker runs on Cloudflare's edge, not in the same infrastructure as Redis. Adding a Redis dependency to the worker would add latency and a failure mode.

2. **Cloudflare Rate Limiting product** — considered. Would work but adds cost and configuration outside the codebase. The in-memory approach is sufficient for the current scale and keeps rate-limiting logic auditable in source.

3. **No edge limiting (rely on Cloudflare WAF only)** — rejected. WAF rules are coarse-grained. The 30 req/min limit is specific to LLM API cost protection, not DDoS prevention.

## Related

- Ask-Styx worker: `src/ask-styx/worker/index.ts`
- API auth guard: `src/api/guards/auth.guard.ts`
- Queue config (Redis connection): `src/api/config/queue.config.ts`
- Deploy workflow: `.github/workflows/deploy-ask-styx.yml`
