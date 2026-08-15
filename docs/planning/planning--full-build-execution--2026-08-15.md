# Full-Build Execution Program — Every Phase to Its Buildable End

**Date:** 2026-08-15 · **Base:** `main` @ `cbde785` · **Mandate:** the whole project — every
phase of the alpha→omega roadmap — driven to done. Everything an agent can build gets built,
verified, and merged; every genuinely human/vendor-gated atom is filed once in its registry
owner and never recited back.

## Method: registry precedence

Six status registries describe this repo and they disagree in both directions. This program
reconciles them with a fixed precedence, probing code directly wherever two registries
conflict:

1. **Live code + the running beta** (probed, not remembered)
2. `artifacts/beta-readiness-summary.json` — the only machine-recorded gate state
3. `planning--founder-decisions-of-record.md` — by its own rule ("if code or a plan disagrees
   with an entry, the entry wins and the divergence is a bug")
4. `planning--stub-inventory.md` (2026-07-30 truth pass)
5. `planning--implementation-status.md` (2026-08-14)
6. `planning--alpha-omega-completion-matrix.md` (2026-03-10) · `FEATURE-BACKLOG.md` (v1.4,
   2026-02-28) · `planning--research-ticket-pack--2026-03-04.*` (never status-updated)

Registry facts driving this plan: all 19 roadmap tickets (`TKT-*`) were at some point closed
on GitHub **without evidence** and reinstated by the two triage repair batches; zero are
closed today; the triage batch layer reports 20/20 batches complete, which does **not** mean
ticket completion. Meanwhile the code is AHEAD of most registries (geofence fail-closed +
GeoResolver provenance, KYC default-ON in production, remote push sender, video pipeline,
fury enforcement all exist and are largely unrecorded).

## Phase state, code-first (2026-08-15)

| Phase | Verdict | Evidence anchor |
|---|---|---|
| Zero (Thesis) | COMPLETE | roadmap's own evidence section |
| Alpha (Core trust) | COMPLETE | matrix 100%; 3,000+ green tests; live beta serves it |
| Beta (Money enablement) | **Engineering-complete; activation human-gated; test-money beta LIVE** | escrow port + 3 rails + `STYX_TEST_MONEY_MODE` interlock (#868); geofence SH7 fail-closed + provenance chain; KYC runtime default-ON in prod (`compliance-policy.service.ts:140-162`); disposition kill-switch DB-persisted; beta 47/47-route verified 2026-08-15 |
| Gamma (Proof integrity) | Backend largely built; 6 buildable gaps below | fury router/consensus/honeypots/demotion + `video-processing.*` + App Attest chain validation in code |
| Delta (Retention) | Backend ahead of registries; 5 buildable gaps below | partner lifecycle endpoints live; `ExpoPushProvider` posts to exp.host; partner-facing mobile UX absent |
| Omega (Enterprise) | Matrix says implemented, "not re-verified" — verification wave below | B2B connectors/billing/SSO/HR dashboard rows |

The three P0-beta-blocker issues that remain open (#315 counsel retainer, #316 custody
sign-off, #317 jurisdiction matrix sign-off) are **all legal atoms** — zero engineering P0s
remain. The counsel retainer is the highest-fanout human gate in the estate (it also gates
#136, #146, #148, and — via Q-8's deliberate sequencing — #133). Every draft counsel needs
already exists in `docs/legal/`.

## Build waves

Each wave = one-concern branches → PR → CI green → squash-merge. A checklist box anywhere in
`docs/checklists/` gets checked **only** with an evidence link, per the standing caution:
code counts when it is written, tested, AND wired into a reachable surface.

## The finding that reshaped this program

A code-first probe of every remaining item (2026-08-15) returned **22 features that are
complete, tested, registered — and reachable by nobody**. Not missing work: *unwired* work.
The estate's status registries counted them as shipped because the files exist. Two were
live defects:

- **Fury reviewers were served RAW, unredacted proof media.** `VideoProcessingService`
  had zero callers, so `masked_media_uri` was never populated, and the Fury queue's
  `redaction_status === 'COMPLETED'` test (production writes `'MASKED'`) fell through to
  `row.media_uri`. Its test could not fail: the R2 mock was `{}`. Fixed in PR #914.
- **A Fury who won an appeal never got the money back.** `resolveAppeal`'s REVERSED branch
  deleted a bookkeeping row while the ledger had already taken the stake. Fixed in PR #920.

This is the standing caution made concrete: **a checkbox is ✅ only when the code is
written, tested, AND wired into a reachable surface.** Every wave below now ends with a
grep for callers, not for files.

### Wave 0 — Readiness truth ✅
- [x] Regenerate `beta-readiness` against the live beta (was stale "incomplete")
- [x] Gate 05 self-consistency fix — PR #902 (invariant over guard-identity; fresh probe
      user; state tests opt-in). Verified exit 0 against the live beta.
- [x] Seed DOB fix — PR #903 (age gate blocked every seeded persona's contract creation;
      found by gate 01 against the live beta)
- [x] TierGuard's $0-escrow ceiling blocks the whole create loop on the test-money rail —
      filed as styx#905 with two candidate fixes (financial-permission surface: the
      decision was filed rather than shipped by an unattended agent session)

### Wave 1 — Registry truth pass (one PR) + estate hygiene ✅ (#906, #907)
- Reconcile the six registries to code truth with evidence links per row: ticket pack gains
  a status column; triage ticket states annotated; matrix/backlog/implementation-status rows
  corrected (KYC, geofence, push, weekend multiplier, cross-lobby, video pipeline)
- Fix recorded doc defects: app-store checklist "22 checkboxes" → 20; create the missing
  TestFlight-readiness checklist the README advertises; note issue #145's absence from the
  blocked-handoff range; DR-004 checkbox in `concentric-circles-execution.md` (ledger wins);
  `build_check` gate row missing from the beta-readiness contract's matrix
- GitHub hygiene: label #890–#894 (currently invisible to every label-driven query); verify
  and close #856 (root `engines` already `>=24 <25`); close superseded weekly burn-down
  trackers and make the cron close its predecessor
- Dependabot lane: let #872/#882/#883 merge on green; #897 (43-package group) rebased and
  judged against the root `overrides` block after the waves land

### Wave 2 — Beta residuals ✅ — every issue closed (#908–#912)
The whistleblower fix turned out to be a route directory literally named `%5BlinkId%5D`
(percent-encoded brackets), so Next served it as a *static* segment and every concrete id
404'd — verified live before and after: 404 → 200.

- #867 jurisdiction notice unreachable (the repo's only `bug`-labeled issue): typed
  `ApiError` already exists — give the contracts call its own catch and render the notice
- #890 Dockerfile/`output:'standalone'` mismatch · #893 baked `NEXT_PUBLIC_API_URL` in the
  ghcr web image (same workflow, may land as one image-truth PR)
- #891 CSRF throttle trips on fast navigation
- #892 whistleblower link unseeded → seed a demo bounty link so the route is reachable
- #894 collector: Worker is live; make `ensure`-script honor an external collector URL, then close

### Wave 3 — Gamma: proof integrity
- TKT-P1-009 responsible-use RUNTIME controls (self-exclusion registry, cooling-off
  enforcement, re-entry validation) — only static disclosure pages exist today
- TKT-P1-014 identity redaction in reviewer surfaces (probe first: `redact` hits exist in
  `proofs.service.ts` + desktop; build the gap, not the feature)
- TKT-P1-015 collusion slashing + appeal completion (enforcement.service exists — verify
  depth, finish slashing calc / false-positive safeguards / appeal surface)
- TKT-P1-013 processing-state UI for the built video pipeline
- TKT-P1-008 admin cluster-detection screen (routing backend live per matrix)
- TKT-P0-002 native camera capture: wire `expo-camera` in `CameraModule` with the synthetic
  path as labeled fallback — code buildable now; device verification rides Q-7 (#141)

### Wave 4 — Delta: retention
- TKT-P1-017 partner-facing UX end-to-end (mobile screens for invite/accept/cosign/veto —
  the server half is done; this is the matrix's own Finding #4)
- TKT-P1-005 24h timelock + danger-zone friction (unbuilt; Aegis harm-caps are a different
  control)
- TKT-P1-010 downscale intervention flow + bounded-stake UI (the $5 bonus is DR-005: keep
  the mechanic, remove the money, flag-deferred exactly like DR-004's appeal fee)
- TKT-P1-016 identity-based onboarding (oath storage + intake profiling)
- TKT-P1-018 leaderboard live transport (WebSocket/SSE) — built but stays HIDDEN in Phase 1
  UX per the scope lock
- TKT-P1-006 push: remote sender exists; verify receipts/delivery-confirmation half; APNs
  credential itself is #127/#141
- HARD STOP inside this wave: pod-visible miss state (Q-5) is an unanswered founder
  question — do not build it

### Wave 5 — Omega: enterprise + release gate
- Verify-wave over the matrix's IMPLEMENTED Omega rows (connectors, billing, SSO, HR
  dashboard, anonymization, corporate score) — "not re-verified in this worksheet"
- TKT-P1-019 buildable half: the automated release gate tied to the legal artifact trail
  (whitepaper draft exists; counsel signature is #136); also collapse the duplicate triage
  parent (#177 vs #292)
- Enterprise-checklist buildables: SOC 2 roadmap doc (its stated verify accepts one),
  security whitepaper from existing substrate, data export + contract-event webhooks,
  multi-location admin/RBAC verification, escrow-agreement + fury-auditor-agreement + BAA +
  cookie-policy drafts (the four missing legal drafts), security.txt/CSP/CORS audit
- PUBLIC_PROCESS buildables: real-database integration suite (every spec mocks the pg Pool
  today — the biggest single test gap in the estate), crucible simulation (1000+ honeypot
  rounds), load-test verification of financial-endpoint rate limits, Sentry alert rules,
  deployment/rollback/backup runbooks with rehearsal receipts

### Wave 6 — Program closeout
- Checklist truth stamps with evidence links; registries re-checked for contradictions
- `no-dangling` predicate: every issue in the near-term engineering slice closed or carrying
  its irreducible-atom label; every wave PR merged; readiness green; docs true

## Agent hard-stops (standing decisions this program must not touch)

- **Pricing** appears inside three gates with mutually contradictory numbers and no decision
  of record. Permitted: consolidate the five live pricing constants into one disabled
  source (Q-1's default: beta is free). Forbidden: choosing a price.
- **Pitch-deck divergences** (fitness-first GTM vs DR-001; $5 bonus vs DR-005; 15/85 split
  vs DR-002) are recorded KNOWN DIVERGENCES; resolving them is a joint founder call (Q-10).
- **Pod-visible miss state** (Q-5), **strike threshold 3→2** (Q-3), **check-in timezone**
  (Q-4): defaults hold until the founder answers.
- **Phase-1 scope lock**: no-contact only in UX; US-only; test-money only; KYC/age runtime
  enforcement labeled non-production; broad consumer web parity deferred; leaderboard/feed
  hidden. Widening any of these is a joint founder call.
- **DR-002/DR-006**: no Fury-pool/reserve distribution; no payout-percentage copy on any
  tester-facing surface.

## Human/vendor atom index (filed owners — cited once, never re-surfaced)

| Atom | Registry owner |
|---|---|
| Founder agreement signature (root gate: entity, IP assignment, joint decisions) | DR-007 in `planning--founder-decisions-of-record.md` |
| Counsel retainer + every sign-off it unlocks | #315/#316/#317, #136, #146, #148 |
| Apple Developer account (TestFlight, APNs, Sign-in-with-Apple) | #141 + Q-7 default (individual enrolment) |
| High-risk merchant application (deliberately sequenced AFTER counsel) | #133 + Q-8 |
| Stripe `sk_test_` key for rail verification | #865 |
| MaxMind GeoLite2 licence asset | #866 |
| Prize-indemnity / E&O insurance procurement | #137 |
| SOC 2 / pentest vendor engagements | real-money + enterprise checklists |
| Dogfood-cohort scope amendment (web-first, the "zero users" unblock) | founder brief 2026-07-31, proposal 1 |
| Jessica walkthrough of the shipped demo | DR-009 |
| CI-lane `RENDER_API_KEY` re-paste (beta needs nothing; restores `gh workflow run` lane) | organvm/limen#2403 |

## Program done-predicate

`npm run beta:readiness` green (9/9) against the live beta · every Wave 1–5 PR merged with
CI green · zero registry contradictions on the reconciled rows · the near-term engineering
issue slice empty of unlabeled/undisposed items · checklists carry evidence-linked truth ·
this plan's wave boxes all checked or explicitly re-owned.
