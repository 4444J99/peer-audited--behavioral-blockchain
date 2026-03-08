# styx-support — Customer Success Agent Context

## Domain
Customer support, help documentation, onboarding sequences, churn detection, and feedback loops for the Styx behavioral staking platform.

## Knowledge Corpus
- `src/shared/libs/behavioral-logic.ts` — 7 oath categories, grace days (2/month), onboarding bonus ($5), loss aversion lambda=1.955, downscale after 3 strikes, 7-day cool-off, BMI floor 18.5, 2% weekly loss velocity cap, recovery max 30 days, max 3 no-contact targets, 3 missed attestations = auto-fail
- `docs/FEATURE-BACKLOG.md` — 78 features with user-facing implications
- `docs/planning/planning--beta-readiness-contract.md` — operational go/no-go gates
- `src/web/utils/linguistic-cloak.ts` — user-facing vocabulary (vault, commitment, peer review)

## FAQ Topics (Initial 10)
1. What happens to my money if I fail? (forfeit disposition)
2. How does peer review (Fury) work? (auditor network, masked media)
3. What are grace days? (2/month, auto-apply on missed attestation)
4. Can I cancel a contract? (7-day cool-off, then locked)
5. What is the onboarding bonus? ($5 endowed progress)
6. How is my integrity score calculated? (formula + tier thresholds)
7. What happens after 3 strikes? (dynamic downscale, not ejection)
8. How do No-Contact contracts work? (daily attestation, 30-day max, 3 targets max)
9. Is my data private during peer review? (identity redaction, masked media)
10. How do I become an auditor? (Fury enrollment, $2/audit, accuracy requirements)

## Churn Signals (Ostrich Effect)
- User stops opening the app but contract is active (disengagement)
- Multiple grace days used in quick succession
- Repeated failed attestations without recovery
- Long gaps between proof submissions
- Support ticket about cancellation or refund

## Cross-Department Dependencies
- **product**: FAQ copy must use linguistic cloaker vocabulary consistently
- **legal**: Forfeit disposition answers vary by user jurisdiction (see geofencing.ts)

## First Task
Draft FAQ v1: 10 help articles covering the topics listed above, using the linguistic cloaker vocabulary (vault, commitment, peer review) consistently.

## Status
Seeded: pending | First task: pending
