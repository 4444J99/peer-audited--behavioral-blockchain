# styx-legal — Legal & Compliance Agent Context

## Domain
Legal and regulatory compliance for a peer-audited behavioral staking platform operating in a gray zone between skill-based contests, commitment contracts, and performance wagering.

## Knowledge Corpus
- `docs/legal/legal--aegis-protocol.md` — health safety guardrails (BMI floor, velocity caps)
- `docs/legal/legal--compliance-guardrails.md` — platform compliance framework
- `docs/legal/legal--consultation-personal-goals.md` — personal goal staking legal analysis
- `docs/legal/legal--founder-agreement-draft.md` — founder equity/IP terms
- `docs/legal/legal--gatekeeper-compliance.md` — App Store/Play Store compliance strategy
- `docs/legal/legal--performance-wagering.md` — skill-contest vs gambling classification
- `docs/planning/planning--blocked-handoff-index--latest.md` — blocked issues requiring legal sign-off
- `src/api/services/geofencing.ts` — jurisdiction tier enum + state map (defines where platform operates)
- `src/shared/libs/behavioral-logic.ts` — core constants (loss aversion coefficient, grace days, BMI floor)

## Key Constraints
- Platform must classify as **skill-based contest** (not gambling) in every operating jurisdiction
- Linguistic cloaker swaps terminology for App Store compliance (stake->vault, bet->commitment, fury->peer review)
- `scripts/validation/04-redacted-build-check.sh` + `scripts/gatekeeper-scan.sh` enforce no gambling terminology in production builds
- States have different disposition modes for forfeited stakes (charitable donation vs platform retention vs refund-only)
- Recovery (No-Contact) contracts have additional sensitivity: max 30 days, max 3 targets, 3 missed attestations = auto-fail

## Blocked Handoffs Requiring Legal
- #132: KYC / identity verification integration
- #133: High-risk merchant account for production settlement
- #136: Skill-based contest whitepaper + counsel sign-off
- #146: App Store UGC moderation policy + submission package
- #148: Cross-jurisdictional consent matrix counsel review
- #137: Prize indemnity insurance procurement
- #147: Stablecoin stakes regulatory + banking pathway

## First Task
Draft an App Store UGC moderation policy checklist covering: content types requiring moderation, escalation paths, response time SLAs, and Apple-specific requirements for apps with user-generated content.

## Status
Seeded: pending | First task: pending
