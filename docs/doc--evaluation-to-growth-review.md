# Styx: Evaluation-to-Growth Review

> **Framework**: Evaluation-to-Growth (4-phase: Critique → Reinforcement → Risk Analysis → Growth)
> **Subject**: Styx — Peer-audited behavioral market ("The Blockchain of Truth")
> **Date**: 2026-02-28
> **Scope**: Full codebase — 6 workspaces, 15+ API modules, 20+ web pages, shared libraries, CI/CD, database schema, infrastructure
> **Test suite**: 1,318 tests across 122 test files

---

## Executive Summary

Styx is a Turborepo monorepo implementing a behavioral commitment market where users stake money on personal goals, audited by a decentralized "Fury" peer network. The architecture is structurally sound: a clean dual-layer API (domain services + NestJS modules), a double-entry ledger with hash-chained audit log, parameterized SQL throughout, and a comprehensive CI pipeline with custom validation gates.

The most impressive aspect is the **ethical guardrail system** — the Aegis protocol prevents revenge staking, the Recovery Protocol enforces accountability partner requirements, and the system deliberately limits itself to protect vulnerable users. This is not just a tech product; it is a product that has thought deeply about its duty of care.

However, critical issues exist beneath the surface:

1. **Security Gate 06 is silently broken** — a missing parameter in a recursive call means the security invariant scanner only checks top-level files, not nested build output (`scripts/validation/06-security-invariant-check.ts:59`).
2. **No Stripe idempotency keys** — payment intent creation can produce duplicates on network retry (`src/api/services/escrow/stripe.service.ts:54`).
3. **Linguistic cloaker corrupts common English** — regex patterns for "bet" and "stake" lack word boundaries, transforming "between" → "commitmentween" and "mistake" → "mivault" (`src/web/utils/linguistic-cloak.ts:13-14`).
4. **Hash chain `verifyChain()` is defined but never called** — the tamper-evident audit log exists but integrity is never verified (`src/api/services/ledger/truth-log.service.ts:14`).
5. **Floating-point money throughout the ledger** — JavaScript `number` for financial amounts creates accumulated drift risk (`src/api/services/ledger/ledger.service.ts:15`).

The system is in a strong position for its PUBLIC_PROCESS promotion status. The issues identified are fixable without architectural changes.

---

## Phase 1: Evaluation

### 1.1 Critique (Strengths & Weaknesses)

#### Strengths

**S1. Dual-layer API architecture**
The API separates pure business logic (`src/api/services/`) from HTTP/DI wiring (`src/api/src/modules/`). Domain services like `LedgerService`, `AegisProtocolService`, and `RecoveryProtocolService` are constructor-injected, stateless, and independently testable. This is textbook hexagonal architecture applied to NestJS.

**S2. Parameterized SQL everywhere**
Every database query across all 15+ service files uses parameterized placeholders (`$1`, `$2`, etc.). No string interpolation, no template literals building SQL. Zero SQL injection vectors found.
- `src/api/services/ledger/ledger.service.ts:37` — `[debitAccountId, creditAccountId, amount, ...]`
- `src/api/src/modules/auth/auth.service.ts:61` — `'SELECT id FROM users WHERE email = $1', [email]`

**S3. Hash-chained audit log**
The `TruthLogService` implements a SHA-256 hash chain with `FOR UPDATE` row locking to prevent race conditions during concurrent inserts (`src/api/services/ledger/truth-log.service.ts:58-65`). Each event's hash includes the previous hash and payload, creating a tamper-evident chain. The genesis hash is deterministic (`'GENESIS_HASH'`).

**S4. Fail-closed production guards**
Critical services hard-fail if production env vars are missing:
- `src/api/src/main.ts:56-57` — CORS_ORIGINS required in production
- `src/api/src/modules/auth/auth.service.ts:11-12` — JWT_SECRET required in production
- `src/api/services/escrow/stripe.service.ts:14-18` — STRIPE_SECRET_KEY required and cannot be mock value

**S5. CSRF double-submit cookie protection**
Cookie-based auth requests require a matching `x-csrf-token` header and `styx_csrf_token` cookie for all mutating methods (POST/PUT/PATCH/DELETE). The guard correctly skips CSRF validation for Bearer token auth and SSE ticket auth.
- `src/api/guards/auth.guard.ts:40-42` — CSRF enforcement
- `src/api/guards/auth.guard.ts:72-85` — Method and token validation

**S6. Comprehensive test coverage**
1,318 tests across 122 files covering domain services, controllers, shared algorithms, web stores, and E2E flows. Tests co-locate as `*.spec.ts` alongside source files, following the NestJS convention.

**S7. Seven-gate CI pipeline**
Beyond standard lint/build/test, the CI includes:
- Gate 04: Redacted build check (no gambling vocabulary in production output)
- Gate 05: Behavioral physics check (constants match specification)
- Gate 06: Security invariant check (no hardcoded secrets in build output)
- Gate 07: Claim drift check (documentation matches code)
- CodeQL static analysis
- Terraform format + validate
- E2E via Playwright (Chromium + Firefox matrix)

**S8. Global exception filter with Sentry integration**
`GlobalHttpExceptionFilter` catches all exceptions, sanitizes error output in production (generic "Internal server error" with no stack traces), and reports unhandled errors to Sentry with trace IDs (`src/api/src/common/filters/global-http-exception.filter.ts:106-146`).

**S9. Auth route throttling**
Login, register, and enterprise SSO endpoints are individually throttled to 5 requests per 60 seconds via `@Throttle({ default: { ttl: 60000, limit: 5 } })` on top of the global rate limit (`src/api/src/modules/auth/auth.controller.ts:46,59,68`).

**S10. Request correlation IDs**
Every request gets a UUID trace ID propagated through headers (`x-styx-request-id`), attached to error responses, logged via pino, and sent to Sentry. Client-supplied request IDs are accepted for distributed tracing (`src/api/src/main.ts:35-46`).

#### Weaknesses

**W1. Module-scoped mutable auth token**
`src/web/services/api-client.ts:7-8` stores `currentToken` and `currentCsrfToken` as module-level `let` variables. This creates two problems:
1. **SSR token leakage**: In Next.js server-side rendering, module scope is shared across all concurrent requests, so one user's token could be visible to another's request.
2. **Page refresh amnesia**: After a browser refresh, the in-memory token is lost. The `useFuryStore.connectStream()` checks this token (`src/web/store/useFuryStore.ts:36-39`) and refuses to start polling if it's empty — even though cookie auth would work. This means Fury polling breaks on page refresh.

**W2. `as any` casts in financial code**
The Stripe service returns minimal mock objects cast as `any` in dev mode:
- `src/api/services/escrow/stripe.service.ts:52` — Mock PaymentIntent with 4 of ~30 fields
- `src/api/services/escrow/stripe.service.ts:67,75` — Same pattern for capture/cancel

Any code accessing unmocked fields (`.charges`, `.client_secret`, `.payment_method`) gets `undefined` in dev but real data in production. This creates behavioral divergence between environments.

**W3. No refresh token mechanism**
JWT tokens expire after 24 hours (`src/api/src/modules/auth/auth.service.ts:7`) with no silent renewal. For a financial application handling real stakes, a 24-hour window for a stolen token is significant. The web client has no retry-with-refresh interceptor — expired tokens produce raw API errors.

**W4. Linguistic cloaker lacks word boundaries**
`src/web/utils/linguistic-cloak.ts:13-14` — The "bet" pattern matches the substring `bet` anywhere (case-insensitive), transforming:
- "between" → "commitmentween"
- "better" → "commitmentter"
- "Elizabeth" → "Elizacommitment"

Similarly, "stake" transforms "mistake" → "mivault" and "stakeholder" → "vaultholder". The regex needs `\b` word boundary anchors.

**W5. Floating-point money in the ledger**
`src/api/services/ledger/ledger.service.ts:15` — Transaction amounts are typed as JavaScript `number` (IEEE 754 double). Balance calculations use `parseFloat()` on database results (`ledger.service.ts:73,99`). The integrity check compensates with a `0.0001` tolerance (`ledger.service.ts:145`), but this is a workaround for a systemic problem. Financial amounts should be integer cents or `NUMERIC`/`DECIMAL` types.

**W6. Mobile and desktop workspaces are placeholder-level**
The React Native mobile app and Tauri desktop app have functional UI scaffolding but no native bridge implementations (HealthKit, Google Fit, camera). These workspaces pass tests but would not survive a production audit.

**W7. Duplicated auth-check pattern in web pages**
Multiple Next.js pages individually check authentication and redirect to `/login`, rather than using a shared middleware or layout-level guard. This creates maintenance burden and inconsistent redirect timing.

---

### 1.2 Logic Check (Internal Consistency)

**LC1. Integrity score algorithm is internally consistent**
`src/shared/libs/integrity.ts:30-41` implements `Base(50) + 5*completions - 15*frauds - 20*strikes - 1*inactive_months` with a floor at 0. The tier thresholds (`integrity.ts:46-82`) are monotonically ordered and the constants match the specification in CLAUDE.md exactly.

**LC2. Tier system vs. Aegis protocol conflict**
The integrity score tier system (`src/shared/libs/integrity.ts:46-82`) allows `TIER_4_WHALE_VAULTS` (score >= 500) to stake unlimited amounts. However, `AegisProtocolService` (`src/api/services/health/aegis.service.ts:17,21`) enforces an absolute $500 hard cap on all stakes regardless of tier. These two systems are not reconciled — either Aegis is the final gate (making TIER_4 meaningless) or the tier system should be authoritative. The current behavior: Aegis wins, making the "unlimited" tier a dead letter.

**LC3. Fury accuracy formula is correct**
`src/shared/libs/integrity.ts:88-100` — `(successful - 3*falseAccusations) / total` with a 10-audit burn-in period and 0.8 demotion threshold. The 3x penalty for false accusations correctly creates asymmetric incentives favoring honest auditing.

**LC4. Grace day logic is pure and stateless**
`src/shared/libs/behavioral-logic.ts:120-139` — `useGraceDay()` validates the counter against `MAX_GRACE_DAYS_PER_MONTH` (2) and returns the new deadline. It does not mutate state, correctly deferring persistence to the caller.

**LC5. Behavioral constant alignment**
All shared constants (`LOSS_AVERSION_COEFFICIENT = 1.955`, `DOWNSCALE_STRIKE_THRESHOLD = 3`, `FAILURE_COOL_OFF_DAYS = 7`, `MISSED_ATTESTATION_AUTO_FAIL = 3`, `MAX_NOCONTACT_DURATION_DAYS = 30`, `MAX_NOCONTACT_TARGETS = 3`) match the specification values in CLAUDE.md. Gate 05 in CI validates this at build time (when configured).

**LC6. Database schema constraints align with service logic**
- `entries.amount > 0` constraint (`schema.sql:17`) mirrors `LedgerService.recordTransaction` guard (`ledger.service.ts:19`)
- `contracts.stake_amount > 0` constraint (`schema.sql:57`) mirrors Aegis validation
- `attestations (contract_id, attestation_date) UNIQUE` (`schema.sql:112`) prevents double daily attestations
- `stripe_events.event_id UNIQUE` (`schema.sql:156`) provides webhook idempotency
- `entries` FK `ON DELETE RESTRICT` (`schema.sql:15-16`) prevents orphaning ledger records

---

### 1.3 Logos Review (Rational/Factual Appeal)

**LO1. Double-entry ledger enforces financial integrity**
Every financial operation creates balanced debit/credit entries. The `verifyLedgerIntegrity()` method (`src/api/services/ledger/ledger.service.ts:109-149`) provides a global Phantom Money Test — the sum of all account balances must be zero. This is a direct implementation of the fundamental accounting equation and provides strong protection against money creation bugs.

**LO2. Loss aversion coefficient is research-grounded**
The `LOSS_AVERSION_COEFFICIENT = 1.955` (`src/shared/libs/behavioral-logic.ts:54`) comes from Tversky & Kahneman's prospect theory. The system uses this to calibrate messaging about potential losses, grounding the behavioral economics in peer-reviewed research rather than arbitrary numbers.

**LO3. Jurisdiction tiers map to actual US gambling law doctrine**
`src/api/services/geofencing.ts` classifies all 50 US states + DC into three tiers based on legal standards:
- TIER_1 (Predominance doctrine) — 33 states + DC — full access
- TIER_2 (Material Element doctrine) — 11 states — refund only
- TIER_3 (Any Chance doctrine) — 6 states (WA, AR, HI, UT, ID, SC) — hard block

This mapping reflects genuine legal scholarship on state-by-state gambling classification.

**LO4. Hash chain provides cryptographic tamper evidence**
The `TruthLogService` (`src/api/services/ledger/truth-log.service.ts:52-98`) creates a linked chain of SHA-256 hashes. The `FOR UPDATE` lock on the latest row prevents concurrent insertions from forking the chain. Combined with the `event_log` table's `previous_hash` and `current_hash` columns (`schema.sql:23-30`), this provides a provable audit trail.

**LO5. Honeypot injection creates auditor accountability**
The intelligence service injects known-outcome "honeypot" proofs into the Fury audit queue. Auditors who fail honeypots face accuracy penalties. This game-theoretic mechanism keeps auditors honest without requiring a central authority to manually review every audit.

---

### 1.4 Pathos Review (Emotional Resonance)

**PA1. Aegis protocol prevents emotional self-harm**
`src/api/services/health/aegis.service.ts:17-26` — The $500 absolute stake cap, combined with the 3-failure downscale to $50 (`aegis.service.ts:37-42`), directly addresses "revenge staking" — the behavioral finance pattern where users double down after losses. The error messages are deliberately verbose and educational:

> *"Aegis Violation: Proposed stake ($X) exceeds the absolute psychological safety ceiling of $500. Contract rejected to prevent emotional self-harm."*

This is not just input validation — it is a product that actively refuses to let users hurt themselves.

**PA2. Recovery protocol enforces accountability and prevents isolation**
`src/api/services/health/recovery-protocol.service.ts:25-80` — Recovery contracts (e.g., no-contact commitments) require:
- An accountability partner email (line 39)
- Maximum 3 no-contact targets to prevent self-isolation (line 62)
- Maximum 30-day duration with forced renewal (line 47)
- Four safety acknowledgments: voluntary consent, no minors, no dependents, no legal obligations (lines 71-77)

The `noMinors` check prevents the system from being weaponized in custody disputes. The `noDependents` check prevents users from using it to shirk caregiving. These are deeply considered ethical guardrails.

**PA3. Grace day system provides breathing room**
2 grace days per month with 24-hour deadline extensions (`src/shared/libs/behavioral-logic.ts:120-139`) acknowledge that humans have bad days. The system is firm but not punitive — it creates space for recovery without eliminating accountability.

**PA4. Linguistic cloaker masks triggering vocabulary**
`src/web/utils/linguistic-cloak.ts:19` — The word "relapse" is replaced with "setback" in App Store/Stripe contexts. Beyond compliance, this has genuine emotional benefit for users in recovery programs who may find clinical language triggering.

---

### 1.5 Ethos Review (Credibility & Authority)

**ET1. Security posture is production-grade**
The bootstrap sequence (`src/api/src/main.ts`) applies: Helmet security headers, 1MB body size limits, ValidationPipe with whitelist stripping, GlobalHttpExceptionFilter, CORS fail-closed in production, Swagger gated behind `!isProduction`, graceful shutdown hooks, and Sentry error monitoring. This is not a tutorial project — it is a security-conscious production API.

**ET2. Error sanitization prevents information leakage**
`src/api/src/common/filters/global-http-exception.filter.ts:120-135` — In production, unhandled exceptions return only `"Internal server error"` with no stack traces, error names, or internal details. Non-production environments get full error context for debugging. This is correct information hiding.

**ET3. Anti-enumeration on login**
`src/api/src/modules/auth/auth.service.ts:111-128` — All login failure modes (missing user, missing password hash, inactive account, wrong password) return the identical message `"Invalid email or password"`. This prevents attackers from discovering which emails are registered.

**ET4. Beta transparency**
`src/api/src/modules/beta/beta.controller.ts:14-24` — Feature flags explicitly declare `privateBeta: true`, `testMoneyMode: true`, and `allowlistUsOnly: true`. The mobile bootstrap endpoint exposes a clear compliance notice: *"Private beta access is limited to invited US allowlist participants. Identity/KYC flows remain non-production in this pilot."* This is honest communication about the system's maturity.

**ET5. CI enforces code integrity**
CodeQL static analysis, `npm audit --audit-level=high`, Terraform validation, Playwright E2E on both Chromium and Firefox, and four custom validation gates. The pipeline runs on every push to main and every PR. This demonstrates engineering discipline.

---

## Phase 2: Reinforcement

### 2.1 Synthesis (Contradictions → Resolution)

**C1. Registration leaks email existence despite anti-enumeration on login**
- **Login** (`auth.service.ts:111-128`): Uniform error message prevents enumeration
- **Registration** (`auth.service.ts:63`): `ConflictException('Email already registered')` reveals whether an email exists

**Resolution**: This is a deliberate UX tradeoff. Fully hiding email existence on registration creates a confusing experience ("I registered but got no confirmation?"). The standard industry approach is to accept the registration and send a "if this email exists..." email. For Styx's current beta phase with an allowlist, the current approach is acceptable but should be revisited before public launch.

**C2. Aegis $500 cap vs. integrity tier system unlimited staking**
- **Aegis** (`aegis.service.ts:17`): Hard cap at $500 for all users
- **Integrity tiers** (`integrity.ts:46-82`): TIER_4 allows unlimited stakes

**Resolution**: Aegis is the final safety gate, not the tier system. The tier system determines *eligibility* (what you could theoretically do), while Aegis determines *safety* (what you should actually be allowed to do). The $500 cap should be documented as the Aegis override, and TIER_4 should be annotated as "unlimited subject to Aegis safety ceiling." This is not a bug — it's an undocumented design decision.

**C3. SSE infrastructure exists but web client uses polling**
- **API**: SSE ticket/cookie endpoints exist for both notifications and Fury streams
- **Web**: `useFuryStore.ts` uses 5-second HTTP polling; `NotificationPanel.tsx` attempts SSE but falls back to 30-second polling

**Resolution**: The SSE → polling migration was a pragmatic response to Vercel's serverless deployment (SSE requires persistent connections). `NotificationPanel.tsx:37-107` shows the correct pattern: try SSE first, fall back to polling with reconnection attempts. `useFuryStore.ts` should adopt the same pattern rather than polling-only.

**C4. `signToken` is public but used only internally**
- `src/api/src/modules/auth/auth.service.ts:134` — `signToken` is not marked `private`
- All callers are internal methods within `AuthService`

**Resolution**: This should be `private`. Any code with an `AuthService` reference can currently mint arbitrary tokens.

---

## Phase 3: Risk Analysis

### 3.1 Blind Spots

**BS1. Hash chain integrity is never verified in production**
`src/api/services/ledger/truth-log.service.ts:14` defines `verifyChain()`, which walks the entire `event_log` table and re-computes SHA-256 hashes. This method is implemented, has a spec (`truth-log.service.spec.ts`), but is **never called** from any endpoint, scheduled job, or cron. The chain exists but no one ever checks if it has been tampered with.

**Impact**: The "blockchain of truth" marketing claim rests on an integrity mechanism that is defined but dormant. A compromised database administrator could modify event_log rows without detection.

**BS2. No database-level immutability on event_log**
`src/api/database/schema.sql:23-30` — The `event_log` table has no `BEFORE UPDATE OR DELETE` trigger to prevent row modification. The hash chain provides tamper *detection* (via the unexecuted `verifyChain`), but not tamper *prevention*. Any `UPDATE` or `DELETE` query against `event_log` will succeed silently.

**BS3. GDPR data export/deletion not implemented**
The system handles financial data for users who may be in EU-adjacent jurisdictions (non-US users default to TIER_1 full access per `src/api/services/security/geofence.service.ts:24`). The `api.deleteAccount()` endpoint exists on the web client (`src/web/services/api-client.ts:412-415`), but there is no evidence of a GDPR-compliant data export flow or right-to-erasure implementation that handles the ledger's immutability constraints.

**BS4. BMI floor and weight velocity cap are imported but unenforced**
`src/api/services/health/aegis.service.ts:2` imports `MIN_SAFE_BMI` (18.5) and `MAX_WEEKLY_LOSS_VELOCITY_PCT` (0.02) from `behavioral-logic.ts` but never uses them. These medical guardrails — designed to prevent users from using the system to pursue dangerous weight loss — are defined in the specification but unimplemented in code.

**BS5. Missing ledger indexes**
`src/api/database/schema.sql` has no indexes on `entries.debit_account_id`, `entries.credit_account_id`, or `entries.contract_id`. Balance calculations (`ledger.service.ts:64-73`) and contract audit trail queries (`ledger.service.ts:88-93`) require full table scans. At production scale with thousands of entries, these queries will degrade.

**BS6. No account lockout after failed login attempts**
The auth throttle (`auth.controller.ts:59`) limits to 5 login attempts per minute per IP. However, there is no cumulative account lockout — an attacker can try 5 passwords per minute per IP indefinitely. With a botnet, this becomes trivially parallelizable. The auth service does not track failed attempts per account.

---

### 3.2 Shatter Points

**SP1. Security Gate 06 is silently broken** (Critical)
`scripts/validation/06-security-invariant-check.ts:59` — The recursive call to `collectFiles(full)` omits the required `extensions` parameter (defined on line 50 as `collectFiles(dir: string, extensions: Set<string>)`). When the function recurses into a subdirectory:
1. `extensions` is `undefined`
2. Line 60 (`extensions.has(extname(full))`) throws `TypeError: Cannot read properties of undefined (reading 'has')`
3. The `try/catch` on line 56-65 catches the error silently ("Skip unreadable files")
4. Only top-level files in `src/api/dist/` and `src/web/.next/` are scanned

**Impact**: The security invariant check — designed to ensure no hardcoded dev tokens reach production — only scans the root level of each build directory. All compiled output in subdirectories (`dist/modules/`, `.next/static/`, `.next/server/`) is silently skipped. The gate passes with a false sense of security.

**SP2. No Stripe idempotency keys** (High)
`src/api/services/escrow/stripe.service.ts:54-61` — `stripe.paymentIntents.create()` is called without an `idempotencyKey`. If a network timeout occurs during hold creation and the caller retries, a duplicate PaymentIntent is created, potentially double-charging the user. For a financial escrow system, this is a significant monetary risk. Stripe strongly recommends idempotency keys for all write operations.

**SP3. Malformed date-of-birth bypasses age verification** (Medium)
`src/api/src/modules/auth/auth.service.ts:51` — `new Date(opts.dateOfBirth)` parses arbitrary strings. A malformed date like `"2020-99-99"` produces an `Invalid Date` object. The age calculation on line 53-54 then yields `NaN`. The comparison `NaN < 18` is `false`, so the age check passes. A user of any age can register by providing an invalid date string.

**SP4. Linguistic cloaker corrupts common English** (Medium)
`src/web/utils/linguistic-cloak.ts:13-14` — The `bet` regex (`${b(98)}e${b(116)}` = `/bet/gi`) lacks word boundary anchors (`\b`). It matches the substring "bet" in any position, transforming "between", "better", "alphabet", etc. The `stake` pattern has the same issue. Any user-facing text processed through the cloaker in `APP_STORE` or `STRIPE` mode will have common English words corrupted.

**SP5. Geofence is trivially bypassed for non-US IPs** (Medium)
`src/api/services/security/geofence.service.ts:14,24` — Non-US IPs return `null` for state lookup, which maps to `JurisdictionTier.TIER_1` (full access). Any US user in a blocked state (WA, AR, HI, UT, ID, SC) can use a VPN to a non-US exit node and gain unrestricted access. The geofence blocks domestic traffic but permits all international traffic.

**SP6. Poll timer stored in Zustand state triggers unnecessary re-renders** (Low)
`src/web/store/useFuryStore.ts:56` — `set({ pollTimer: timer })` stores a `setInterval` timer ID in Zustand state. Every poll iteration sets a new assignments array, which combined with the timer ref in state, causes all subscribed components to re-render every 5 seconds even if data hasn't changed.

---

## Phase 4: Growth

### 4.1 Bloom (Emergent Insights)

**B1. The ethical guardrail system is a competitive moat**
Styx's Aegis protocol, Recovery Protocol, and BMI/velocity guardrails are not features — they are the product's moral spine. In a market where fintech products routinely exploit loss aversion, Styx deliberately limits itself to protect users. This positions it uniquely for regulatory approval and enterprise trust. The guardrails should be completed (BMI floor, velocity cap), documented as a formal "Duty of Care Protocol," and marketed as a differentiator.

**B2. The dual-layer API architecture enables a platform play**
The clean separation of domain services from HTTP modules means the business logic can be reused across delivery mechanisms: REST API, GraphQL, WebSocket workers, BullMQ consumers, CLI tools. The current architecture could support a "Styx-as-a-Service" B2B offering where enterprises embed behavioral contracts into their own apps via the domain services directly.

**B3. The TruthLog hash chain is more valuable than the current code realizes**
The hash chain is currently write-only (events are appended but never verified). If `verifyChain()` were exposed as a public API endpoint and called on a scheduled basis, Styx could offer **cryptographic proof of audit trail integrity** to regulators, enterprise customers, and end users. This converts a dormant technical feature into a compliance selling point.

**B4. The linguistic cloaker pattern could become a reusable library**
The concept of context-aware vocabulary swapping for platform compliance is novel. If the word-boundary bugs are fixed and the system is generalized (configurable term maps, context-dependent severity levels), it could be extracted into an open-source library used by any app that needs to navigate App Store/payment processor content policies.

---

### 4.2 Evolve — Strategic Roadmap

#### Phase Alpha: Security Hardening (Immediate — Sprint 11)
1. Fix Gate 06 `collectFiles` recursive call to pass `extensions` parameter
2. Add Stripe idempotency keys to all write operations
3. Fix linguistic cloaker word-boundary bugs
4. Validate `dateOfBirth` format before age calculation
5. Make `signToken` private in `AuthService`
6. Add missing ledger indexes (`entries.debit_account_id`, `entries.credit_account_id`, `entries.contract_id`)

#### Phase Beta: Integrity Assurance (Sprint 12-13)
1. Implement `verifyChain()` as a scheduled job (daily) and admin endpoint
2. Add `BEFORE UPDATE OR DELETE` trigger on `event_log` table for immutability
3. Implement account lockout after N failed login attempts
4. Add JWT refresh token mechanism (short-lived access tokens + long-lived refresh)
5. Migrate `useFuryStore` from polling-only to SSE-with-polling-fallback (matching `NotificationPanel` pattern)

#### Phase Gamma: Financial Precision (Sprint 14)
1. Migrate ledger amounts from floating-point to integer cents throughout stack
2. Add Stripe webhook signature verification audit
3. Implement BMI floor and weight velocity cap in Aegis service
4. Add explicit `{ algorithms: ['HS256'] }` to all `jwt.verify()` calls

#### Phase Delta: Compliance & Scale (Sprint 15-16)
1. Implement GDPR data export and right-to-erasure (with ledger anonymization strategy)
2. Add VPN detection or require identity verification for geofenced jurisdictions
3. Extract auth-check pattern into Next.js middleware
4. Document the Aegis/tier system interaction and formalize Duty of Care Protocol

---

### 4.3 Evolve — Prioritized Implementation Tasks

| # | Priority | Task | File(s) | Effort |
|---|----------|------|---------|--------|
| 1 | P0-Critical | Fix `collectFiles` recursive call: add `extensions` parameter | `scripts/validation/06-security-invariant-check.ts:59` | 1 line |
| 2 | P0-Critical | Add Stripe idempotency keys to `paymentIntents.create` | `src/api/services/escrow/stripe.service.ts:54` | S |
| 3 | P0-Critical | Add `\b` word boundaries to linguistic cloaker regex patterns | `src/web/utils/linguistic-cloak.ts:13-14` | S |
| 4 | P1-High | Validate `dateOfBirth` is a real date before age calculation | `src/api/src/modules/auth/auth.service.ts:50-57` | S |
| 5 | P1-High | Make `signToken` private | `src/api/src/modules/auth/auth.service.ts:134` | 1 line |
| 6 | P1-High | Add indexes on `entries.debit_account_id`, `credit_account_id`, `contract_id` | `src/api/database/schema.sql` | S |
| 7 | P1-High | Schedule daily `verifyChain()` execution + admin endpoint | `src/api/services/ledger/truth-log.service.ts` | M |
| 8 | P1-High | Add `BEFORE UPDATE OR DELETE` trigger on `event_log` | `src/api/database/schema.sql` | S |
| 9 | P2-Medium | Implement JWT refresh token flow | `src/api/src/modules/auth/auth.service.ts`, `src/web/contexts/AuthContext.tsx` | L |
| 10 | P2-Medium | Fix `useFuryStore` token check to work with cookie auth | `src/web/store/useFuryStore.ts:36-39` | S |
| 11 | P2-Medium | Migrate `useFuryStore` to SSE-with-fallback pattern | `src/web/store/useFuryStore.ts` | M |
| 12 | P2-Medium | Implement account lockout after N failed login attempts | `src/api/src/modules/auth/auth.service.ts` | M |
| 13 | P2-Medium | Implement BMI floor and weight velocity cap in Aegis | `src/api/services/health/aegis.service.ts` | M |
| 14 | P2-Medium | Move poll timer out of Zustand state to closure ref | `src/web/store/useFuryStore.ts:56` | S |
| 15 | P3-Low | Migrate ledger amounts to integer cents | `src/api/services/ledger/ledger.service.ts`, `src/shared/libs/`, multiple services | XL |
| 16 | P3-Low | Add `{ algorithms: ['HS256'] }` to `jwt.verify()` calls | `src/api/guards/auth.guard.ts:49`, `auth.service.ts:142,167` | S |
| 17 | P3-Low | Implement GDPR data export and right-to-erasure | Multiple files | XL |
| 18 | P3-Low | Extract web auth-check into Next.js middleware | `src/web/` pages | M |

**Size guide**: S = < 2 hours, M = 2-8 hours, L = 1-2 days, XL = 3+ days

---

*Generated by the Evaluation-to-Growth framework. All findings cite specific file paths and line numbers verified against the codebase as of 2026-02-28.*
