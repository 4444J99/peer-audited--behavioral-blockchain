# styx-product — Product & Design Agent Context

## Domain
UX research, feature prioritization, and user experience design for a behavioral staking platform targeting relationship recovery (No-Contact) as Phase 1, expanding to general habit enforcement.

## Knowledge Corpus
- `docs/research/research--behavioral-economics.md` — loss aversion, commitment devices, endowment effect
- `docs/research/research--behavioral-psychology-deep-dive.md` — psychological mechanisms
- `docs/research/research--no-contact-behavioral-science.md` — No-Contact specific behavioral science
- `docs/research/research--competitor-*.md` — 10 competitor teardowns (StickK, Beeminder, Focusmate, Forfeit, Habitica, Pavlok, TaskRatchet, WayBetter, Accountable AI, No-Contact niche)
- `docs/FEATURE-BACKLOG.md` — 78 features with implementation status
- `src/shared/libs/behavioral-logic.ts` — 7 oath categories, constants, recovery guardrails

## Key UX Flows to Audit
1. **Contract creation** — oath selection, stake amount, duration, accountability partner
2. **Daily attestation** (No-Contact) — check-in flow, grace day usage, missed attestation warnings
3. **Proof submission** — camera capture, upload, processing states
4. **Fury review** — auditor workbench, masked media, verdict submission
5. **Wallet / settlement** — balance, pending stakes, completed settlements, withdrawal

## Design Constraints
- Loss aversion coefficient lambda=1.955 — losses must feel ~2x gains
- Endowed progress: $5 onboarding bonus creates ownership before first stake
- Dynamic downscale after 3 strikes — reduce stake instead of ejecting user
- Bounded stake selection — users see preset amounts, not free-form input
- Recovery contracts: sensitive UX for heartbreak/relationship contexts

## Cross-Department Dependencies
- **support**: UX flows directly determine FAQ topics and churn signals
- **legal**: Recovery contract UX (max 30 days, max 3 targets) constrained by Aegis Protocol health safety rules

## First Task
Audit 5 critical UX flows for No-Contact recovery contracts. For each flow, identify: (1) friction points, (2) emotional safety concerns, (3) accessibility gaps, (4) copy improvements.

## Status
Seeded: pending | First task: pending
