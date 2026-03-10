---
artifact_id: L-APP-B
title: "Appendix B — Terms of Service Markup to Aegis Guardrails"
date: "2026-03-10"
version: "0.1.0-draft"
owner: "codex"
approval_status: "draft"
---

# Appendix B — Terms of Service Markup to Aegis Guardrails

This appendix annotates the current Terms of Service draft with the guardrails it implements. The goal is not to replace counsel markup; it is to make the claim-to-clause relationship explicit before outside review.

## Clause Mapping Table

| ToS clause | Clause function | Aegis / Recovery source | Why it matters |
| --- | --- | --- | --- |
| `§ 2.1 Styx Is Not Gambling` | Declares deposit-contract framing and user-control theory | Aegis § 2.1-2.2; skill-based whitepaper §§ 1-2 | Preserves the core skill-over-chance positioning |
| `§ 3.1 Age Requirement` | 18+ eligibility promise | Aegis § 3.1 | Supports contract-capacity and youth-protection arguments |
| `§ 3.2 Geographic Restriction` | US-only access + anti-circumvention rule | Aegis § 2.3, § 6; blocklist appendix | Supports any-chance and jurisdiction-risk mitigation |
| `§ 3.3 Identity Verification` | Reserves KYC rights and threshold gating | Real-money brief § 5 | Aligns the ToS with staged financial onboarding |
| `§ 4.5 Settlement` | Defines success, failure, and dispute outcomes | Aegis § 4.2-4.3 | Makes the money path deterministic and reviewable |
| `§ 4.6 Biological / Recovery protocols` | Encodes BMI, velocity, and no-contact safeguards | Aegis § 3.2-3.4; Recovery Protocol | Moves health and anti-isolation controls into contract language |
| `§ 6.1 Escrow Structure` | States FBO segregation and non-commingling | Aegis § 4.1-4.3; Appendix A | Reinforces zero-custody and processor-facing consistency |
| `§ 7 Prohibited Conduct` | Bars fraud, collusion, circumvention, and health-dangerous use | Aegis § 3, § 5 | Gives an enforcement hook for the operational guardrails |
| `§ 10 Limitation of Liability` | Allocates residual health and platform risk | Aegis risk-register links | Does not replace safety controls, but narrows exposure |

## Counsel Review Targets

1. Confirm that `§ 3.2 Geographic Restriction` matches the actual launch-state blocklist and does not overstate enforcement.
2. Confirm that `§ 3.3 Identity Verification` matches the staged KYC thresholds in the real-money brief.
3. Confirm that `§ 4.6` adequately distinguishes Biological guardrails from Recovery guardrails.
4. Confirm that `§ 6.1` and `§ 6.3` align with the actual Stripe Connect / FBO fee split and refund logic.
5. Confirm that liability and arbitration sections do not undermine consumer-protection representations elsewhere in the packet.

## Parent Cross-References

- `docs/legal/terms-of-service.md`
- `docs/legal/legal--aegis-protocol.md`
- `docs/legal/legal--real-money-activation-brief.md`
- `docs/legal/regulatory-risk-register.md`
