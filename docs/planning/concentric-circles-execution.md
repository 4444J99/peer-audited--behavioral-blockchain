# Concentric Circles Execution Plan

**Date:** 2026-07-23
**Status update:** 2026-07-30 (truth pass — this build, branch `feat/omega-completion`)
**Goal:** Ship all phases (Alpha→Omega) as concentric circles. Each circle is launchable independently. Previous circles improve while the next one builds.

---

## Truth-Pass Preamble (2026-07-30)

Earlier revisions of this plan marked Circle 3 "COMPLETE" and listed Circle 4/5 items
as ✅ when the underlying services had been **built and tested but never wired into the
running application**. Concrete examples verified against the tree at time of writing:

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

## Current State (as of 2026-07-30)

- 7 packages; test counts pending the orchestrator's central CI run for this branch
  (the previously advertised "1,107 tests passing" predates the Circle 3–5 merges and
  is stale — do not quote it)
- 25+ NestJS modules built; **not all registered in `app.module.ts`** (see preamble —
  this branch wires the stragglers)
- Circle 1 PR backlog merged; **the Circle 1 gate (CI green, zero open PRs) is not yet
  verified closed**
- CCPA + AML (PR #835) and anti-Sybil + practitioner intelligence (PR #833) are merged
  code; AML routes and the security module were unwired until this branch

---

## Circle 1: Clear the Backlog (merge all PRs)
**Goal:** All existing code work merged to main. Clean slate.
**Launch gate:** All 16 PRs merged, CI green, zero open PRs.
**Status:** MERGED, GATE NOT CLOSED — the 16 tracked PRs were merged, but the gate
also requires CI green on main and zero open PRs, and neither has been re-verified
after the Circle 3–5 merges. Do not call this circle closed until the orchestrator's
central CI run is green and the open-PR count is confirmed zero.

- [x] #704, #705, #707, #709, #700, #703, #713, #715, #718, #731, #797, #808, #810,
      #811, #814, #819 merged
- [ ] CI green on main (re-verify after this branch lands)
- [ ] Zero open PRs confirmed

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
- [ ] Kill switch **persistence** — in-memory until this branch (see Circle 5 wiring)

### 2b: External dependencies (human-gated, still open)
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
**Status:** BUILT (PR #829 merged 2026-07-23); WIRING + HARDENING COMPLETED BY THIS BRANCH.
The previous "COMPLETE" claim conflated merged code with reachable, production-grade
behavior.

- [x] Collusion ring detection — `src/api/services/security/collusion-detection.service.ts`
- [x] Fitbit daily readiness — `src/api/services/health/fitbit.service.ts`,
      `src/api/src/modules/contracts/fitbit.controller.ts` (registered in
      `contracts.module.ts`)
- [ ] **Verified** Fitbit ingestion — the existing controller accepts authenticated
      user-submitted readiness; provider-verified ingestion (signature/token
      verification against Fitbit) is added by this branch
- [x] Device attestation framework — `src/api/services/security/device-attestation.service.ts`
      (key registry, replay counters, structural checks; migration `051`)
- [ ] **Real attestation crypto** — App Attest certificate-chain and Play Integrity JWT
      signature verification (the service's own doc-comment lists these as required for
      production); added by this branch
- [x] HealthKit ingestion + Whoop (from Circle 2)
- [x] Video transcoding pipeline — `src/api/src/modules/proofs/video-processing.*`
- [x] Reviewer redaction (from Circle 2)
- [x] Enforcement confirm + appeal resolution (from Circle 2)

---

## Circle 4: Delta — Retention + Network Effects
**Goal:** Will people come back? Build the engagement loop.
**Launch gate:** Danger-zone protections, accountability partners, progress dashboard, push notifications.
**Status:** BUILT (PRs #830, #831 merged 2026-07-23); demo-facing surfaces wired by this branch.

- [x] Danger-zone protections — `src/api/src/modules/behavioral/danger-zone.service.ts`
- [x] Accountability partner protocol — `accountability-partner.service.ts`, migration `052`
- [x] Progress dashboard — `progress-dashboard.service.ts`
- [x] Notification composer — 8 behavioral push types (PR #831)
- [x] Endowed progress engine — `endowed-progress.service.ts`
- [x] Push notification infrastructure — migration `044`
- [x] Weekend risk multiplier — migration `022`
- [ ] Circles (pods) member-facing pages in `src/web/app` — added by this branch
      (no `circles` route existed before it)
- [ ] Identity-based onboarding (user archetype profiling at intake) — not started
- [ ] Pod/Arena experiment framework (A/B cohort comparison) — not started
- [ ] In-app messaging within pods — not started

---

## Circle 5: Omega — Enterprise Expansion
**Goal:** Can enterprises buy this? Legal, compliance, revenue.
**Launch gate:** Legal whitepaper, enterprise compliance, revenue packaging.
**Status:** IN PROGRESS. PR #833 (anti-Sybil, practitioner intelligence) and PR #835
(CCPA deletion, AML screening) are **merged** — the prior revision wrongly listed
CCPA/AML as "Remaining." What actually remained was wiring, which this branch does.

### Merged before this branch:
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
      (`src/api/src/guards/auth.guard.ts`, `src/api/src/common/guards/role.guard.ts`)

### Wired/added by this branch (`feat/omega-completion`):
- [ ] Register `SecurityModule` in `app.module.ts`; register `AmlController` in
      `compliance.module.ts`; register `PractitionerIntelligenceService` in
      `behavioral.module.ts`
- [ ] Migrations 058, 060–062 (fills the 057→059 numbering gap; kill-switch state,
      retention policy, and demo-seed support tables)
- [ ] Real attestation crypto (see Circle 3)
- [ ] Verified Fitbit ingestion (see Circle 3)
- [ ] Persisted kill switch (DB-backed refund-only mode surviving restart; replaces the
      static boolean in `jurisdiction-disposition.mapper.ts`)
- [ ] Data-retention scheduler (automated purge per retention policy, complementing the
      existing 4 AM GDPR erasure sweep in `src/api/src/modules/users/gdpr.scheduler.ts`)
- [ ] Demo seed + KYC / practitioner / circles pages in `src/web/app`

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

## Execution Strategy
1. **Circle 1 first** - merge everything, get a clean baseline
2. **Circle 2 in parallel** - start P0 blockers while PRs are merging
3. **Circles 3-5 planning** - define exact sub-tasks as we approach each circle
4. **Each circle is launchable** - Circle 2 = beta launch, Circle 3 = scale launch, etc.
5. **Previous circles improve** - while building Circle 3, Circle 2 gets hardening/bugfixes
6. **(Added 2026-07-30)** A circle's checkbox is only ✅ when code is written, tested,
   AND wired into a reachable surface — merged-but-unregistered modules do not count.

---

## Agent Allocation (Limен fleet)
- **Jules**: Batch feature work, test writing, schema migrations
- **Claude**: Architecture decisions, complex refactors, legal doc drafting
- **Codex**: Code review, CI fixes, deployment pipeline
- **Gemini**: Research, documentation, marketing copy
- **OpenCode**: Rapid prototyping, API endpoints, UI components
- **Agy**: Code quality, lint fixes, dependency updates
