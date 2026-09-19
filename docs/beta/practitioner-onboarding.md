# Practitioner Pilot — Onboarding Guide

**Issue:** #363 | **Lane:** `lane/verify` | **Status:** Demo preparation; external pilot not yet executed
**Related:** [One-Pager](./practitioner-one-pager.md) | [Feedback Template](./feedback-synthesis-template.md)

---

## What is a Practitioner?

A Practitioner is a licensed professional (therapist, life coach, recovery counselor, accountability coach) who uses Styx to manage behavioral commitments for their clients. Styx gives practitioners:

- A verified, third-party audit trail their clients can't manipulate
- Real financial stakes that amplify client motivation (loss aversion)
- A dashboard to monitor contract compliance, dispute resolutions, and pattern data

---

## Practitioner Onboarding Checklist

### Phase 1 — Pre-Engagement (Before First Session)

- [ ] Practitioner receives the [Styx Practitioner One-Pager](./practitioner-one-pager.md)
- [ ] 20-minute demo call scheduled (use the [Demo Loop Script](#demo-loop-script) below)
- [ ] For an external pilot, obtain counsel-approved participant documents and the required privacy/compliance approvals (#315–#317). This repository does **not** provide an approved beta NDA; do not describe this prerequisite as completed.
- [ ] For the **local seeded demo only**, use the existing practitioner persona rather than the nonexistent `/api/admin/users/promote` endpoint:

  ```bash
  npm run demo:launch
  npm run demo:credentials
  ```

  The seeded `dr.moira@demo.styx.protocol` account has role `PRACTITIONER`; obtain its local demo password from the credentials command and use the `/practitioner` web route. See `scripts/demo/README.md` and `scripts/demo/seed-circles.sql`. Never promote a real user by copying the old curl example; production practitioner provisioning remains an explicit pilot prerequisite owned by #363.

- [ ] Practitioner confirmed they've reviewed `docs/legal/legal--aegis-protocol.md` Sections 1–3

### Phase 2 — First Session Setup

- [ ] Practitioner logs into The Judge (desktop admin app)
- [ ] Practitioner creates their first client commitment:
  - Navigate to **Contracts → New Contract → On Behalf Of Client**
  - Set client name, oath type, duration, stake amount
  - Review Fury audit assignment parameters
- [ ] Client receives invite link and completes account setup
- [ ] First contract signed by client (cryptographic oath)

### Phase 3 — Ongoing Monitoring

- [ ] Practitioner reviews daily attestation logs in The Judge
- [ ] Weekly: Review Fury audit queue for pending verdicts on client proofs
- [ ] Practitioner submits feedback via [Feedback Template](./feedback-synthesis-template.md) after 2 weeks

---

## Demo Loop Script

A structured 20-minute walkthrough for the practitioner pre-engagement call:

### Minutes 0–3: Problem Frame

> "Your client commits to a behavior change in your office. Three days later, accountability fades. There's no third-party verification, no financial skin in the game, and no audit trail for your records."

### Minutes 3–8: Live Demo — Contract Creation

- Create a sample No-Contact contract on the web app (live, test-money mode)
- Show the behavioral physics display: loss aversion λ=1.955, dispute window 24h
- Show the stake configuration — explain why financial stakes work psychologically

### Minutes 8–13: Live Demo — Proof Submission & Fury Audit

- Open the mobile app for the sample contract and exercise its start/stop controls. The current beta creates a clearly labeled `SYNTHETIC_BETA` payload; it does not upload a native or pre-recorded camera video.
- Submit that payload and wait for the processing screen to report that the proof was queued.
- Sign in to the web app with a seeded Fury or admin account and open `/fury` to show an assignment in the implemented Fury Workbench.
- If the submitted proof does not appear in that account's queue, mark assignment propagation **not verified**; do not substitute a filesystem artifact or desktop aggregate.

### Minutes 13–18: Practitioner Dashboard Walkthrough

- Show the HR dashboard (`/hr` route in the web app)
- Show the ledger inspector (The Judge desktop)
- Show the anti-collusion routing panel

### Minutes 18–20: Pricing & Next Steps

- Current beta: Free for pilot practitioners
- Future model: $49–$349/mo practitioner seat (from `docs/planning/`)
- Next step: Resolve the external-pilot prerequisites above before enrolling a real practitioner or client.

---

## Practitioner FAQ

**Q: Can I see my client's actual messages/communications?**
A: No. Styx verifies the absence of contact using cryptographic proof and digital exhaust metadata, not message content. Privacy is by design.

**Q: What if my client disputes an audit result?**
A: A 24-hour dispute window exists. Disputed verdicts trigger a second Fury panel with different auditors. The `ZKPrivacyEngine` ensures audit integrity without exposing private data.

**Q: Is Styx HIPAA compliant?**
A: Beta mode does not yet have formal HIPAA BAA in place. Do not use Styx for clinical PHI until legal counsel completes sign-off (Issue #315–#317).

**Q: What happens if the client fails?**
A: Staked funds are slashed from the client's escrow account and transferred to the configured forfeiture destination (either system revenue or a designated charity — configurable per contract).

---

## Evidence

Evidence file for triage: `docs/beta/practitioner-onboarding.md:1`
