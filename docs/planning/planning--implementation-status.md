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
| Age 18+ strict enforcement | `docs/legal/legal--aegis-protocol.md` | Implemented | `/src/api/src/modules/auth/auth.service.ts` (register validation), `/src/api/database/migrations/008_age_gate_terms_acceptance.sql`, `/src/web/app/register/page.tsx`, `/src/mobile/screens/RegisterScreen.tsx` | `/src/api/src/modules/auth/auth.service.spec.ts` | Compliance / Product |
| Web auth uses HttpOnly cookie JWTs | `src/web/README.md` | Implemented | `/src/web/contexts/AuthContext.tsx`, `/src/web/services/api-client.ts` | Code inspection; cookies set with httpOnly flag | Web |
| Web auth is client-side JWT today | Current runtime | Implemented | `/src/web/contexts/AuthContext.tsx`, `/src/web/services/api-client.ts`, `/src/web/proxy.ts` | Web typecheck (`/src/web`), runtime code path | Web |
| Sentry error monitoring | Operational requirement | Implemented | `/src/api/src/main.ts` (Sentry.init), `/src/web/app/error.tsx`, `/src/api/src/common/monitoring/` | Runtime integration; error boundaries in web | Platform |
| Daily attestation flow (Recovery stream) | `planning--phase1-private-beta-scope.md` | Implemented | `/src/api/src/modules/contracts/contracts.service.ts` (getAttestationStatus, submitAttestation), `/src/api/src/modules/contracts/contracts.controller.ts`, `/src/web/app/contracts/[id]/attest/page.tsx`, `/src/mobile/screens/AttestationScreen.tsx` | `/src/api/src/modules/contracts/contracts.service.spec.ts` | Product |
| Contest official rules published | `docs/legal/legal--compliance-guardrails.md` §4.C | Implemented | `/src/web/app/legal/rules/page.tsx` | Web build; route `/legal/rules` | Legal |
| Responsible use disclosures published | `docs/legal/legal--compliance-guardrails.md` §4.E | Implemented | `/src/web/app/legal/responsible-use/page.tsx` | Web build; route `/legal/responsible-use`; links to NCPG, SAMHSA, NEDA, NDVH | Legal |
| Site-wide footer with legal page links | UX / compliance discoverability | Implemented | `/src/web/components/SiteFooter.tsx`, `/src/web/app/layout.tsx` | Web build; all 4 legal routes linked in footer | Web |
| Legal pages cross-linked ("Related Policies") | UX / compliance discoverability | Implemented | `/src/web/app/legal/terms/page.tsx`, `/src/web/app/legal/privacy/page.tsx`, `/src/web/app/legal/rules/page.tsx`, `/src/web/app/legal/responsible-use/page.tsx` | Web build; each page links to the other 3 | Web / Legal |
| Push notifications (local scheduling) | `research--behavioral-engineering-masters.md` | Partial | `/src/mobile/services/NotificationService.ts` (expo-notifications), `/src/mobile/services/ApiClient.ts` (registerPushToken) | `/src/mobile/services/NotificationService.spec.ts`; graceful degradation when package unavailable | Mobile |
| Mobile deep linking (styx:// URL scheme) | UX / push notification routing | Implemented | `/src/mobile/config/linking.ts` (LinkingOptions + resolveNotificationDeepLink), `/src/mobile/App.tsx` (NavigationContainer linking prop + notification tap handler) | `/src/mobile/config/linking.spec.ts` (18 tests) | Mobile |
| Endpoint smoke tests (staging + beta) | Operational / CI | Implemented | `/scripts/smoke/check-endpoints.sh`, `/scripts/smoke/staging-smoke.sh`, `/scripts/smoke/beta-smoke.sh` | Script validates health, auth guards, public routes, rate limiting, legal pages | Platform |
| Unified beta readiness contract + artifact (`beta-readiness-summary.json`) | Phase 1 release operations | Implemented | `/scripts/smoke/beta-readiness.sh`, `/docs/planning/planning--beta-readiness-contract.md`, `/.github/workflows/ci.yml` | `npm run beta:readiness` emits `artifacts/beta-readiness-summary.json`; CI uploads artifact in `beta_readiness` job | Platform |
| B2B consumption billing (real DB queries) | `architecture--feasibility-stack.md` | Implemented | `/src/api/services/b2b/billing.service.ts` (consumption_logs table), `/src/api/database/schema.sql` | `/src/api/services/b2b/billing.service.spec.ts` | API / B2B |
| CRM service (Salesforce/HubSpot connectors) | B2B integration | Implemented | `/src/api/services/b2b/crm.service.ts` (graceful fallback) | `/src/api/services/b2b/crm.service.spec.ts` | API / B2B |
| Desktop component test coverage | Quality / CI | Implemented | `/src/desktop/src/components/LedgerInspector.spec.tsx`, `/src/desktop/src/components/MacroReview.spec.tsx` (+ 5 more) | 128 tests across LedgerInspector, MacroReview, ExilePanel, B2BOrchestration, HashCollider, NetworkGuard, LoginScreen | Desktop |
| Web page + component test coverage | Quality / CI | Implemented | `/src/web/app/dashboard/page.test.tsx`, `/src/web/components/SiteFooter.test.tsx` (+ 25 more) | 166 tests across 27 suites (all pages + key components) | Web |
| Notifications controller spec | Quality / CI | Implemented | `/src/api/src/modules/notifications/notifications.controller.spec.ts` | Controller-level test coverage for notifications module | API |
| Legal compliance guardrails long-form memo is product policy | `docs/legal/legal--compliance-guardrails.md` (old presentation) | Research | `/docs/legal/legal--compliance-guardrails.md` | Labeled as research memo | Compliance |

## Notes

- Use `/src/api/src/modules/compliance/compliance-policy.service.ts` as the canonical place for request-level jurisdiction policy decisions.
- Update this matrix in the same PR whenever `README.md`, `SECURITY.md`, or legal policy docs change claim wording.
- When KYC/age verification is implemented, upgrade the corresponding rows from `Planned` to `Implemented` only after tests and rollout controls are merged.
