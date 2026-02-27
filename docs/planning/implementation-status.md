# Implementation Status (Claim-to-Control Matrix)

This document maps high-level product/security/compliance claims to their current implementation status.

Statuses:
- `Implemented`: Runtime control exists and is exercised in code/tests.
- `Partial`: Control exists but behavior is incomplete, conditional, or environment-dependent.
- `Planned`: Documented policy/intent only; runtime control not yet implemented.
- `Research`: External analysis or exploratory content; not product policy.

| Claim | Source | Status | Code Paths | Tests / Evidence | Owner |
|---|---|---|---|---|---|
| Global + endpoint-specific rate limiting (`@nestjs/throttler`) | `README.md`, `SECURITY.md` | Implemented | `/src/api/src/app.module.ts`, `/src/api/src/modules/auth/auth.controller.ts`, `/src/api/src/modules/contracts/contracts.controller.ts`, `/src/api/src/modules/proofs/proofs.controller.ts` | Typechecked + API route decorators in source | API |
| JWT secret required in production | `README.md`, `SECURITY.md` | Implemented | `/src/api/src/modules/auth/auth.service.ts`, `/src/api/src/main.ts` | `/src/api/src/modules/auth/auth.service.spec.ts` (token behavior) | API |
| JWT has no fallback secret | `SECURITY.md` (old wording) | Partial | `/src/api/src/modules/auth/auth.service.ts` (dev/test fallback remains) | Code inspection | API |
| Geofencing by jurisdiction tier | `README.md`, `SECURITY.md` | Partial | `/src/api/services/geofencing.ts`, `/src/api/src/common/guards/geofence.guard.ts`, `/src/api/src/modules/compliance/compliance-policy.service.ts` | `/src/api/src/common/guards/geofence.guard.spec.ts` | API / Compliance |
| `TIER_2` refund-only restrictions on monetary-risk actions | Plan / runtime policy | Implemented (initial scope) | `/src/api/src/modules/compliance/compliance-policy.service.ts` | `/src/api/src/common/guards/geofence.guard.spec.ts` | API / Compliance |
| `x-styx-state` geofence override header is test-only (non-production) | Plan / runtime policy | Implemented | `/src/api/src/modules/compliance/compliance-policy.service.ts`, `/src/api/src/common/guards/geofence.guard.ts` | `/src/api/src/common/guards/geofence.guard.spec.ts` | API / Compliance |
| Missing geolocation headers default fail-open (configurable) | Plan / runtime policy | Implemented | `/src/api/src/modules/compliance/compliance-policy.service.ts`, `.env.example` | `/src/api/src/common/guards/geofence.guard.spec.ts` | API / Compliance |
| KYC / identity verification runtime enforcement | `docs/legal/legal--aegis-protocol.md` | Planned | (No runtime enforcement yet; reserved flag `KYC_ENFORCEMENT_ENABLED`) | `.env.example`, `/src/api/src/modules/compliance/compliance-policy.service.ts` capability flag | Compliance / Platform |
| Age 18+ strict enforcement | `docs/legal/legal--aegis-protocol.md` | Planned | (No runtime age verification gate yet) | Policy only; tracked here for claim transparency | Compliance / Product |
| Web auth uses HttpOnly cookie JWTs | `src/web/README.md` (old wording) | Planned (migration) | Current runtime is `/src/web/contexts/AuthContext.tsx` + `/src/web/services/api-client.ts` | Code inspection | Web |
| Web auth is client-side JWT today | Current runtime | Implemented | `/src/web/contexts/AuthContext.tsx`, `/src/web/services/api-client.ts`, `/src/web/proxy.ts` | Web typecheck (`/src/web`), runtime code path | Web |
| Legal compliance guardrails long-form memo is product policy | `docs/legal/legal--compliance-guardrails.md` (old presentation) | Research | `/docs/legal/legal--compliance-guardrails.md` | Labeled as research memo | Compliance |

## Notes

- Use `/src/api/src/modules/compliance/compliance-policy.service.ts` as the canonical place for request-level jurisdiction policy decisions.
- Update this matrix in the same PR whenever `README.md`, `SECURITY.md`, or legal policy docs change claim wording.
- When KYC/age verification is implemented, upgrade the corresponding rows from `Planned` to `Implemented` only after tests and rollout controls are merged.
