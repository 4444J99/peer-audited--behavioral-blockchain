---
artifact_id: L-APP-E
title: "Appendix E — Counsel Submission Checklist"
date: "2026-03-10"
version: "0.1.0-draft"
owner: "codex"
approval_status: "draft"
---

# Appendix E — Counsel Submission Checklist

This checklist operationalizes the counsel package described in `legal--real-money-activation-brief.md` § 10. It is ordered to match the likely review flow for outside counsel and processor risk teams.

## Packet Assembly

Verified present on disk 2026-07-31. **Checked here means "written and attachable",
not "reviewed" — every document in this packet carries `approval_status: draft` and
was authored in-house, which is the entire reason for the engagement.**

- [x] Real-money activation brief included — `docs/legal/legal--real-money-activation-brief.md` (30K)
- [x] Skill-based contest whitepaper included — `docs/legal/legal--skill-based-contest-whitepaper.md` (53K)
- [x] Aegis Protocol included — `docs/legal/legal--aegis-protocol.md` (18K)
- [x] Gatekeeper compliance memo included — `docs/legal/legal--gatekeeper-compliance.md` (14K)
- [x] Cross-jurisdictional consent matrix included — `docs/legal/legal--cross-jurisdictional-consent-matrix.md` (30K)
- [x] Terms of Service draft included — `docs/legal/terms-of-service.md`
- [x] Privacy Policy draft included — `docs/legal/privacy-policy.md`
- [x] Regulatory risk register included — `docs/legal/regulatory-risk-register.md`
- [x] State jurisdiction matrix included — `docs/legal/state-jurisdiction-matrix-DRAFT.md`

## Appendices

- [x] Appendix A attached: FBO architecture diagram — `appendix-a--fbo-architecture-diagram.md`
- [x] Appendix B attached: Terms of Service to Aegis markup — `appendix-b--terms-of-service-aegis-markup.md`
- [x] Appendix C attached: App Review screenshot mockups — `appendix-c--app-review-screenshot-mockups.md`
- [x] Appendix D attached: state blocklist justification table — `appendix-d--state-blocklist-justification-table.md`
- [x] Appendix E attached: this checklist

## Counsel Questions

**None of these can be checked by us.** They are the deliverable of the
engagement. Ordered by exposure — the first two are the ones that would change
shipped behavior.

- [ ] Confirm the 34 states currently granted FULL_ACCESS. `STATE_TIERS` classifies
      every US state from an **in-house** 50-state survey. On 2026-07-31 the code
      was tightened so NV, SD, AZ and MT are hard-blocked, matching that survey's
      own BLOCK recommendation — before that the platform would have captured
      forfeited deposits in Nevada. OR and RI remain TIER_1 with any-chance history.
- [ ] Confirm skill-based contest classification in target launch states
- [ ] Confirm FBO structure and AOTP framing reduce or eliminate MTL risk
- [ ] Confirm UIGEA exclusion theory for self-competition model
- [ ] Confirm state blocklist is sufficient for launch
- [ ] Confirm KYC tier thresholds
- [ ] Confirm tax reporting obligations
- [ ] Confirm disclosure language for real-money activation

## Processor / App-Store Package Readiness

- [ ] Stripe risk packet includes Appendix A
- [ ] App Review note packet includes Appendix C
- [ ] Terms markup issues from counsel are back-propagated into `terms-of-service.md`
- [ ] Launch-state decisions are synced back into Appendix D and the main legal docs

## Final Release Gate

- [x] No unresolved placeholder markers remain in the legal packet
- [x] Parent docs point to concrete appendix paths
- [x] Artifact filenames are stable enough for external sharing
