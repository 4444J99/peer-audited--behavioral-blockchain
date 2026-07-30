# Enterprise Compliance Packaging — SOC 2-Track Control Inventory

**Date:** 2026-07-30
**Audience:** Enterprise buyers, security reviewers, and the SOC 2 readiness workstream.
**Honesty note:** Styx is **SOC 2-track, not SOC 2-certified**. No Type I or Type II
audit has been engaged. This document maps the SOC 2 Trust Services Criteria to
controls the codebase **actually enforces today**, with the enforcing module path for
each. Anything aspirational is labeled as such. Pair with
`docs/enterprise/security-questionnaire.md` for questionnaire-format answers.

---

## 1. Control Inventory

Every control below cites the module that enforces it. "Enforced" means the control is
active in the wired application, not merely present in the tree.

### C-1. Tamper-Evident Audit Log

| | |
|---|---|
| **TSC mapping** | CC7.2, CC7.3 (system monitoring), PI1.4 (processing integrity) |
| **What the code enforces** | Every compliance-significant event (settlements, kill-switch toggles, attestation failures, CCPA requests, ticket purchases) is appended to a SHA-256 hash-chained `event_log`. Each entry's hash covers `index \| event_type \| timestamp \| previous_hash \| payload`; `verifyChain()` walks the chain from genesis and recomputes every hash, tracking the running head so a self-consistent forged fork is still detected. |
| **Enforcing code** | `src/api/services/ledger/truth-log.service.ts` (chain + `verifyChain()`); append-side advisory lock serialization visible in `src/api/src/modules/users/ccpa.service.ts` (`pg_advisory_xact_lock` before append) |
| **Complementary** | Double-entry ledger with balanced-entry enforcement: `src/api/services/ledger/ledger.service.ts`; validation gate `scripts/validation/01-phantom-money-check.ts` |

### C-2. Access Controls

| | |
|---|---|
| **TSC mapping** | CC6.1–CC6.3 (logical access) |
| **What the code enforces** | JWT authentication on protected routes; role-gated admin surfaces (`@Roles('ADMIN')`); banned-user and integrity-tier gating; compliance-artifact acceptance gating. B2B endpoints are additionally scoped so an admin token alone does not grant cross-enterprise data access (`enterprise-scope.service.ts`). |
| **Enforcing code** | `src/api/src/guards/auth.guard.ts` (JWT), `src/api/src/common/guards/role.guard.ts` (role checks, used e.g. by `@Roles('ADMIN')` on `src/api/src/modules/b2b/b2b.controller.ts`), `src/api/src/guards/banned-user.guard.ts`, `src/api/src/guards/tier.guard.ts`, `src/api/src/common/guards/compliance-access.guard.ts`, `src/api/src/modules/b2b/enterprise-scope.service.ts` |
| **Complementary** | Global rate limiting (60 req/min) via `ThrottlerModule` in `src/api/src/app.module.ts`; secrets fail-closed at boot (e.g. `src/api/services/escrow/stripe.service.ts` throws in production without a real `STRIPE_SECRET_KEY`; `ENTERPRISE_SSO_SECRET` required for SSO — see `docs/CLAUDE.md` Environment) |

### C-3. Geofence — Fail-Closed Jurisdiction Enforcement

| | |
|---|---|
| **TSC mapping** | CC3.2 (risk mitigation), plus the platform's own regulatory obligations |
| **What the code enforces** | Every monetized action resolves the caller's US state. Unknown/foreign/missing location → `TIER_3 HARD_BLOCK` (fail-closed default; opening up requires explicit `GEOFENCE_FAIL_OPEN_ON_MISSING_HEADERS=true`). Spoofable forwarding headers (`cf-ipstate`, `x-forwarded-for`, `cf-connecting-ip`, `x-real-ip`) are only trusted behind `TRUST_PROXY_HEADERS=true`; the dev-only `x-styx-state` override is ignored in production. Every decision is written to the `compliance_decisions` audit table. |
| **Enforcing code** | `src/api/services/geofencing.ts` (`STATE_TIERS`, `classifyJurisdiction` — unlisted state defaults to `TIER_3`), `src/api/src/modules/compliance/compliance-policy.service.ts` (`shouldFailOpenOnMissingLocation`, header-trust gating, `logDecision`), `src/api/src/common/guards/geofence.guard.ts` (request-time enforcement), DB registry + audit tables in `src/api/database/migrations/010_settlements_and_jurisdictions.sql` |

### C-4. KYC / Identity and AML

| | |
|---|---|
| **TSC mapping** | CC1.1/CC1.4 (integrity & ethical values), plus BSA/AML program obligations |
| **What the code enforces** | KYC: enforcement is default-ON in production and fails closed (`KYC_ENFORCEMENT_ENABLED` must be explicitly `false` to disable, which logs at error level). Stakes above the TIER_1 $20 micro-stake threshold require verified identity. Age gate (>=18, from stored DOB) is enforced unconditionally and fails closed on missing DOB. AML: watchlist screening with risk levels (CLEAR/FLAGGED/BLOCKED), CTR threshold at $10,000, structuring detection ($3,000+ x3 within 24h), rapid-movement detection (48h window), SAR report drafting. |
| **Enforcing code** | `src/api/src/modules/compliance/compliance-policy.service.ts` (`evaluateKycRequirement`, `evaluateAgeRequirement`, `onModuleInit` loud-disable logging), `src/api/src/modules/compliance/identity-verification.service.ts`, `src/api/src/modules/compliance/identity-provider.service.ts` (Mock + Stripe Identity adapters), `src/api/src/modules/compliance/aml-screening.service.ts`; tables in `src/api/database/migrations/054_ccpa_aml.sql` and `059_aml_tables.sql` |
| **Caveat (honest)** | The AML HTTP surface (`src/api/src/modules/compliance/aml.controller.ts`, `/compliance/aml/*`) was unregistered until branch `feat/omega-completion` wired it into `compliance.module.ts`. The production identity provider default is the mock adapter until the Stripe Identity contract is provisioned (human-gated). |

### C-5. CCPA / GDPR Data Rights

| | |
|---|---|
| **TSC mapping** | P-series privacy criteria (P4.x data subject rights, P5.x retention/disposal) |
| **What the code enforces** | CCPA: deletion requests and do-not-sell opt-out with California residency verification, statuses PENDING→COMPLETED/DENIED, all appended to the tamper-evident TruthLog (routes `POST/GET /users/me/ccpa/deletion-request`, `POST /users/me/ccpa/opt-out`). GDPR: erasure pipeline with a daily 04:00 cron sweep processing pending deletions. Analytics exports are anonymized before leaving the trust boundary. |
| **Enforcing code** | `src/api/src/modules/users/ccpa.service.ts` + routes in `src/api/src/modules/users/users.controller.ts`, `src/api/src/modules/users/gdpr.service.ts` + `src/api/src/modules/users/gdpr.scheduler.ts` (`@Cron('0 4 * * *')`), `src/api/services/security/anonymization.service.ts`, `src/api/src/modules/b2b/anonymize.service.ts`; schema in `054_ccpa_aml.sql` and `014_security_and_gdpr_hardening.sql` |
| **Added by `feat/omega-completion`** | A general data-retention scheduler (automated purge of expired artifacts per retention policy) extending the GDPR sweep, plus its backing migration (058–062 range). |

### C-6. Settlement Kill Switch (Refund-Only Override)

| | |
|---|---|
| **TSC mapping** | CC7.4/CC7.5 (incident response) |
| **What the code enforces** | An admin-only switch that forces **every** settlement disposition to REFUND regardless of jurisdiction — the compliance incident response for the money path. Toggles are audit-logged to the TruthLog (`KILL_SWITCH_TOGGLED` with admin id). Independent of the switch, any unresolved/unknown tier already fails closed to REFUND. |
| **Enforcing code** | `src/api/src/modules/compliance/jurisdiction-disposition.mapper.ts` (`setRefundOnlyMode` / disposition logic), `src/api/src/modules/admin/admin.controller.ts` (`GET/POST /admin/kill-switch`, role-gated) |
| **Caveat (honest)** | Until branch `feat/omega-completion`, the switch state was a static in-memory boolean — a process restart silently disarmed it. This branch persists it to the database so the armed state survives restarts and multi-instance deployments. |

### C-7. Device Attestation (Hardware-Backed Anti-Spoofing)

| | |
|---|---|
| **TSC mapping** | CC6.8 (unauthorized software), PI1.2 (input integrity) |
| **What the code enforces** | Server-side verification of iOS App Attest assertions and Android Play Integrity verdicts: per-user registered key lookup (revocable), assertion structural validation, RP-ID/flags checks, monotonic counter replay detection, and TruthLog events on failures (`DEVICE_ATTESTATION_KEY_NOT_FOUND` etc.). Key registry in migration `051_device_attestation_keys.sql`. |
| **Enforcing code** | `src/api/services/security/device-attestation.service.ts` (provided via `compliance.module.ts`) |
| **Caveat (honest)** | The service's own doc-comment states production requires the Apple App Attest root certificate and the Play Integrity verification secret. Full certificate-chain / JWT-signature cryptography is being completed by branch `feat/omega-completion`; provisioning the Apple/Google credentials remains a human-gated operations task. |

### C-8. Supporting Controls (cited for completeness)

- **Fraud/collusion analytics:** `src/api/services/security/collusion-detection.service.ts` (voting-pattern union-find clustering), `src/api/src/modules/security/anti-sybil.service.ts` (device fingerprint cross-account detection; module wired by `feat/omega-completion`), `src/api/services/anomaly/` (pHash duplicate detection, EXIF validation)
- **User safety:** `src/api/services/security/crisis-detection.service.ts` + crisis module; `src/api/services/security/self-exclusion.service.ts`; Aegis health guardrails in `src/api/services/health/`
- **Escrow custody:** FBO model with production fail-closed key check — `src/api/services/escrow/stripe.service.ts`, `docs/adr/adr--002-fbo-escrow-model.md`, migration `056_fbo_accounts.sql`
- **CI security gates:** `scripts/validation/06-security-invariant-check.ts` (no hardcoded secrets/backdoors in production output), CodeQL + security audit in CI (`docs/CLAUDE.md` Infrastructure)

---

## 2. Known Gaps (do not oversell)

1. **No SOC 2 audit engaged.** Control inventory ≠ attestation. Engaging an auditor is
   a procurement decision (human-gated).
2. **Attestation crypto credentials** (Apple root cert, Play Integrity secret) not
   provisioned; code path fails closed without them.
3. **Identity provider** production contract (Stripe Identity) not signed; mock adapter
   is the non-production default.
4. **AML watchlists are internal tables** (`internal_watchlist`, `internal_blocklist`) —
   no OFAC/sanctions data-feed subscription exists yet; screening quality is bounded by
   list quality (human-gated vendor decision).
5. **Kill-switch persistence and retention scheduler** land with `feat/omega-completion`;
   before it, C-6's caveat applied in full.
6. **Formal access reviews, vendor management, BCP/DR documentation** — standard SOC 2
   policy artifacts do not exist yet; only the technical controls above do.
