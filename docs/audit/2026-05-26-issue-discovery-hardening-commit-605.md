# Issue Discovery Report — Security & Correctness Hardening Commit (#605)

- **Date:** 2026-05-26
- **Branch reviewed:** `claude/issue-discovery-reporting-PWWb9` (1 commit ahead of `main`)
- **Commit under review:** `95bc00f` — *fix: security & correctness hardening across Styx backend (#605)* (108 files, +3917/−1244)
- **Scope:** the changed files in the hardening commit, plus pre-existing issues in those files.

## Remediation status (2026-05-26)

**All 89 findings have been remediated in code** on this branch (commit following
this report). Verification: `tsc --noEmit` clean across `src/api` and the changed
`src/shared` files, and the full API test suite green (**989 tests / 95 suites passing**),
with co-located specs updated for every behavior change.

Highlights of the fixes:
- **Money idempotency:** Stripe idempotency keys added to `transferFunds`,
  `processIAP`, `recordUsage`, capture/lock; ledger gains a DB-enforced
  `idempotency_key` (migration `030`) with `ON CONFLICT DO NOTHING`; settlement
  dedupe re-keyed per-(run,type); status transitions guarded against concurrent
  reclaim. `payment_intent.succeeded` now verifies paid amount + currency.
- **Auth:** banned-user guard added to wallet/oracles; enterprise SSO requires a
  dedicated `ENTERPRISE_SSO_SECRET` (no `JWT_SECRET` fallback); logout revokes
  refresh tokens even when the access token is expired; `CurrentUser` fails closed.
- **Anti-fraud:** cross-contract pHash dedup restored; `isHoneypot` no longer
  returned to auditors; honeypots injected as both PASS and FAIL; manipulated
  media quarantined to `MANUAL_REVIEW`; dHash upgrade.
- **Privacy/GDPR/SSRF:** transactional + complete erasure; keyed-HMAC email
  pseudonymization; k-anonymity suppression; SSRF guard now resolves DNS, blocks
  rebinding/redirects and all IPv4-mapped-IPv6 / obfuscated-IP forms.
- **Ledger/consensus:** per-user grace-day cap restored; `verifyChain` recomputes
  from the running head; BIGSERIAL sequence advanced after explicit inserts;
  consensus side effects made idempotent; `resolveContract` fallback no longer
  strands terminally-resolved contracts.

**Policy decisions (confirmed by product/compliance, now implemented):**
- **PRV16** — KYC enforcement **fails closed in production**: ON by default,
  disabled only by an explicit `KYC_ENFORCEMENT_ENABLED=false` (which logs an
  error at startup). Opt-in (default off) outside production so local/dev/test
  flows are not blocked.
- **SH6** — confirmed **exclusive** boundary (`<`): a stake exactly at a tier
  threshold ($20.00 / $500.00) escalates to the stricter KYC tier. No code
  change required (current behavior).

A separate commit also lands the **branching / merge / release best-practices
system** (blocking CI, branch-protection ruleset, canonical strategy doc) — see
`docs/architecture/branching-and-release-strategy.md`.

## How to read this report

This is a **coverage-first** discovery pass. Every issue is listed — including
low-confidence and low-severity ones — so a downstream verification step can
rank and filter. Each finding carries a **Confidence** (how sure we are it is a
real bug) and **Severity** (impact if real). Nothing here has been verified by
running the code; treat High-confidence/High-severity items as candidates for
immediate manual confirmation.

Methodology: five parallel domain reviews (payments/money, ledger/consensus/
contracts, auth/access-control, privacy/compliance/GDPR, shared-libs/behavioral/
proofs) each ran `git diff main` + full-file reads, plus a cross-cutting pass on
config/CI/schema/validation scripts.

## What the commit got right (no action needed)

The hardening commit fixed many genuine problems and these were verified as sound:
CSRF rework (HMAC double-submit + `timingSafeEqual`), live DB role/ban re-check in
`RoleGuard`, ZK `Math.random` salt → CSPRNG + HMAC, missing Stripe identity webhook
signature verification now present (`rawBody: true` confirmed in `main.ts`), mock
identity-provider production bypass closed, B2B SOQL injection fixed, geofence
fail-open → fail-closed, anomaly timeout fail-open → fail-closed, removal of
hardcoded dev secret fallbacks (now throw if unset), `toCents` finite-input check,
duplicate CodeQL config removed from `ci.yml`. The most dangerous *remaining* issues
are in money-movement idempotency, the proof/honeypot anti-fraud pipeline, GDPR
erasure completeness, and a few access-control gaps — detailed below.

---

## Severity index (Critical/High first)

| ID | Sev | Conf | File | Title |
|----|-----|------|------|-------|
| PM7 | High | High | escrow/stripe.service.ts:137 | `transferFunds` has no idempotency key → double-payout |
| PM19 | High | High | services/billing.ts:47 | `processIAP` no idempotency → double-charge on retry |
| PM10 | High | Med | payments.controller.ts:199 | `payment_intent.succeeded` funds contract without verifying paid amount/currency |
| PM1 | High | High | stripe-fbo.service.ts:69 | `resolveEscrow` FAIL path never captures platform fee |
| PM4 | High | Med | settlement.worker.ts:175 | finalize ledger idempotency is TOCTOU, no DB unique constraint → double-post |
| PM6 | High | Med | settlement.worker.ts:126 | stale-PROCESSING reclaim can run concurrent Stripe settlement |
| AU1 | High | High | wallet.controller.ts:12 / oracles.controller.ts:67 | Banned users with live JWT can read wallet & feed contract-advancing health samples |
| AU3 | High | High | auth.service.ts:216 | Enterprise-SSO fallback verifies assertions with shared `JWT_SECRET` |
| AU4 | High | Med | .env.example:7 | Weak example `JWT_SECRET=supersecret` → token forgery if copied |
| PRV1 | High | High | zk-exhaust.verifier.ts:81 | ZK proof unbound to claim, no nonce/expiry → replayable, proves nothing |
| PRV3 | High | High | gdpr.service.ts:129 | GDPR erasure leaves DOB/Stripe ID/compliance_metadata/partner_email un-scrubbed |
| PRV6 | High | High | b2b.controller.ts:103 | `webhook/test` lacks tenant check → SSRF probing surface |
| PRV7 | High | Med | b2b/webhook.service.ts:63 | SSRF guard bypassable via DNS rebinding / redirects / non-dotted IPs |
| PRV8 | High | High | security/anonymization.service.ts:34 | Unsalted SHA-256 email "anonymization" is reversible/correlatable |
| SH1 | High | High | proofs.controller.ts:99 | pHash dedup scoped to same contract → cross-contract media reuse |
| SH2 | High | High | proofs.service.ts:208 | `isHoneypot` exposed to assigned Fury auditors defeats cheat detection |
| LC1 | Med | High | contracts.service.ts:2251 | `getAttestationStatus` reports stale grace days, ignores month rollover |
| LC2 | Med | High | contracts.service.ts:1947 | Grace-day cap weakened from per-user to per-contract (2×N abuse) |

Medium/Low findings follow per-domain. (89 findings total.)

---

## Payments & Money (31 findings)

**PM1 — `resolveEscrow` FAIL path never captures the platform fee** · `stripe-fbo.service.ts:69-110` · Conf High · Sev High
On FAIL it computes `platformFee`, transfers fury bounties, then only logs "Platform captured $X fee" and returns `true` — never calls `paymentIntents.capture()`. User funds stay in `requires_capture` limbo and eventually auto-release; the stake is never slashed. Class is `@deprecated`/unreferenced but exported and wrong.

**PM2 — `resolveEscrow` uses live PaymentIntent amount, not contract-bound amount** · `stripe-fbo.service.ts:73-75` · Conf Med · Sev Med
Slash split computed from `intent.amount` rather than server-authoritative stake; no `currency === 'usd'` check, so a non-USD intent is split as if USD cents.

**PM3 — `lockStakeInEscrow` creates PI with no idempotency key + immediate capture** · `stripe-fbo.service.ts:33-44` · Conf Med · Sev Med
No `idempotencyKey` → retry double-charges; `capture_method:'automatic'` conflicts with the FBO manual-hold model used elsewhere. Legacy but a real double-charge hazard.

**PM4 — finalize ledger idempotency is TOCTOU with no DB-level uniqueness** · `settlement.worker.ts:175-199,287-293` · Conf Med · Sev High
`entryExists()` then `recordTransaction()`; the contract `FOR UPDATE` lock is released at the earlier COMMIT. Two workers (concurrency 2 / stale reclaim) can both pass the existence check and both INSERT — no unique constraint on `entries`. Result: double-posted ledger entries (phantom money).

**PM5 — `(contract,type,amount)` ledger dedup wrongly collapses distinct settlements** · `settlement.worker.ts:287-293` · Conf Med · Sev Med
A legitimate second settlement of the same type+amount (re-resolution) is silently skipped as a "duplicate" even though Stripe moved funds again.

**PM6 — stale-PROCESSING reclaim can run a second concurrent Stripe settlement** · `settlement.worker.ts:126-149` · Conf Med · Sev High
A run >5 min old is reclaimed assuming the prior worker crashed; if it is merely slow, two workers call `releaseFunds`/`captureFunds` concurrently. Only Stripe-side keys prevent double-pay — and `transferFunds` (PM7) has none.

**PM7 — `transferFunds` creates a Stripe transfer with no idempotency key** · `escrow/stripe.service.ts:137-148` · Conf High · Sev High
Unlike hold/capture/cancel, `transfers.create()` has no `idempotencyKey`. Any retry (BullMQ, crash-resume, outbox) double-pays the destination connected account.

**PM8 — Reconciliation only recognizes worker-path entry types** · `reconciliation.service.ts:69-86` · Conf High · Sev Med
Filters on `SETTLEMENT_RELEASE`/`SETTLEMENT_CAPTURE` (worker only). The canonical `contracts.service` outbox posts `STAKE_RETURN`/`STAKE_CAPTURED`/`REFUND_ONLY_DISPOSITION`/`BOUNTY_POOL_TOPUP`, so every outbox-settled contract is falsely flagged "imbalance: expected N withdrew 0," masking real signal.

**PM9 — Reconciliation strict `!==` cannot tolerate partial/split settlements** · `reconciliation.service.ts:84-86` · Conf Low · Sev Low
`captureStake` supports partial capture; an intentional partial is flagged as imbalance. No `withdrawn <= staked` notion.

**PM10 — `payment_intent.succeeded` funds a contract without verifying paid amount/currency** · `payments.controller.ts:199-218` · Conf Med · Sev High
Flips contract to ACTIVE on `payment_intent_id` match only; never compares `pi.amount`/`amount_received` against `stake_amount`. A PI for less (or different currency) activates the contract as fully funded.

**PM11 — Forced settlement allows admin to settle unresolved contract at chosen outcome with weak guarding** · `payments.controller.ts:105-153` · Conf Low · Sev Med
`force:true` + explicit `outcome` moves money for a non-COMPLETED/FAILED contract; no audit linkage, no fundability check; forced PASS on unfunded/cancelled contract attempts a release/refund of non-existent escrow.

**PM12 — `charge.dispute.created` overwrites status to DISPUTED unconditionally** · `payments.controller.ts:243-270` · Conf Low · Sev Med
No `status IN (...)` guard (unlike succeeded/failed handlers); a late dispute reverts a COMPLETED/FAILED contract to DISPUTED, re-opening a closed financial state.

**PM13 — Webhook deletes dedup row on any processing error → replay of partial side effects** · `payments.controller.ts:275-280` · Conf Med · Sev Med
If processing throws after committing some mutations, the catch DELETEs the `stripe_events` row and returns 500; Stripe's retry re-runs the (non-idempotent) handler, re-applying already-succeeded effects.

**PM14 — `toCents` silently rounds fractional-cent inputs instead of rejecting** · `money.ts:7-12` · Conf Med · Sev Med
Now only throws on non-finite then `Math.round`s; `10.005`/`19.999` are silently altered rather than surfaced as a boundary error.

**PM15 — `toCents` float multiply exposes IEEE-754 edge cases** · `money.ts:7-12` · Conf Low · Sev Low
`Math.round(dollars*100)` can be off-by-a-cent near binary boundaries and asymmetric for negatives (`Math.round(-0.5)===0`).

**PM16 — `toDollars`/`formatCents` accept negative/non-integer cents without validation** · `money.ts:15-22` · Conf Low · Sev Low
No central guard that internal amounts stay non-negative integers; an upstream sign error renders as negative dollars instead of being caught.

**PM17 — Fixed capture idempotency key breaks legitimate re-capture at a different amount** · `escrow/stripe.service.ts:114-116` · Conf Low · Sev Low
`styx_capture_${paymentIntentId}` reused with differing params → Stripe rejects or replays, masking the amount change. Key should include the capture amount for partial captures.

**PM18 — `captureStake` dev-mode ignores `captureAmountCents`** · `escrow/stripe.service.ts:90-93` · Conf Low · Sev Low
Dev returns `{status:'succeeded'}` regardless of amount, hiding partial-capture/units bugs in tests.

**PM19 — `processIAP` holds+captures with no idempotency → double-charge on retry** · `services/billing.ts:47-54` · Conf High · Sev High
`holdStake` mints a fresh nonce key per attempt, so any retry creates a new PaymentIntent, re-charges `TICKET_PRICE_BASE`, and posts a second ledger entry. No function-level dedup.

**PM20 — `processIAP` records revenue without checking capture status** · `services/billing.ts:54` · Conf Low · Sev Low
Capture result discarded; if it returns non-succeeded without throwing, a `TICKET_PURCHASE` ledger + TruthLog event are written for money never collected.

**PM21 — B2B `createUsageRecord` increments with no idempotency → double-billing** · `b2b/billing.service.ts:44-48` · Conf Med · Sev Med
`action:'increment'` with `Date.now()` and at-least-once callers; retries over-bill the enterprise. Use a stable event-id idempotency key or `action:'set'`.

**PM22 — Appeal-fee capture moves real money but is never recorded in the ledger** · `escrow/dispute.service.ts:617-621` · Conf Med · Sev Med
On UPHELD, `STRIPE_CAPTURE_APPEAL_FEE` captures $5 to revenue with no `ledger.recordTransaction`; revenue is invisible to reconciliation and the ledger understates platform balances.

**PM23 — `initiateAppeal` silently non-transactional when pool lacks `connect()`** · `escrow/dispute.service.ts:109-149` · Conf Low · Sev Med
Dispute INSERT and proof UPDATE auto-commit separately after a fee was authorized; a mid-write failure leaves inconsistent state.

**PM24 — Appeal fee reuses `proofId` as the contract scope key** · `escrow/dispute.service.ts:101` · Conf Low · Sev Low
`holdStake(customerId, fee, proofId)` puts a proof id into PI `metadata.contractId` and the idempotency namespace, misleading webhook handlers that look up contracts by `metadata.contractId`.

**PM25 — `getTransactionStatus` treats null `cancellation_reason` as successful release** · `stripe-payout.provider.ts:71-73` · Conf Low · Sev Med
Auto-expiry of an uncaptured hold can also surface null reason; mapping null → SUCCESS can mark an involuntary cancellation as a successful settlement (opposite of intended fail-closed).

**PM26 — Worker trusts `job.data.amountCents` rather than re-deriving from the contract** · `settlement.worker.ts:33-37` · Conf Med · Sev Med
A stale/manipulated/replayed `amountCents` settles the wrong amount and posts a ledger entry disagreeing with the contract.

**PM27 — RELEASE path passes `amountCents` but provider releases the full hold** · `settlement.worker.ts:54` · Conf Med · Sev Med
`releaseFunds` ignores `_amountCents` and `cancelHold`s the entire hold; a partial refund releases everything while the ledger records only `amountCents` → real-money vs ledger divergence.

**PM28 — TruthLog append occurs after the finalize transaction commits** · `settlement.worker.ts:62-72` · Conf Low · Sev Low
A crash between COMMIT and append leaves money settled with no audit event; `claimRun` short-circuits on SUCCESS so it is never written on retry.

**PM29 — Bounty-pool topup dedup keyed on amount can collide** · `settlement.worker.ts:263-275` · Conf Low · Sev Low
`entryExists(contract,'BOUNTY_POOL_TOPUP',amount)` collapses two genuine equal-magnitude top-ups, under-crediting the pool.

**PM30 — `executeSettlement` reads `(contract as any).user_id`, may be undefined** · `payments.controller.ts:131-140` · Conf Low · Sev Low
If `getContract` lacks snake_case `user_id`, jurisdiction lookup runs with `undefined`, defaulting disposition — could CAPTURE a stake where law requires REFUND_ONLY.

**PM31 — On settlement failure the run is marked FAILED via shared pool with no guard** · `settlement.worker.ts:78-84` · Conf Low · Sev Low
Blind `UPDATE ... status='FAILED' WHERE id=$1` can flip a concurrently-reclaimed SUCCESS run back to FAILED, mis-driving reconciliation/`claimRun`.

---

## Auth & Access Control (14 findings)

**AU1 — Banned/quarantined users with a live token can read wallet & feed contract-advancing health samples** · `wallet.controller.ts:12`, `oracles.controller.ts:67` · Conf High · Sev High
Both controllers use only `@UseGuards(AuthGuard)` — no `BannedUserGuard`/`ComplianceAccessGuard`/`RoleGuard`. Login blocks non-ACTIVE accounts but access tokens live 15 min, so a user banned mid-session keeps a valid JWT and can POST `oracles/healthkit/samples`, which calls `processHealthKitSample` to advance/fulfill money-bearing contracts.

**AU2 — Account status check precedes password validation in login (timing/enumeration)** · `auth.service.ts:159` · Conf Med · Sev Low
Non-ACTIVE accounts short-circuit before the password compare and the failed-attempt UPDATE, a minor timing oracle distinguishing non-ACTIVE accounts.

**AU3 — Enterprise-SSO fallback verifies assertions with the same `JWT_SECRET`** · `auth.service.ts:216-226` · Conf High · Sev High
When `ENTERPRISE_SSO_SECRET` is unset (absent from `.env.example`, so it is the default path), assertions are verified with `getJwtSecret()` gated only by `token_type==='enterprise_sso'`. Anyone who can sign a JWT with `JWT_SECRET` can forge an enterprise assertion for any user.

**AU4 — Weak example `JWT_SECRET=supersecret`** · `.env.example:7` · Conf Med · Sev High
Session tokens, CSRF HMAC, and the SSO fallback all key off this one secret; a deployment copying the example value allows full JWT forgery.

**AU5 — No rate limiting on `/auth/refresh`, `/auth/logout`, `/auth/csrf`** · `auth.controller.ts:90` · Conf High · Sev Med
`register`/`login`/`enterprise` carry `@Throttle`, but refresh/logout/csrf do not — refresh-token abuse / token-rotation amplification surface.

**AU6 — Hardcoded `DUMMY_BCRYPT_HASH` may be malformed** · `auth.service.ts:24` · Conf Low · Sev Low
If not a valid bcrypt hash, `bcrypt.compare` returns/throws immediately, re-introducing the timing oracle the dummy compare was meant to remove. Add a unit test.

**AU7 — SSE ticket deleted before scope validation** · `sse-ticket.store.ts:50-54` · Conf Med · Sev Low
Ticket removed before the `scope` check; a valid ticket presented to the wrong-scope stream is burned (DoS on the victim's subscription). Delete only after scope+expiry pass.

**AU8 — SSE auth tickets accepted in query string** · `auth.guard.ts:111-112` · Conf Low · Sev Low
`request.query.ticket` as a credential lands in proxy logs / history / Referer. Single-use/60s limits exposure; prefer cookie path.

**AU9 — SSE ticket path hardcodes `role:'USER'`** · `auth.guard.ts:30-34` · Conf Low · Sev Low
Today fury stream re-checks DB role, but any future handler trusting `request.user.role` would misjudge a privileged ticket holder; empty `email:''` can confuse audit logging.

**AU10 — Logout revokes refresh tokens only if the access token still verifies** · `auth.controller.ts:140` · Conf Low · Sev Low
Expired access token → catch swallows error, cookies cleared, but 7-day refresh tokens never revoked; an exfiltrated refresh token stays usable.

**AU11 — Admin integrity adjust/ban/resolve lack audit-trail write or self-target guard** · `admin.controller.ts:161-176` · Conf Low · Sev Low
`adjustIntegrity` UPDATEs `integrity_score` with attacker-controllable `delta`, returns `reason` without persisting to TruthLog; no self/other-admin target guard.

**AU12 — `changePassword` does not revoke existing refresh tokens/sessions** · `users.controller.ts:88-92` · Conf Med · Sev Med
Controller does not call `revokeRefreshTokensForUser`; if the service also doesn't, post-change refresh tokens remain valid up to 7 days, defeating the password change. Verify service behavior.

**AU13 — `LoginDto` enforces `@MinLength(12)` on password** · `auth/dto.ts:31-40` · Conf Low · Sev Low
Login re-imposes registration complexity; any account with a shorter stored password is locked out at the DTO layer, plus a minor enumeration aid.

**AU14 — `CurrentUser` returns `request.user` with no presence assertion (fail-open)** · `current-user.decorator.ts:4-9` · Conf Low · Sev Med
AuthGuard is **not** global (only `ThrottlerGuard` is, `app.module.ts:60`); a single forgotten `@UseGuards(AuthGuard)` yields `request.user===undefined`. Decorator (or a global guard) should fail closed.

---

## Privacy, Compliance & GDPR (17 findings)

**PRV1 — ZK proof unbound to claim, no nonce/expiry → replayable** · `zk-exhaust.verifier.ts:81-93` · Conf High · Sev High
`verify()` only checks pseudonym equality and an HMAC over `artifactHash|senderPseudonym|timestamp` minted with the same secret used to mint proofs. No challenge/nonce, no verifier-context binding, no `timestamp` expiry — a captured proof replays indefinitely and proves no property of the exhaust.

**PRV2 — Ephemeral per-process ZK secret degrades verification across instances** · `zk-exhaust.verifier.ts:32-41` · Conf Med · Sev Med
Unset `ZK_EXHAUST_SECRET` → random per-process secret; multi-instance/restart deployments get unstable pseudonyms and silent cross-instance verification failures. No production startup guard (unlike other secrets).

**PRV3 — GDPR erasure leaves multiple PII fields/tables un-scrubbed** · `gdpr.service.ts:129-189` · Conf High · Sev High
`anonymizeUser` misses `users.date_of_birth`, `users.stripe_customer_id`, `users.compliance_metadata` (KYC), `identity_verification_id`/`identity_provider`, `terms_*`, plus `accountability_partners.partner_email`, `fury_assignments.subject_alias`, and `dashboard_progress_snapshots.payload_json`. Article 17 erasure is incomplete.

**PRV4 — Anonymization is not transactional → partial erasure on failure** · `gdpr.service.ts:129-186` · Conf High · Sev Med
Six UPDATE/DELETEs + audit append run as separate `pool.query` calls; a mid-way throw leaves a partially-anonymized user and possibly no `GDPR_ERASURE_COMPLETED` event, which `processPendingDeletions` then retries.

**PRV5 — User identifier logged in deletion error path** · `gdpr.service.ts:119-121` · Conf Low · Sev Low
Raw `userId` + error message written to logs that the erasure flow does not clean up.

**PRV6 — `webhook/test` lacks tenant/membership check → SSRF probing** · `b2b.controller.ts:103-111` · Conf High · Sev High
Unlike other B2B routes, `testWebhook` skips `assertEnterpriseMembership` and POSTs to an arbitrary body `url`; a platform-admin (not tenant-scoped) can enumerate/contact external hosts and, with PRV7, reach internal services.

**PRV7 — SSRF guard bypassable via DNS rebinding, redirects, non-dotted IPs** · `b2b/webhook.service.ts:63-72,150-194` · Conf Med · Sev High
`assertSafeWebhookUrl` inspects only the literal hostname (no DNS resolution → rebinding), `fetch` uses default `redirect:'follow'` (public→internal 30x), and the IP filter misses decimal/octal/hex IPv4 and IPv4-mapped IPv6.

**PRV8 — Unsalted SHA-256 email "anonymization" is reversible/correlatable** · `security/anonymization.service.ts:34-36` · Conf High · Sev High
Bare `sha256(email.toLowerCase())`, no salt/HMAC; low-entropy emails are trivially reversed via rainbow tables and form a stable cross-record key. Pseudonymization in name only. (Pre-existing.)

**PRV9 — Name reduced to initials leaks identity in small populations** · `security/anonymization.service.ts:38-44` · Conf Med · Sev Med
`getInitials` keeps every part's initial; combined with retained fields it narrows re-identification (fails k-anonymity). (Pre-existing.)

**PRV10 — HR export has no k-anonymity / minimum cohort suppression** · `b2b/anonymize.service.ts:104-140` · Conf Med · Sev Med
Per-employee rows (anon id + score + tier + exact counts + join month) with no min group size; a small/solo cohort is re-identifiable by an HR consumer who knows their roster. Deterministic pseudonym enables longitudinal linkage.

**PRV11 — Data-lake metrics lack small-group suppression** · `b2b/datalake.service.ts:103-229` · Conf Low · Sev Low
`extractContractMetrics`/`extractBehavioralTrends`/`extractCohortAnalysis` return counts/averages with no min-N; a single-employee cohort/category exposes that individual.

**PRV12 — Legacy unverified `parseStripeIdentityWebhook` still public** · `compliance/identity-provider.service.ts:217-219` · Conf Med · Sev Med
The verified `verifyAndParseStripeWebhook` was added and is used, but the old signature-less parser that can mark a user VERIFIED remains a public method — a latent KYC-bypass footgun. Remove or privatize.

**PRV13 — Stripe client defaults to mock secret key when unset** · `compliance/identity-provider.service.ts:60-61` · Conf Low · Sev Low
Falls back to `'sk_test_mock_key'`; a config where the webhook secret is set but the API key is mock could yield inconsistent verification. Production should hard-fail on the mock key.

**PRV14 — Anomaly screen flags manipulation but never rejects; duplicate path is dead code** · `anomaly/anomaly.service.ts:101-126` · Conf Med · Sev Med
`runAnalysis` always returns `rejected:false`; `SOFTWARE_MANIPULATION_DETECTED`/`EXIF_TIMESTAMP_DISCREPANCY`/`STRIPPED_METADATA` are appended as flags but never reject, and the perceptual-duplicate machinery is never invoked. Edited media is effectively auto-accepted. (Largely pre-existing.)

**PRV15 — Collision-scan similarity math is misleading after `hammingDistance` change** · `admin.controller.ts:260-262` / `anomaly.service.ts:94-99` · Conf Low · Sev Low
`hammingDistance` now returns only `0` or `MAX_SAFE_INTEGER`; the `<5` check matches only identical URIs and `similarity=(1-distance/64)*100` is dead arithmetic. Near-duplicate detection no longer occurs.

**PRV16 — KYC enforcement fully toggle-gated (off by default)** · `compliance/compliance-policy.service.ts:251-272` · Conf Med · Sev Med
Both KYC evaluators short-circuit `allowed:true` unless `KYC_ENFORCEMENT_ENABLED==='true'` (default false); unbounded-stake contracts can be created with zero identity verification. Confirm the production default is intended.

**PRV17 — Salesforce access token cached indefinitely, no expiry/refresh** · `b2b/connectors/salesforce.connector.ts:13,22,37` · Conf Low · Sev Low
`authenticate()` returns a cached token forever and never handles 401s; once the OAuth token expires, PII-export sync silently fails.

---

## Shared Libs, Behavioral Physics & Proofs (15 findings)

**SH1 — pHash dedup scoped to same contract → cross-contract media reuse** · `proofs.controller.ts:99-105` · Conf High · Sev High
Dedup query changed from global (`proof_id != $1`) to `WHERE p.contract_id = $1`. A user can re-submit identical media across different contracts undetected — the inline comment claims the opposite of what the SQL does. Anti-fraud regression.

**SH2 — `isHoneypot` exposed to assigned Fury auditors defeats cheat detection** · `proofs.service.ts:208` · Conf High · Sev High
`getProofDetail` returns `isHoneypot` to any authorized reader including assigned furies; a dishonest auditor reads the flag and always votes correctly on honeypots, defeating dishonest-auditor detection.

**SH3 — pHash-failure quarantine leaves proof PENDING_REVIEW but never routes it** · `proofs.controller.ts:131-146` · Conf Med · Sev Med
On `pHashFailed`, proof is set PENDING_REVIEW with media stored, then a `BadRequestException` is thrown before `furyRouter.routeProof` — no Fury job, no manual-review flag, can be silently orphaned. Updates not transactional with the truth-log append.

**SH4 — Health-source anti-spoofing relies entirely on client-supplied bundle ID** · `native/health-bridge.ts:40-71` · Conf Med · Sev Med
`validateSample` trusts `metadata.sourceBundleId` (client-controlled); set `wasUserEntered=false` + a trusted bundle string to pass with fabricated biometrics. "Verified hardware device" guarantee is spoofable.

**SH5 — Trusted-bundle allowlist may reject legitimate HealthKit/Health Connect sources** · `native/health-bridge.ts:40-43` · Conf Med · Sev Med
Allowlist is only two exact strings; real samples attributed to device-specific bundles are rejected, blocking honest users from biological oaths (failure liquidates stake).

**SH6 — KYC tier boundary uses `<=` so at-threshold stakes get the lower (no-KYC) tier** · `config/stake-tiers.ts:50` · Conf Low · Sev Low
`amountCents <= t.maxAmountCents` puts exactly $20.00/$500.00 in the lower bracket; verify the intended boundary semantics.

**SH7 — Contradictory docs on default tier for unlisted US states** · `services/geofencing.ts:24,100` · Conf Low · Sev Low
Header says unlisted → TIER_1 (full access); code fails closed to TIER_3. Code is safe but the stale header invites a dangerous "fix."

**SH8 — `normalizeStateCode` does not validate 2-letter format** · `services/geofencing.ts:111-115` · Conf Low · Sev Low
Accepts any non-empty string; full state names fail closed to TIER_3, hard-blocking legitimate TIER_1 users if a provider returns names.

**SH9 — Injected honeypots are always `FAIL`, never CLEAN/PASS** · `intelligence/honeypot.service.ts:116-132` · Conf Med · Sev Med
Despite multi-verdict support added in migration 028 / consensus / fury.worker, `injectHoneypot` only inserts `'FAIL'`; an auditor who learns "honeypots always expect FAIL" games them, undermining the adversarial-equilibrium guarantee.

**SH10 — `HONEYPOT_GRADED` correct/incorrect counts computed from different sets** · `intelligence/honeypot.service.ts:222-224` · Conf Low · Sev Low
`incorrectCount=flaggedFuries.length` vs `correctCount` from `verdict IS NOT NULL` rows; if a flagged fury lacks a verdict row, the counts won't sum to `totalReviewers`.

**SH11 — `APP_SECRET` now mandatory; missing config 500s the social layer** · `social/social-layer.service.ts:35-38` · Conf Low · Sev Low
Removing the predictable default is good, but `getPublicProfile`/`getLeaderboard` hard-throw if `APP_SECRET` is unset. Ensure it is provisioned everywhere.

**SH12 — Duplicated truth-log append logic risks chain divergence** · `users/users.service.ts:23-52` · Conf Low · Sev Low
`appendTruthLogEvent` re-implements `TruthLogService.appendEvent` (genesis hash, advisory lock `0x57544c47`, preimage). Currently consistent, but any future drift silently forks the tamper-evident chain.

**SH13 — pHash uses average-hash with a fixed Hamming threshold — bypassable** · `intelligence/phash.service.ts:38-47` · Conf Med · Sev Med
8×8 average-hash over 64 bits with `HAMMING_THRESHOLD=10` is defeated by crops/rotations/re-encoding and is collision-prone; `assertValidHash` checks format only. Weak anti-fraud control on real money.

**SH14 — Insufficient-Fury condition throws and can strand a proof un-routed** · `fury-router/fury-router.worker.ts:130-134` · Conf Low · Sev Med
Correctly stops finalizing below `requiredReviewers` but throws on every shortfall relying on BullMQ retry; once attempts exhaust, the proof stays PENDING_REVIEW with no assignments and no dead-letter/human-escalation path.

**SH15 — Public processing-complete callback has no per-proof authorization beyond a shared token** · `proofs.controller.ts:218-239` · Conf Low · Sev Med
`@Public()` + single global `INTERNAL_SERVICE_TOKEN` (constant-time — good), but anyone with the one token can mark ANY proofId COMPLETED/FAILED and set `masked_media_uri`/`redaction_status='MASKED'`. No signature scoping the call to a specific proof; with SH-pipeline serving masked media to non-owners, a leaked token lets an attacker plant a masked asset.

---

## Ledger, Consensus & Contracts (11 findings)

**LC1 — `getAttestationStatus` reports stale grace days, ignoring month rollover** · `contracts.service.ts:2251` · Conf High · Sev Med
`useGraceDay` resets the per-month cap when `grace_period_month` differs from the current month, but `getAttestationStatus` computes `2 - grace_days_used` without consulting `grace_period_month`, so post-rollover it reports 0 available when the user has the full quota. Status and enforcement disagree.

**LC2 — Grace-day cap weakened from per-user-per-month to per-contract-per-month** · `contracts.service.ts:1947-1990` · Conf High · Sev Med
Now counts against `contracts.grace_days_used` (per contract); a user with N active contracts gets `2*N` grace days/month instead of 2. (Old query read a nonexistent table so was effectively broken, but the replacement changes scope.)

**LC3 — `verifyChain` recomputes hash from stored `previous_hash`, not the running head** · `ledger/truth-log.service.ts:38` · Conf Med · Sev Med
Comment claims it detects an internally-consistent forged fork, but the preimage still uses `row.previous_hash`; the guarantee is weaker than documented and relies solely on the separate link check.

**LC4 — Explicit `sequence_index` inserts don't advance the BIGSERIAL sequence** · `migrations/026...` × `truth-log.service.ts:101-113` · Conf Med · Sev Med
`sequence_index` is BIGSERIAL+UNIQUE but `appendEvent` inserts an explicit app-computed index; any path relying on the default (seed.sql, future writers) will collide with `idx_event_log_sequence`. Latent today.

**LC5 — Post-claim consensus side effects are non-atomic and not idempotent on revert** · `fury/fury.worker.ts:174-227,268-280` · Conf Med · Sev Med
After claiming a proof to RESOLVING, integrity scoring + bounty/penalty ledger postings (no `sideEffectKey`) + demotion run as separate statements; a later throw reverts the proof to UNDER_REVIEW but does not roll back already-applied score changes or bounty postings.

**LC6 — Non-transactional `resolveContract` commits terminal status before settlement** · `contracts.service.ts:1645-1663,1742-1887` · Conf Med · Sev Med
Fallback path sets COMPLETED/FAILED (auto-commit) before ledger postings; the outer catch only rolls back when `useTransaction` is true, so a posting failure leaves the contract terminally resolved with money never moved and no outbox retry.

**LC7 — Class-level `@Roles('FURY')` with no hierarchy locks out ADMIN from all Fury endpoints** · `fury/fury.controller.ts:19-21` · Conf Low · Sev Low
RoleGuard is exact-match; admins/operators who previously read `/fury/stats`, `/fury/queue`, mask-audit are now 403'd. Authorization regression if admin oversight was expected.

**LC8 — `verifyLedgerIntegrity` totalDebits/totalCredits are identical by construction** · `ledger/ledger.service.ts:158-165,66` · Conf High · Sev Low
Both computed as the same `SUM(amount)`, so the `Ledger unbalanced: ${totalDebits} vs ${totalCredits}` message always prints equal numbers; the real violation lives in nonPositive/selfEntry/orphaned counts, which aren't surfaced. Misleading during incident response.

**LC9 — `applyPenalty` has no idempotency guard** · `fury/enforcement.service.ts:62-71` · Conf Low · Sev Low
`confirmCase` claims the transition atomically, but the public `applyPenalty` unconditionally INSERTs into `fury_penalties`; a direct/legacy caller on an already-applied case inserts a duplicate penalty.

**LC10 — `DoubleDownDto` enforces only IsPositive/Max, not the documented 0.01 minimum** · `contracts/dto.ts:170-180` · Conf Low · Sev Low
`0.001` passes validation; the service's `toCents`→0 rejects it, but the DTO contract doesn't match its stated bounds.

**LC11 — Multi-day catch-up adds multiple strikes at once, skipping pre-threshold RAIN intercession** · `contracts/attestation.scheduler.ts:78-101` · Conf Low · Sev Low
Strikes incremented by missed-day count in one statement; a catch-up run after downtime can jump straight to auto-FAIL with a single notification for the whole batch, changing the escalation/grace UX.

---

## Cross-cutting / Config (2 findings)

**CC1 — `jest.setup.cjs` omits `INTERNAL_SERVICE_TOKEN` default** · `src/api/jest.setup.cjs` · Conf Med · Sev Low
Provides test defaults for 5 of the 6 newly-required secrets but not `INTERNAL_SERVICE_TOKEN`. Runtime auth (`proofs.controller.ts:257`) is correctly fail-closed + constant-time, so this is only a test-infra gap for any spec exercising that endpoint.

**CC2 — `01-phantom-money-check.ts` ambiguous pass/fail on the NOT-VERIFIED path** · `scripts/validation/01-phantom-money-check.ts` · Conf Low · Sev Low
`process.exit(2)` on the "contract creation did not complete" path reads like a soft-skip in its message, but any non-zero exit fails CI. Either treat as a real gate failure explicitly or use exit 0 with a clear skip status.

---

## Suggested triage order

1. **Money double-spend (verify first):** PM7, PM19, PM4, PM6, PM21 — idempotency/concurrency on real fund movement.
2. **Funding integrity:** PM10 (amount/currency verify), PM1 (fee never captured), PM22 (appeal fee off-ledger), PM8 (reconciliation blind spot).
3. **Auth escalation:** AU1 (banned users move money), AU3+AU4 (SSO/JWT forgery), AU12 (password change doesn't revoke).
4. **Anti-fraud pipeline:** SH1 (cross-contract reuse), SH2 (honeypot flag leak), SH9 (always-FAIL honeypots), PRV14 (manipulation never rejected).
5. **Privacy/GDPR/SSRF:** PRV3+PRV4 (incomplete/non-atomic erasure), PRV1 (replayable ZK), PRV6+PRV7 (webhook SSRF), PRV8 (reversible email hash).
6. **Consensus/ledger correctness:** LC1+LC2 (grace days), LC5+LC6 (non-atomic resolution), LC4 (sequence drift).
