# Concentric Circles Execution Plan

**Date:** 2026-07-23
**Status update:** 2026-07-30 (post-merge truth pass — all engineering work is on `main`)
**Goal:** Ship all phases (Alpha→Omega) as concentric circles. Each circle is launchable independently. Previous circles improve while the next one builds.

---

## Post-Merge State (2026-07-30)

Everything the previous revision described as "added by this branch" is merged. The
landing sequence was #844 (landing-page heal, which had held `main` red since
2026-07-23), then #845 (Circle 3–5 wiring + schema-drift repair), #828/#846
(dependency and workspace hygiene), and #847 (demo jurisdiction substrate).

**Verified against a running system, not just a test suite:**

| Check | Result |
| --- | --- |
| `main` CI | green — first successful pipeline since 2026-07-23 |
| `turbo run test` | 11/11 tasks — **2,937 tests across 260 suites** (api 1902/161, web 386/46, mobile 299/32, shared 202/9, desktop 148/12) |
| `turbo run build lint` | 21/21 tasks |
| Fresh empty database | 70 migrations + base seed + circles seed, **zero errors**, idempotent on re-run |
| Live circle smoke | **23/23 probes** against a booted API |

The test count supersedes the "1,107 tests passing" figure quoted in older revisions.

### What running it caught that the tests could not

Every spec mocks the pg `Pool`, so no SQL had ever executed against a real database.
Booting the API against a migrated Postgres found what 2,900+ passing unit tests did
not — most seriously that `proofs.content_type` did not exist, which broke proof
submission **and the entire Fury peer-audit queue** on `main`. A static audit found 12
such columns; migrations `063`–`065` reconcile them. Fresh installs were also
structurally broken: the migration runner stamped all 70 migrations as applied without
running them, so 46 tables could never exist.

This is now a standing caution, not a historical note: **a green suite here does not
mean the SQL runs.** Anything touching a query needs a live check.

---

## Truth-Pass Preamble (2026-07-30)

Earlier revisions of this plan marked Circle 3 "COMPLETE" and listed Circle 4/5 items
as ✅ when the underlying services had been **built and tested but never wired into the
running application**. Concrete examples verified against the tree at time of writing
(all now fixed and merged):

- `SecurityModule` (anti-Sybil, `src/api/src/modules/security/security.module.ts`) was
  never imported by `src/api/src/app.module.ts` — none of its `/security/*` routes were
  reachable.
- `AmlController` (`src/api/src/modules/compliance/aml.controller.ts`) exists with full
  `/compliance/aml/*` routes but was absent from the `controllers` array of
  `src/api/src/modules/compliance/compliance.module.ts` (only `ComplianceController`
  is registered).
- `PractitionerIntelligenceService`
  (`src/api/src/modules/behavioral/practitioner-intelligence.service.ts`) was not a
  provider in `src/api/src/modules/behavioral/behavioral.module.ts`.
- The settlement kill switch
  (`src/api/src/modules/compliance/jurisdiction-disposition.mapper.ts`) is a static
  in-memory boolean — a process restart silently disarms it.
- Migration numbering jumps 057 → 059 (`058` was never created before `059_aml_tables.sql`
  landed).

"Built" and "shipped" are different claims. This revision marks a checkbox complete
**only when the code is written, tested, AND wired into a reachable surface.**

---

## Where this plan sits (added 2026-07-31)

This is the **engineering** plan: what has to be built and wired for each circle to be
launchable. It is not the go-to-market plan and it does not decide business policy. Two
other documents bound it, and this plan is subordinate to both:

- **`planning--founder-decisions-of-record.md`** — business policy decided by the founders
  (payout splits, pricing, jurisdiction scope). Where a circle's code implements a money or
  pricing rule, the decision of record is the spec.
- **`planning--phase1-private-beta-scope.md`** — what actually ships to the first testers.
  Circles 3–5 are largely **built ahead of** Phase 1, deliberately; the agreed go-to-market
  sequence is **no-contact recovery → health/fitness → B2B corporate wellness** (DR-001), so
  most of what Circle 3 and Circle 5 contain is *later-phase capability that exists early*,
  not Phase 1 launch surface.

A circle being ✅ therefore does **not** mean its features are tester-facing. The Phase 1
scope lock decides that, and it currently hides everything outside the no-contact journey.

Reconciling this plan against the founder record on 2026-07-31 surfaced one substantive
engineering item and closed one long-standing block:

- **Closed.** The failed-capture split was decided on 2026-03-10 (DR-002: 100% platform, no
  Fury pool) and the answer had never reached the repository. `settlement-quote.ts` carried a
  constant named `PROVISIONAL_FAILED_CAPTURE_BOUNTY_POOL_RATE` "pending Jessica decision" for
  four and a half months after she had decided. Now applied.
- **Open.** DR-004 (appeals free in beta) and DR-005 (no onboarding bonus) are decided but
  unbuilt. Neither is a constant change — see "Open implementation of decided policy" in the
  decisions-of-record file, in particular that setting the appeal fee to `$0` would make
  `initiateAppeal` fail closed, because Stripe rejects a zero-amount authorization.

---

## Current State (as of 2026-07-30)

- 7 packages, **2,937 tests across 260 suites**, all green
- 25+ NestJS modules, **all now registered** — `SecurityModule`, `AmlController`, and
  `PractitionerIntelligenceService` were wired in #845
- Circle 1 gate **closed**: `main` CI green, PR backlog cleared
- Every circle has at least one reachable demo surface; `/circles` is the public index

---

## Circle 1: Clear the Backlog (merge all PRs)
**Goal:** All existing code work merged to main. Clean slate.
**Launch gate:** All 16 PRs merged, CI green, zero open PRs.
**Status:** ✅ **CLOSED (2026-07-30).**

The gate had been stuck not on the 16 tracked PRs but on `main` itself: a merge
(`a83461a`) deleted the landing page's hero — headline, tagline, beta badge — while
leaving `page.test.tsx` asserting the old copy. That single break kept `main` red on
every push for a week and blocked five dependabot PRs behind it. Fixed in #844.

- [x] #704, #705, #707, #709, #700, #703, #713, #715, #718, #731, #797, #808, #810,
      #811, #814, #819 merged
- [x] CI green on `main`
- [x] PR backlog cleared — #836 superseded by #845; #842 auto-closed once its bump
      landed; #843 superseded by #846; #838 to be regenerated by Dependabot under the
      corrected config

---

## Circle 2: Beta Launch Readiness (P0 blockers)
**Goal:** Ship beta-ready product. Real money, real proofs, real safety.
**Launch gate:** All 38 P0 blockers resolved, deployment pipeline live, production CI/CD active.
**Status:** ENGINEERING SUBSTANTIALLY BUILT; EXTERNAL DEPENDENCIES OPEN.

### 2a: Buildable by engineering
- [x] KYC/Identity — schema (`007`, `043_compliance_artifacts.sql`), verification services
      (`src/api/src/modules/compliance/identity-verification.service.ts`,
      `identity-provider.service.ts` with mock + Stripe Identity adapters), fail-closed
      enforcement (`compliance-policy.service.ts`)
- [x] Camera proof — API pipeline (`src/api/src/modules/proofs/`); native mobile capture
      remains a tracked gap (see Remaining Limitations in `docs/CLAUDE.md`)
- [x] Geofence — fail-closed matrix (`src/api/services/geofencing.ts`), guard
      (`src/api/src/common/guards/geofence.guard.ts`), DB policy registry + decision audit
      (`010_settlements_and_jurisdictions.sql`), admin CRUD (`admin.controller.ts`)
- [x] Forfeit engine — disposition rules (`jurisdiction-disposition.mapper.ts`), kill
      switch endpoints (`admin.controller.ts` `GET/POST /admin/kill-switch`)
- [x] Crisis detection — `src/api/services/security/crisis-detection.service.ts`,
      `crisis-intervention.service.ts`, `crisis-notification.service.ts`, crisis module
- [x] Kill switch **persistence** — DB-backed (migration `060_system_flags.sql`);
      verified by arming it, killing the API process, restarting, and confirming
      refund-only mode survived

### 2b: Decided business policy, not yet built

Decided by the business lead, so these are **specs, not proposals**. They are open because
they take real work, not because anyone is still weighing them.

- [x] Failed-capture split → 100% platform (DR-002) — `settlement-quote.ts`
- [ ] **Appeals are free in the beta cohort (DR-004).** `dispute.service.ts:107` authorizes a
      `$5.00` hold before an appeal is accepted, and the dispute lifecycle captures or
      cancels it. Setting the constant to `0` does **not** work — Stripe rejects a
      zero-amount authorization, so `initiateAppeal` would fail closed and nobody could
      appeal at all. Free means *skipping the hold*: a nullable `disputes.payment_intent_id`,
      a fee-free counterpart to `FEE_AUTHORIZED_PENDING_REVIEW`, and a resolution path with
      nothing to capture or cancel. Keep `APPEAL_FEE_AMOUNT` behind a policy gate — DR-004
      explicitly reserves the right to reintroduce the fee if frivolous appeals appear at
      scale.
- [ ] **No onboarding bonus in the beta cohort (DR-005).** `grantOnboardingBonus` is called
      from `contracts.service.ts:1045` and `:1675`, each posting a `$5.00` ledger credit.
      Suppressing the grant is contained, but the pitch deck sells the bonus as the
      acquisition mechanic and `endowed-progress.service.ts` is built on artificial initial
      advancement. Removing the money without deciding what happens to endowed progress
      leaves a behavioral feature half-wired — the exact failure this plan already documented
      three times.
- [ ] **Ticket price `$4.99` was never decided.** `TICKET_PRICE_BASE` in
      `src/api/services/billing.ts:7` is an engineering default that no business decision
      covers. It was on the worksheet but not on the five-item brief that was actually sent.
      Needs an answer before any real-money charge.

### 2c: External dependencies (human-gated, still open)
- [ ] Legal counsel retention
- [ ] Stripe Connect FBO production account
- [ ] State jurisdiction matrix counsel sign-off (draft now exists:
      `docs/legal/state-jurisdiction-matrix-DRAFT.md`)
- [ ] FBO custody review
- [ ] KYC provider production contract (Stripe Identity); code path exists, mock adapter
      is the non-production default

---

## Circle 3: Gamma — Proof Integrity at Scale
**Goal:** Scale the reviewer network. Trust the evidence.
**Launch gate:** Health data integration, video proof pipeline, reviewer redaction, anti-collusion.
**Status:** ✅ **ENGINEERING COMPLETE** — built in #829, wired and hardened in #845.
The earlier "COMPLETE" claim conflated merged code with reachable, production-grade
behavior; this one is verified against a running system (`/fury` queue, proof submit,
attestation rejection paths all exercised live).

- [x] Collusion ring detection — `src/api/services/security/collusion-detection.service.ts`
- [x] Fitbit daily readiness — `src/api/services/health/fitbit.service.ts`,
      `src/api/src/modules/contracts/fitbit.controller.ts` (registered in
      `contracts.module.ts`)
- [x] **Verified** Fitbit ingestion — provider signature verification + OAuth token
      storage (migration `062_fitbit_oauth_tokens.sql`); an unsigned webhook is
      rejected (verified live)
- [x] Device attestation framework — `src/api/services/security/device-attestation.service.ts`
      (key registry, replay counters, structural checks; migration `051`)
- [x] **Real attestation crypto** — App Attest X509 certificate-chain validation with
      root-CA pinning and nonce-extension binding (OID 1.2.840.113635.100.8.2), and
      Play Integrity JWKS signature verification with caching plus `exp`/package-name
      checks. **Fail-closed**: with no `APPLE_APP_ATTEST_APP_ID` /
      `GOOGLE_PLAY_INTEGRITY_JWKS_URL` it refuses to verify rather than
      rubber-stamping. For demos set `DEVICE_ATTESTATION_DEV_BYPASS=true` — verdicts
      come back labeled `DEV_BYPASS`, never `STRONG` (see `scripts/demo/README.md` §2c)
- [x] HealthKit ingestion + Whoop (from Circle 2)
- [x] Video transcoding pipeline — `src/api/src/modules/proofs/video-processing.*`
- [x] Reviewer redaction (from Circle 2)
- [x] Enforcement confirm + appeal resolution (from Circle 2)

---

## Circle 4: Delta — Retention + Network Effects
**Goal:** Will people come back? Build the engagement loop.
**Launch gate:** Danger-zone protections, accountability partners, progress dashboard, push notifications.
**Status:** ✅ **ENGINEERING COMPLETE** for the launch-gate items — built in #830/#831,
demo-facing surfaces wired in #845. Three post-gate items remain unstarted (below);
they are scope beyond the stated gate, not regressions.

- [x] Danger-zone protections — `src/api/src/modules/behavioral/danger-zone.service.ts`
- [x] Accountability partner protocol — `accountability-partner.service.ts`, migration `052`
- [x] Progress dashboard — `progress-dashboard.service.ts`
- [x] Notification composer — 8 behavioral push types (PR #831)
- [x] Endowed progress engine — `endowed-progress.service.ts`
- [x] Push notification infrastructure — migration `044`
- [x] Weekend risk multiplier — migration `022`
- [x] Circles (pods) member-facing pages in `src/web/app` — added in #845 (no
      `circles` route existed before it); `/circles` is now the public demo index

Post-gate scope, still unstarted — these were never part of the Circle 4 launch gate:

- [ ] Identity-based onboarding (user archetype profiling at intake) — not started
- [ ] Pod/Arena experiment framework (A/B cohort comparison) — not started
- [ ] In-app messaging within pods — not started

---

## Circle 5: Omega — Enterprise Expansion
**Goal:** Can enterprises buy this? Legal, compliance, revenue.
**Launch gate:** Legal whitepaper, enterprise compliance, revenue packaging.
**Status:** ✅ **ENGINEERING COMPLETE; HUMAN-GATED ITEMS OPEN.** #833 (anti-Sybil,
practitioner intelligence) and #835 (CCPA deletion, AML screening) supplied the code;
#845 wired it into reachable routes and UI; #847 seeded the substrate those routes
read. What remains is counsel review and procurement — see the final subsection.

### Merged in #833 / #835:
- [x] Anti-Sybil layer — `src/api/src/modules/security/anti-sybil.service.ts`,
      migration `053_anti_sybil.sql` (PR #833)
- [x] Practitioner risk intelligence —
      `src/api/src/modules/behavioral/practitioner-intelligence.service.ts` (PR #833)
- [x] CCPA data deletion — `src/api/src/modules/users/ccpa.service.ts`, routes
      `/users/me/ccpa/*` in `users.controller.ts`, migration `054_ccpa_aml.sql` (PR #835)
- [x] AML screening — `src/api/src/modules/compliance/aml-screening.service.ts`,
      migrations `054` + `059_aml_tables.sql` (PR #835)
- [x] SOC 2 groundwork — hash-chained TruthLog
      (`src/api/services/ledger/truth-log.service.ts`), guards
      (`src/api/guards/auth.guard.ts`, `src/api/src/common/guards/role.guard.ts`)

### Wired/added in #845:
- [x] `SecurityModule` registered in `app.module.ts`; `AmlController` registered in
      `compliance.module.ts`; `PractitionerIntelligenceService` provided in
      `behavioral.module.ts` — all `/security/*`, `/compliance/aml/*` and practitioner
      routes are now reachable (verified live, including the 403 denial paths)
- [x] Migrations 058, 060–062 (fills the 057→059 numbering gap; kill-switch state,
      retention policy, practitioner and Fitbit OAuth tables)
- [x] Migrations 063–065 — schema-drift reconciliation; `063` recovers columns that
      existed only in `schema.sql` and never in the migration chain, `064` adds
      `proofs.content_type`/`description`/`uploaded_at` and `attestations.source`
      (whose absence was breaking proof submission and the Fury queue on `main`),
      `065` drops the DECO plaintext columns
- [x] Real attestation crypto (see Circle 3)
- [x] Verified Fitbit ingestion (see Circle 3)
- [x] Persisted kill switch — DB-backed refund-only mode replacing the static boolean
      in `jurisdiction-disposition.mapper.ts`; survives a process kill (verified)
- [x] Data-retention scheduler — automated purge per retention policy, complementing
      the 4 AM GDPR erasure sweep in `src/api/src/modules/users/gdpr.scheduler.ts`
- [x] Demo seed + KYC / practitioner / circles pages in `src/web/app`

### Added in #847:
- [x] Demo jurisdiction substrate — all twelve demo users placed across the three
      geofencing tiers, and `fbo_accounts` seeded. Without it `/admin/jurisdictions`
      rendered every user as an identical TIER_3 fallback, CCPA deletion returned 403
      for everyone (it gates on `compliance_metadata.state = 'CA'`, and no user had a
      state), and FBO routing was inert against an empty table
- [x] Fixed a state-match collision in `fbo-account.service.ts`: a bare
      `SPLIT_PART(x, '-', 2)` returns `''` for undelimited values, so `US` and `CA`
      compared equal — the country-level fallback account matched *every* state.
      Only visible once real rows existed
- [x] **CCPA deletions are now actually executed.**
      `CcpaService.processDeletionRequest` had zero callers — no admin route, no
      scheduler, no queue consumer. A California resident could submit a request, get
      a `201`, and see a `PENDING` row while the data was retained indefinitely, past
      the §1798.130(a)(2) deadline. Every visible signal said the feature worked.
      `CcpaScheduler` (4:30 AM, half an hour after the GDPR sweep so the two erasure
      paths never contend for the same rows or the TruthLog append lock) now drives
      `processPendingDeletions`, mirroring the GDPR sweep including its PII-safe
      failure logging. `OPT_OUT` rows are excluded — those are do-not-sell flags, and
      sweeping them would delete the accounts of users who only opted out of sale
- [x] Fixed a stranding bug the sweep exposed: the `status = 'PROCESSING'` stamp sits
      outside the erasure transaction, so a rollback did not undo it and one failed
      erasure pinned that request at `PROCESSING` forever — never retried, never
      completed. It now returns to `PENDING` on failure, which is safe because the
      erasure itself is transactional
- [x] Guarded the demo seed against re-writing jurisdiction data onto an erased user.
      Erasure sets `last_known_state = NULL` and `compliance_metadata = '{}'`, which is
      exactly what the seed's idempotency predicate looks for, so a re-run would have
      partially reversed a completed CCPA deletion

### Remaining engineering — open decisions, not defects:
- [ ] **CCPA deletion grace window** is set to 7 days (`CCPA_DELETION_GRACE_DAYS` in
      `ccpa.service.ts`). CCPA allows 45 days to respond and the sibling GDPR path
      holds for 30; 30 here would leave only 15 days of slack for a failed sweep to be
      noticed and retried. It is a policy parameter, not a technical constraint —
      worth confirming alongside the other counsel items below.
- [ ] `FboAccountService` has **zero consumers**. It is registered and exported in
      `payments.module.ts`, has a passing spec, and is called by nothing.
      `SettlementService` operates on internal ledger accounts
      (`debit_account_id`/`credit_account_id`); this service maps to external Stripe
      *connected* accounts. Wiring them together means deciding that payouts route
      through jurisdiction-partitioned custody — a compliance and architecture call
      that changes money movement, not a defect to patch. #847 made the data and the
      query correct so the decision is cheap to act on either way.

### Remaining (human-gated — cannot be closed by engineering):
- [ ] Legal defense whitepaper counsel review — review-ready draft now at
      `docs/legal/legal-defense-whitepaper-DRAFT.md`
- [ ] State jurisdiction matrix counsel sign-off — review-ready draft now at
      `docs/legal/state-jurisdiction-matrix-DRAFT.md` (contains OPEN QUESTIONS, incl.
      NV/SD divergence between code tiers and the 50-state survey)
- [ ] Enterprise compliance packaging buyer review — draft at
      `docs/enterprise/compliance-packaging.md`; SOC 2 Type I/II audit engagement is a
      procurement decision, not code
- [ ] Enterprise revenue packaging pricing approval — draft at
      `docs/enterprise/revenue-packaging.md`

---

## Running the demo

Every circle has a reachable surface. `scripts/demo/README.md` is the operator's guide —
boot sequence (including a no-Docker local-Postgres path), the twelve demo logins, and
what to look at on each page. `/circles` is the public index that walks Alpha → Omega
and links each one.

Ordering is load-bearing: **migrate → base seed (`src/api/database/seed.sql`) → circles
seed (`scripts/demo/seed-circles.sql`)**. The circles seed references base-seed system
accounts, so running it first fails on a foreign key. Never provision from `schema.sql` —
it is a reference snapshot, and an initdb-provisioned database causes the migration
runner to baseline-stamp (skip) the rest of the chain.

---

## Execution Strategy
1. **Circle 1 first** - merge everything, get a clean baseline
2. **Circle 2 in parallel** - start P0 blockers while PRs are merging
3. **Circles 3-5 planning** - define exact sub-tasks as we approach each circle
4. **Each circle is launchable** - Circle 2 = beta launch, Circle 3 = scale launch, etc.
5. **Previous circles improve** - while building Circle 3, Circle 2 gets hardening/bugfixes
6. **(Added 2026-07-30)** A circle's checkbox is only ✅ when code is written, tested,
   AND wired into a reachable surface — merged-but-unregistered modules do not count.
7. **(Added 2026-07-30)** For anything touching SQL, "tested" means **executed against a
   real database**. Every spec in this repo mocks the pg `Pool`, so a green suite proves
   the TypeScript is consistent with itself and nothing about whether the query runs.
   Twelve columns that did not exist, and a jurisdiction match that compared `US` equal
   to `CA`, all shipped under passing tests.
8. **(Added 2026-07-30)** Before calling a feature done, grep for **callers**, not just
   for the file. `SecurityModule`, `AmlController`, `PractitionerIntelligenceService`,
   `FboAccountService` and `CcpaService.processDeletionRequest` were each written,
   tested, and reachable by nobody. The CCPA one is the cautionary case: it returned
   `201`, wrote a `PENDING` row, and retained the data forever — an unreachable
   compliance feature is worse than an absent one, because it reports success.

---

## Agent Allocation (Limен fleet)
- **Jules**: Batch feature work, test writing, schema migrations
- **Claude**: Architecture decisions, complex refactors, legal doc drafting
- **Codex**: Code review, CI fixes, deployment pipeline
- **Gemini**: Research, documentation, marketing copy
- **OpenCode**: Rapid prototyping, API endpoints, UI components
- **Agy**: Code quality, lint fixes, dependency updates
