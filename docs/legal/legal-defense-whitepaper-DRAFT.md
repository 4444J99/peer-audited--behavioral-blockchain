# Legal Defense Whitepaper — Code-Enforced Compliance Architecture

> **DRAFT — FOR COUNSEL REVIEW, NOT LEGAL ADVICE.**
> Prepared 2026-07-30 by engineering/research support. No position in this document has
> been approved by a licensed attorney. It is a map from the platform's legal theory to
> the specific code that enforces it, so counsel can verify that claimed safeguards
> exist and behave as described. Companion documents:
> `docs/legal/legal--skill-based-contest-whitepaper.md` (L-WP-01, doctrinal analysis),
> `docs/legal/legal--50-state-skill-contest-survey.md` (state survey),
> `docs/legal/state-jurisdiction-matrix-DRAFT.md` (per-state enforcement matrix).

---

## 1. The Theory in One Paragraph

Styx is a deposit contract, not a bet. A user deposits their own funds against their
own future behavior; the outcome is determined by the user's conduct (verified by a
multi-modal evidence pipeline), not by chance, an opponent, or house-set odds. Under
the three-element gambling test (prize + consideration + chance), Styx's architecture
is built to eliminate the chance element; under the majority **predominance (dominant
factor) test** the platform's position is strongest, under the **material element
test** it is defensible, and in **any-chance** jurisdictions the platform does not
capture stakes at all. The full doctrinal treatment, with authorities, is L-WP-01 §§2–3.
This document shows where each prong of that theory is load-bearing **in code**.

## 2. Test-Aware Jurisdiction Tiers (predominance / material element / any chance)

The three legal tests are encoded as a three-tier jurisdiction map:

- `src/api/services/geofencing.ts` — `JurisdictionTier` enum:
  `TIER_1 = FULL_ACCESS` (predominance states), `TIER_2 = REFUND_ONLY` (material
  element / licensing states), `TIER_3 = HARD_BLOCK` (any-chance / prohibition
  states). `STATE_TIERS` enumerates all 50 states + DC; the in-code comments carry the
  per-state rationale (e.g. `UT — constitutional gambling ban`,
  `MT — material element doctrine`).
- **Fail-closed classification:** `classifyJurisdiction()` hard-blocks non-US, unknown,
  and unlisted jurisdictions (`STATE_TIERS[state] ?? TIER_3`). An unclassified state
  can never receive full access by omission. Input normalization
  (`normalizeStateCode`) accepts only 2-letter codes or exact known state names —
  garbage fails closed rather than passing through.
- **Runtime registry:** the same classification is seeded into a `jurisdictions` DB
  table with per-state `disposition_mode`
  (`src/api/database/migrations/010_settlements_and_jurisdictions.sql`), readable at
  runtime (`compliance-policy.service.ts#getJurisdictionPolicy`) and updatable by
  admins with TruthLog-audited tier changes
  (`src/api/src/modules/admin/admin.controller.ts`). Counsel guidance can therefore be
  applied without a deploy.

**Request-time enforcement:** `src/api/src/common/guards/geofence.guard.ts` applies
`CompliancePolicyService.evaluateRequestPolicy` to every guarded route. TIER_3 blocks
all monetized actions; TIER_2 blocks contract creation, dispute filing, and ticket
purchase (refund-only operation); missing/unresolvable location is blocked by default
(`shouldFailOpenOnMissingLocation()` returns false unless explicitly overridden).
Spoofable geo headers are only trusted behind `TRUST_PROXY_HEADERS=true`; the
`x-styx-state` test override is ignored in production. Every decision is recorded in
the `compliance_decisions` audit table (migration 010) — an enforcement-history
record counsel can produce in a dispute.

## 3. Disposition Mapping: Where the Money Goes on Failure

The financially decisive question in a gambling characterization is what happens to a
failed user's stake. The mapping is deliberately narrow:

- `src/api/src/modules/compliance/jurisdiction-disposition.mapper.ts` —
  `getDispositionMode(tier)`:
  - `TIER_1` → `CAPTURE` (penalty permitted under predominance doctrine)
  - `TIER_2` → `REFUND` (material-element states: no capture, ever)
  - `TIER_3` → `REFUND` (blocked states: refund and exit)
  - `null` / `undefined` / unknown → `REFUND` (**fail-closed default**)

The platform never captures a stake except for a user affirmatively resolved into a
predominance-doctrine jurisdiction. Ambiguity always resolves to giving the money back.

**Kill switch (incident posture):** `setRefundOnlyMode(true)` forces every disposition
to REFUND regardless of tier — the immediate-compliance response to a regulator
contact or adverse ruling. Admin-only endpoints `GET/POST /admin/kill-switch`
(`src/api/src/modules/admin/admin.controller.ts`) with TruthLog audit
(`KILL_SWITCH_TOGGLED`, admin id). Branch `feat/omega-completion` persists the armed
state to the database so a restart cannot silently disarm it — counsel should note the
pre-existing in-memory limitation when describing historical posture.

## 4. FBO Custody Segregation

User deposits are held in a for-benefit-of (FBO) escrow structure, not commingled with
operating funds:

- `src/api/services/escrow/stripe.service.ts` (`StripeFboService`) — hold (authorize)
  on commitment, capture or cancel on resolution; production boots **fail** without a
  real `STRIPE_SECRET_KEY` (no silent mock mode in production).
- `docs/adr/adr--002-fbo-escrow-model.md` — the architectural decision record.
- `src/api/database/migrations/056_fbo_accounts.sql` — FBO account schema.
- Double-entry ledger (`src/api/services/ledger/ledger.service.ts`) with balanced-entry
  enforcement and idempotency keys; settlement runs correlate ledger entries to
  disposition and legal basis (`settlement_runs.disposition_mode`,
  `legal_basis_ref` — migration 010).

This supports the deposit-contract characterization (user retains equitable interest
in escrowed funds; see L-WP-01 §2.2 [COUNSEL REVIEW flag on consideration]) and the
consumer-protection posture (funds traceable, segregated, and refundable at all times).

## 5. Skill Evidence: the Verification Pipeline

The predominance argument requires showing outcomes are determined by user conduct.
The evidence machinery is what makes that factual claim provable per-contract:

- Proof intake and integrity: `src/api/src/modules/proofs/` (pre-signed R2 upload,
  confirm, video transcoding), pHash duplicate rejection + EXIF validation
  (`src/api/services/anomaly/`).
- Peer audit with counter-fraud: Fury consensus (`src/api/services/fury-router/`),
  honeypot injection (`src/api/services/intelligence/`), collusion-ring detection
  (`src/api/services/security/collusion-detection.service.ts`).
- Hardware signals: device attestation (App Attest / Play Integrity —
  `src/api/services/security/device-attestation.service.ts`; real cryptographic chain
  verification completed on branch `feat/omega-completion`), health oracles (Whoop,
  Fitbit — `src/api/services/health/fitbit.service.ts`, provider verification added on
  the same branch).
- Tamper-evident record: every material event lands in the hash-chained TruthLog
  (`src/api/services/ledger/truth-log.service.ts`), giving counsel a verifiable audit
  chain (`verifyChain()`) rather than mutable application logs.

## 6. Test-Money Beta

During private beta no real consumer money is at risk: `STYX_PRIVATE_BETA` and
`STYX_TEST_MONEY_MODE` flags (documented in `docs/CLAUDE.md` → Beta / Feature Flags)
keep the platform in test-money operation, and the Stripe client's production
fail-closed check (§4) prevents accidental live charging under mock configuration.
This sequences the legal exposure: doctrine and enforcement architecture are validated
before any real-money activation (see
`docs/checklists/real-money-pilot-readiness.md`).

## 7. Consumer-Protection Posture (defense in depth)

Beyond the gambling analysis, the platform enforces protections a regulator would ask
about:

- **Age gate ≥18, unconditional and fail-closed** (missing DOB blocks monetized
  actions): `compliance-policy.service.ts#evaluateAgeRequirement`.
- **KYC above $20 micro-stakes, default-ON in production, fail-closed**:
  `compliance-policy.service.ts#evaluateKycRequirement` (disable requires explicit
  env override and logs at error level).
- **AML program mechanics**: watchlist screening, $10k CTR threshold, structuring and
  rapid-movement detection, SAR drafting —
  `src/api/src/modules/compliance/aml-screening.service.ts`.
- **Self-exclusion**: `src/api/services/security/self-exclusion.service.ts`.
- **Crisis detection and pause**: `src/api/services/security/crisis-detection.service.ts`
  and the crisis module.
- **Health guardrails** (BMI floor 18.5, loss-velocity caps): Aegis protocol,
  `src/api/services/health/`, `docs/legal/legal--aegis-protocol.md`.
- **Data rights**: CCPA deletion/opt-out and GDPR erasure
  (`src/api/src/modules/users/ccpa.service.ts`, `gdpr.service.ts`).

## 8. Items Requiring Counsel Judgment (not resolvable in code)

1. **Tier assignments that diverge from the 50-state survey** — most acutely NV and SD
   coded as TIER_1 while the survey recommends blocking; AZ and MT coded TIER_2 while
   the survey recommends blocking. Full list with citations:
   `docs/legal/state-jurisdiction-matrix-DRAFT.md`. The code will follow whatever
   counsel signs off; the DB registry makes changes deployable same-day.
2. **The consideration prong** of the deposit-contract theory (L-WP-01 §2.2 flag).
3. **Whether TIER_2 refund-only operation itself requires licensure** in specific
   material-element states (e.g. AZ DFS registration, ME skill-game licensing).
4. **Forfeiture-recipient structure** — completers' share of forfeited stakes
   (prize-pool optics vs. liquidated damages; L-WP-01 §2.3).
5. **Real-money activation sign-off** — the gate list in
   `docs/legal/legal--real-money-activation-brief.md`.
