# Concentric Circles Execution Plan

**Date:** 2026-07-23
**Goal:** Ship all phases (Alpha→Omega) as concentric circles. Each circle is launchable independently. Previous circles improve while the next one builds.

---

## Current State
- **1,107 tests passing** across 7 packages
- **25 NestJS modules** built
- **16 open PRs** with mergeable features
- **575 triaged issues** (73 closed, 230 tracked, 156 active, 76 future, 25 waiting)
- **Phase Beta: 97.7%** (1/44 sub-issues remaining)
- **Phase Gamma: 60%** (2/5 sub-issues remaining)
- **Phase Delta: 45.6%** (37/68 sub-issues remaining)
- **Phase Omega: 54.7%** (35/64 sub-issues remaining)

---

## Circle 1: Clear the Backlog (merge all PRs)
**Goal:** All existing code work merged to main. Clean slate.
**Launch gate:** All 16 PRs merged, CI green, zero open PRs.

### PRs to merge (in dependency order):
1. #704 - fix(ci): coverage-threshold gating (unblocks CI quality)
2. #705 - fix(payments): fail closed on mock client secret
3. #707 - test(contracts): bounty link references real contract id
4. #709 - fix(db): baseline schema-drift in migration runner
5. #700 - refactor(test-harness): real Monte Carlo simulation
6. #703 - feat(marketing): public beta-waitlist funnel
7. #713 - feat: metered-usage billing
8. #715 - feat: dashboard metrics module
9. #718 - deploy: one-command deploy workflow
10. #731 - feat: POST /subscribe endpoint
11. #797 - feat(marketing): founder essay + trust summary
12. #808 - feat(legal): enterprise DPA/SLA templates
13. #810 - docs(ux): emotional safety notification copy
14. #811 - feat(llm): offline knowledge-base fallback
15. #814 - docs(planning): archive raw transcript
16. #819 - feat: batch delivery (21 issues)

---

## Circle 2: Beta Launch Readiness (P0 blockers)
**Goal:** Ship beta-ready product. Real money, real proofs, real safety.
**Launch gate:** All 38 P0 blockers resolved, deployment pipeline live, production CI/CD active.

### 2a: Buildable by engineering (23 items)
- **KYC/Identity** (5): Schema, verification endpoint, UI upload, tests, legal sign-off prep
- **Camera Proof** (4): Native capture, API submission, schema, tests
- **Geofence** (5): State matrix CRUD, fail-closed middleware, admin UI, audit logging, tests
- **Forfeit Engine** (5): Disposition rules, kill switch, admin UI, payout tests, legal prep
- **Crisis Detection** (4): Keyword engine, pause UI, escalation API, accuracy tests
- **Settlement API** (optional - may already be covered by merged PRs)

### 2b: External dependencies (15 items - file and track)
- Legal counsel retention
- Stripe Connect FBO account
- State jurisdiction matrix sign-off
- FBO custody review
- KYC provider integration (Stripe Identity)

---

## Circle 3: Gamma — Proof Integrity at Scale
**Goal:** Scale the reviewer network. Trust the evidence.
**Launch gate:** Health data integration, video proof pipeline, reviewer redaction, anti-collusion.

### Remaining sub-issues:
- Health data integration (HealthKit, Whoop, Fitbit)
- Video proof processing pipeline
- Reviewer identity redaction
- Anti-collusion routing improvements
- Collusion penalties and appeals

---

## Circle 4: Delta — Retention + Network Effects
**Goal:** Will people come back? Build the engagement loop.
**Launch gate:** Danger-zone protections, accountability partners, progress dashboard, push notifications.

### Key features (37 remaining):
- Recovery danger-zone protections (Day 3, Day 21, weekends)
- Weekend risk multiplier
- Accountability partner protocol
- Endowed progress + dynamic downscaling
- Identity-based onboarding
- Progress dashboard + live leaderboard
- Remote push notifications

---

## Circle 5: Omega — Enterprise Expansion
**Goal:** Can enterprises buy this? Legal, compliance, revenue.
**Launch gate:** Legal whitepaper, enterprise compliance, revenue packaging.

### Key features (29 remaining):
- Legal defense whitepaper
- Enterprise compliance packaging
- Enterprise revenue packaging
- SOC 2 readiness
- CCPA data deletion
- AML screening

---

## Execution Strategy
1. **Circle 1 first** - merge everything, get a clean baseline
2. **Circle 2 in parallel** - start P0 blockers while PRs are merging
3. **Circles 3-5 planning** - define exact sub-tasks as we approach each circle
4. **Each circle is launchable** - Circle 2 = beta launch, Circle 3 = scale launch, etc.
5. **Previous circles improve** - while building Circle 3, Circle 2 gets hardening/bugfixes

---

## Agent Allocation (Limен fleet)
- **Jules**: Batch feature work, test writing, schema migrations
- **Claude**: Architecture decisions, complex refactors, legal doc drafting
- **Codex**: Code review, CI fixes, deployment pipeline
- **Gemini**: Research, documentation, marketing copy
- **OpenCode**: Rapid prototyping, API endpoints, UI components
- **Agy**: Code quality, lint fixes, dependency updates
