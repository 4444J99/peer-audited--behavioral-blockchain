---
generated: true
department: LEG
artifact_id: L11
governing_sop: "SOP--legal-documentation.md"
phase: hardening
product: styx
date: "2026-08-15"
---

# Fury Auditor Agreement (Draft)

**STYX -- THE BLOCKCHAIN OF TRUTH**

_Last updated: 2026-08-15_
_Effective date: [TBD -- prior to beta launch]_

> **DRAFT — NOT COUNSEL-REVIEWED.**
> This is an internal draft authored from the platform's own implementation. It has **not** been
> reviewed by qualified legal counsel and is **not** a legally binding instrument. Outside counsel
> has not been retained (issue **#315**). This agreement carries a **worker-classification risk that
> only counsel can assess** — see §11, which is the reason this document must not be executed as
> drafted. Do not present it to a prospective auditor before counsel review.

Named by the phase gate at `docs/checklists/phase-gate-public-process.md` §2 → Legal Documents:
*"Fury Auditor Agreement published (terms governing peer audit obligations)."*
Registered as artifact **L11** in `docs/departments/leg/REGE.md`.

Companion documents: `docs/legal/terms-of-service.md` (§ Definitions — "Fury", "Bounty",
"Integrity Score"), `docs/enterprise/security-whitepaper.md` §7 (the technical description of the
audit pipeline every clause below describes).

---

## 1. The Engagement

This Agreement is between [ORGANVM Entity TBD] ("Company") and you ("Auditor", "Fury"). By
accepting an audit assignment on the Styx platform ("Platform") you agree to these terms.

You are engaged as an **independent contractor**, not an employee, partner, joint venturer, or agent
of the Company. Nothing in this Agreement creates an employment relationship.

> **This characterization is the drafting risk in this document, not a settled fact. See §11.**

## 2. What an Auditor Does

The Platform routes redacted proof submissions to a panel of auditors. You review the material you
are shown and render a verdict — `PASS` or `FAIL` — against the criteria displayed with the
assignment.

You are told, and you agree, that:

- **You choose whether to accept any assignment.** There is no minimum number of audits, no
  schedule, no shift, and no requirement to be available at any time.
- **You review anonymized material.** You see a subject alias, never the subject's identity.
- **You never receive the original media.** The Platform serves you a redacted derivative — faces
  blurred, voices pitch-shifted. If no redacted derivative exists, the Platform serves you nothing
  at all rather than the original. This is enforced in code, not by policy.
- **You are one of a panel.** Each proof is reviewed by three auditors. No single verdict decides an
  outcome.

## 3. Eligibility and Isolation

To receive assignments you must hold the auditor role on an active account with an Integrity Score
of at least 20.

The Platform will **not** assign you a proof where you are the submitter, are recorded in the same
state as the submitter, share the submitter's social guild, share the submitter's enterprise, or are
one of the submitter's accountability partners. These exclusions are applied automatically at
routing time. You must additionally decline any assignment where you recognize the subject, and
disclose it through the Platform.

## 4. Compensation

| Term | Value |
|---|---|
| Bounty per correct audit | **$2.00** (200 cents) |
| Penalty per incorrect audit | **$2.00** (200 cents) |
| Payment trigger | Panel consensus resolves the proof |
| Payment method | Credit to your Platform ledger account |

An audit is "correct" when your verdict matches the panel's resolved consensus outcome. An audit is
"incorrect" when it does not. **Both directions are financial**: a correct audit credits your
account from the bounty pool, and an incorrect audit debits your account to Company revenue.

You are not paid for time spent, for assignments you decline, or for a proof whose panel does not
reach consensus.

### 4.1 Symmetric stake — read this before accepting an assignment

The penalty is the mechanism that makes peer audit work: an auditor who votes without looking would
otherwise earn a bounty at the same rate as one who does. It also means **you can end an audit
session with a negative balance.** Do not accept assignments you are not prepared to review
carefully.

### 4.2 Payment integrity

Every bounty and penalty is a double-entry ledger posting carrying a deterministic idempotency key,
and every one is recorded in the Platform's append-only audit log. A retried settlement cannot pay
you twice, and it cannot penalize you twice. You may request the ledger record for any audit you
performed.

## 5. Quality Control — Honeypots

**The Platform injects synthetic proof submissions with known-correct answers into the audit
stream.** They are designed to be indistinguishable from genuine submissions, they are injected on a
recurring schedule, and you will not be told which assignments are synthetic.

An incorrect verdict on a synthetic proof is penalized on the same terms as §4. This is disclosed to
you here, in advance, and by accepting an assignment you consent to it.

## 6. Collusion and Manipulation

You may not coordinate your verdicts with any other auditor, operate more than one auditor account,
or solicit or accept anything of value in exchange for a verdict.

The Platform runs automated analysis for coordination signals — auditors who co-vote at abnormal
rates, whose verdicts are always identical, whose votes land inside a tight time window, or who
appear together on assignments far more often than random assignment predicts — and separately
correlates shared device fingerprints, shared payment instruments, and shared IP addresses.

A detection is not a determination. Where the Platform flags your account you will be notified and
may appeal; a shared household device is a legitimate explanation and the Platform carries an appeal
path for it. Where coordination is confirmed, the Company may reverse bounties, suspend, or
permanently terminate your access.

## 7. Confidentiality

Everything you see in an assignment is confidential. You may not record, screenshot, copy,
republish, or disclose any proof material, subject alias, or verdict outside the Platform.

This obligation survives termination of this Agreement indefinitely, because the material's
sensitivity does not expire.

## 8. Intellectual Property

Your verdicts, and any notes you submit with them, are licensed to the Company for the operation of
the Platform, including for computing Integrity Scores and consensus outcomes. You retain no rights
in proof material, which never belonged to you.

You acquire no rights in the Platform, its software, or its data.

## 9. Termination

Either party may terminate this Agreement at any time, for any reason, with or without notice.
On termination:

- Bounties already earned on resolved proofs remain payable.
- Assignments in flight are reassigned.
- Your confidentiality obligation (§7) survives.

The Company may suspend your access immediately, without prior notice, on a good-faith suspicion of
collusion, account sharing, or disclosure of proof material.

## 10. Taxes

You are responsible for all taxes on amounts you receive. The Company does not withhold. Where
required, the Company will issue an IRS Form 1099 for a calendar year in which your payments meet
the applicable reporting threshold. You must provide accurate taxpayer information before payout.

## 11. Worker Classification — The Open Risk

> **THIS SECTION IS FOR COUNSEL, NOT FOR THE AUDITOR. It must be removed or rewritten before this
> agreement is presented to anyone.**

The Company characterizes auditors as independent contractors (§1). That characterization is
**untested** and is the single largest legal exposure in this document. The relevant analysis is the
ABC test (California, Illinois, New Jersey, Massachusetts, and others) and the federal
economic-reality test. Applying the ABC test to the facts as implemented:

| Prong | Facts as the Platform actually operates | Assessment |
|---|---|---|
| **(A)** Free from control and direction | Auditors set no schedule, accept no minimum volume, and can decline any assignment. **But** the Company sets the review criteria, sets the price unilaterally, routes the work, grades the output against a hidden answer key (§5), and penalizes disagreement financially. | **Contested.** The honeypot-and-penalty mechanism is a strong control signal. |
| **(B)** Work outside the usual course of business | Peer audit **is** the product. Styx does not exist without Fury verdicts. | **Fails on its face.** |
| **(C)** Independently established trade | Auditors have no independent auditing business, no other clients, no ability to set their own rate, and cannot subcontract. | **Fails.** |

**Prong B is not arguable.** Any state applying a strict ABC test is likely to classify Furies as
employees on these facts. The disclosed exposure is payroll taxes, minimum wage (note that the $2.00
bounty is per audit, not per hour, and an auditor who reviews carefully may earn below minimum wage
for time spent), overtime, workers' compensation, and unemployment insurance — retroactively.

**Open questions counsel must answer before this Agreement is executed:**

1. Does the ABC test's prong B foreclose contractor classification for Furies in ABC-test states?
   If so, is the answer geographic exclusion, an employment model, or a redesign of the engagement?
2. Does the honeypot-and-penalty mechanism (§5) constitute control under prong A, and does
   disclosing it in advance change that?
3. Is a symmetric financial penalty on a contractor's own funds (§4.1) enforceable? Is it a
   wage deduction in any state?
4. Is an arbitration clause with a class-action waiver appropriate and enforceable here? **This
   draft deliberately contains no arbitration clause** — drafting one without counsel would be
   worse than omitting it.
5. What is the 1099 threshold exposure at projected auditor volumes, and does the ledger-credit
   payment model (§4) create constructive receipt before withdrawal?

The registry (`docs/departments/leg/REGE.md`) already schedules this analysis as quarterly item
**Q4** and generative prompt `GEN:fury-classification-review`, with the output landing on this
document. This section is the placeholder that review fills.

---

## Drafting Notes (internal — remove before publication)

| Item | Status |
|---|---|
| Outside counsel retained | **No** — issue #315 |
| Worker-classification memo | **Not performed** — §11 is the open question, not the answer |
| Arbitration clause | **Deliberately absent** — requires counsel |
| Entity formed / named | **No** — "[ORGANVM Entity TBD]" throughout |
| Non-compete | **Deliberately absent** — the REGE backlog names one; enforceability against a $2.00-per-audit contractor is doubtful and it is not drafted here |

**Source of every factual claim about mechanism in this draft:**
`src/api/services/fury-router/fury-router.worker.ts` (§3 isolation rules, panel routing),
`src/api/src/modules/fury/consensus.engine.ts` (§2 panel size, weighted consensus),
`src/api/src/modules/fury/fury.worker.ts` and `src/shared/libs/integrity.ts`
(§4 the $2.00 bounty/penalty and its idempotency),
`src/api/src/modules/fury/fury.controller.ts` and `src/api/services/media/redaction.service.ts`
(§2 redacted-derivative-only serving),
`src/shared/fury-logic/honeypot.engine.ts` and `src/api/services/intelligence/honeypot.service.ts` (§5),
`src/api/services/security/collusion-detection.service.ts` and
`src/api/src/modules/security/anti-sybil.service.ts` (§6).
If any of those change, this draft is stale.
