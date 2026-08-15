---
generated: true
department: LEG
artifact_id: L13
governing_sop: "SOP--legal-documentation.md"
phase: hardening
product: styx
date: "2026-08-15"
---

# HIPAA Business Associate Agreement — Template (Draft)

**STYX -- THE BLOCKCHAIN OF TRUTH**

_Last updated: 2026-08-15_
_Effective date: [TBD -- not executable in its current state]_

> **DRAFT — NOT COUNSEL-REVIEWED. DO NOT EXECUTE.**
> This is an internal template authored from the platform's own implementation. It has **not** been
> reviewed by qualified legal counsel and is **not** a legally binding instrument. Outside counsel
> has not been retained (issue **#315**). **No BAA has ever been executed with any customer**, and
> §0 below lists the technical prerequisites that are not yet met. Signing this document as drafted
> would create obligations the Platform cannot currently satisfy.

Named by the enterprise gate at `docs/checklists/enterprise-sales-readiness.md`:
*"HIPAA BAA ready to sign — for healthcare enterprise customers. Verify: BAA template reviewed by
counsel."* That verification has **not** occurred.

Companion documents: `docs/legal/dpa-template.md` (the general data processing agreement — for
customers who are **not** covered entities, that document, not this one, is the right instrument),
`docs/legal/regulatory-risk-register.md` (the HIPAA exposure analysis),
`docs/enterprise/security-whitepaper.md` (the technical controls §5 references).

---

## 0. Read This Before Anything Else

**Styx is not a HIPAA covered entity.** It is not a healthcare provider, a health plan, or a
healthcare clearinghouse. It stores no diagnostic codes, no treatment plans, and no clinical notes.
The regulatory risk register's standing position is that ordinary B2B practitioner use of Styx does
**not** create a business associate relationship, because practitioners use the Platform as a
supplementary behavioral tool rather than a clinical record system.

This template exists for the narrower case where a **covered-entity customer determines otherwise**
about its own use — and needs a BAA before it will buy. It is not an assertion that Styx is HIPAA
compliant, and it must never be presented as one.

### 0.1 Prerequisites that are NOT met today

| Prerequisite | Status |
|---|---|
| Counsel review of this template | **Not done** — issue #315 |
| Legal opinion on whether B2B use creates a business associate relationship | **Not obtained** — named as mitigation item (5) in `regulatory-risk-register.md` |
| Multi-factor authentication on practitioner accounts | **Not implemented** |
| Encryption-key custody separate from the hosting vendor | **Not implemented** — keys are vendor-managed (Render, Cloudflare, Stripe) |
| Sub-processor BAAs (Render, Cloudflare) | **Not executed** |
| SOC 2 Type II | **Not started** |
| Independent penetration test | **Not performed** |
| Breach-notification runbook exercised | **Not exercised** |
| A "PHI" data classification distinct from general behavioral data | **Does not exist** in the schema |

The last row is the load-bearing one. **The Platform has no mechanism to segregate, label, or apply
different handling to protected health information.** Behavioral and health-adjacent data (weight,
BMI, exercise evidence) is stored, encrypted, and access-controlled exactly like every other user
record. Any obligation in this template that assumes PHI can be isolated is aspirational until that
mechanism exists.

---

## 1. Parties and Purpose

This Business Associate Agreement ("BAA") supplements the Terms of Service and any Enterprise
subscription agreement between [ORGANVM Entity TBD] ("Business Associate", "we") and the customer
identified in the order form ("Covered Entity", "you").

It applies **only** where you are a Covered Entity or Business Associate under 45 C.F.R. Parts 160
and 164 (the "HIPAA Rules") and you disclose Protected Health Information ("PHI") to us in
connection with the Platform. Terms not defined here have the meaning given in the HIPAA Rules.

## 2. Permitted Uses and Disclosures

We may use and disclose PHI only:

1. to perform the services described in the subscription agreement;
2. for our own proper management and administration, or to carry out our legal responsibilities;
3. as Required by Law; and
4. to provide data aggregation services relating to your healthcare operations, where the
   subscription agreement provides for them.

We will not use or disclose PHI in any manner that would violate the HIPAA Rules if done by you,
except as permitted by §2(2) above.

**We will not sell PHI, and will not use or disclose PHI for marketing or advertising, under any
circumstances.**

## 3. Minimum Necessary

We will request, use, and disclose only the minimum necessary PHI to accomplish the purpose of the
request, use, or disclosure.

> **OPEN QUESTION FOR COUNSEL — minimum necessary and the peer-audit model.** The Platform's core
> function routes a client's proof submission to **anonymous third-party peer auditors** who are not
> your workforce and are not our workforce (they are independent contractors — see
> `fury-auditor-agreement-DRAFT.md`). The submission is redacted before it is served (faces blurred,
> voices pitch-shifted, subject shown only as an alias), and auditors never receive the original
> media. Counsel must determine whether a redacted behavioral proof reviewed by an anonymous
> contractor is a disclosure of PHI at all, and if it is, whether it can ever satisfy minimum
> necessary. **If the answer is no, peer audit must be disabled for PHI-bearing accounts before any
> BAA is executed — and that capability does not exist today.**

## 4. Safeguards

We will use appropriate administrative, physical, and technical safeguards, and comply with the
Security Rule with respect to electronic PHI, to prevent use or disclosure of PHI other than as this
BAA provides.

The safeguards **as implemented today** are described in `docs/enterprise/security-whitepaper.md`
and summarized here without embellishment:

| Safeguard | As implemented |
|---|---|
| Encryption at rest | AES-256, vendor-managed (Render PostgreSQL, Cloudflare R2) |
| Encryption in transit | TLS via Cloudflare and Render; security headers (including HSTS) applied by `helmet()` at the API bootstrap |
| Access control | Role-based; role and ban status re-read from the database on every request, not from the session token |
| Audit logging | Hash-chained, append-only event log with a database-level immutability trigger; verified daily |
| Media privacy | Redacted derivative only; the serving path fails closed to no URL when no redacted asset exists |
| Integrity | Double-entry ledger with posting-time invariants and database-enforced idempotency |
| Workforce | **Sole founder.** No separation of duties, no security team, no security-awareness training program |

The final row is a material limitation and is stated rather than omitted.

## 5. Subcontractors

We will ensure that any subcontractor that creates, receives, maintains, or transmits PHI on our
behalf agrees in writing to restrictions and conditions at least as restrictive as those that apply
to us.

**Current subprocessors that would touch PHI:** Render (hosting, database), Cloudflare (object
storage, CDN), Stripe (payments and identity verification), Sentry (error tracking), and the
transactional email provider. **None has executed a BAA with us** (§0.1). Until they have, this
clause cannot be satisfied.

Additionally: the Platform's LLM subprocessors (Google Gemini, Groq) receive contract text and
anonymized snippets for term validation and moderation. **Counsel must determine whether any
PHI-bearing account's data can reach those paths, and if so, they must be disabled for such
accounts before a BAA is executed.**

## 6. Reporting and Breach Notification

We will report to you:

- any use or disclosure of PHI not permitted by this BAA of which we become aware, without
  unreasonable delay;
- any Security Incident of which we become aware; and
- any Breach of Unsecured PHI, without unreasonable delay and in no case later than **30 calendar
  days** after discovery.

A Breach report will include, to the extent known: the identification of each individual whose PHI
was involved, the nature of the breach, the date of the breach and of its discovery, the PHI
involved, and the remediation taken.

Unsuccessful Security Incidents that result in no unauthorized access — pings, port scans, blocked
login attempts, denied access attempts — are reported in aggregate on request rather than
individually.

## 7. Individual Rights

We will, within **15 business days** of your written request:

- make PHI in a Designated Record Set available to you for access under 45 C.F.R. § 164.524;
- make PHI available for amendment and incorporate amendments under § 164.526; and
- make available the information required for an accounting of disclosures under § 164.528.

Where an individual requests access directly from us, we will forward the request to you rather than
respond, unless the subscription agreement provides otherwise.

The Platform's implemented data-subject facilities are a structured self-service export and a
deletion request with a 30-day grace period before erasure. **Neither is scoped to a Designated
Record Set**, and no accounting-of-disclosures facility exists. Meeting this section as written
requires work that has not been done.

## 8. Access by the Secretary

We will make our internal practices, books, and records relating to the use and disclosure of PHI
available to the Secretary of Health and Human Services for purposes of determining your compliance
with the HIPAA Rules.

## 9. Term and Termination

This BAA takes effect on the effective date of the subscription agreement and terminates when all
PHI is returned or destroyed, or when protections are extended under §9.2.

### 9.1 Termination for cause

You may terminate the subscription agreement immediately if we materially breach this BAA and fail
to cure within **30 days** of written notice.

### 9.2 Return or destruction of PHI

On termination we will return or destroy all PHI we maintain, in any form, and retain no copies,
where feasible.

**Where it is not feasible, we will state so and extend the protections of this BAA to the retained
PHI, limiting further uses and disclosures to the purposes that make return or destruction
infeasible.** Two such cases exist today and are disclosed in advance:

1. **The append-only audit log.** Platform events are recorded in a hash-chained log that a
   database trigger prevents from being updated or deleted. Erasure anonymizes the user record; it
   does not rewrite log history, because rewriting it would destroy the integrity guarantee the log
   exists to provide. Our mitigation is payload minimization at write time, not retroactive
   deletion.
2. **Financial transaction records**, retained for seven years under applicable US law and
   anonymized after account deletion.

> **OPEN QUESTION FOR COUNSEL — immutable audit logs and the return-or-destroy obligation.** Whether
> an intentionally immutable log is "infeasible to destroy" within the meaning of
> 45 C.F.R. § 164.504(e)(2)(ii)(J), and what payload minimization is sufficient, must be answered
> before any BAA is executed. This is a structural conflict between the Platform's integrity model
> and HIPAA's erasure model, not an implementation gap.

## 10. No Warranty of Compliance

Execution of this BAA is not a representation that the Platform is "HIPAA compliant" — a status
that does not exist as a certification. It is a contractual allocation of the obligations the HIPAA
Rules place on a business associate. You remain responsible for your own compliance, including for
determining whether your use of the Platform involves PHI at all.

## 11. Miscellaneous

- **Order of precedence.** Where this BAA conflicts with the subscription agreement or the Terms of
  Service with respect to PHI, this BAA governs.
- **Amendment.** The parties will amend this BAA as necessary to comply with changes to the HIPAA
  Rules.
- **Interpretation.** Ambiguity is resolved in favor of a meaning that permits compliance with the
  HIPAA Rules.
- **No third-party beneficiaries.**

---

## Drafting Notes (internal — remove before publication)

This template is a **starting point for counsel**, not a document to be signed. Its three unresolved
structural conflicts, in priority order:

1. **Peer audit vs. minimum necessary** (§3) — the Platform's core mechanism discloses redacted
   proof material to anonymous non-workforce contractors. If that is a PHI disclosure, the model is
   incompatible with a BAA unless peer audit can be disabled per account, which it cannot be today.
2. **Immutable audit log vs. return-or-destroy** (§9.2) — the integrity guarantee and the erasure
   obligation are in direct tension.
3. **No PHI data classification** (§0.1) — every obligation that assumes PHI can be isolated is
   currently unimplementable.

Until those are answered, the correct commercial response to a "do you have a BAA?" question is the
one the customer-facing FAQ already gives: BAAs are planned for the Enterprise tier and are **not
yet executed**. Do not improve on that answer.

**Source of every factual claim about mechanism in this draft:**
`src/api/services/ledger/truth-log.service.ts` and `src/api/database/schema.sql` (§9.2 immutability),
`src/api/src/modules/users/gdpr.service.ts` (§7 export/erasure and the 30-day grace period),
`src/api/services/media/redaction.service.ts` and `src/api/src/modules/fury/fury.controller.ts`
(§3, §4 redaction), `src/api/src/common/guards/role.guard.ts` (§4 access control),
`src/api/src/main.ts` (§4 transport), `docs/legal/regulatory-risk-register.md` (§0).
If any of those change, this draft is stale.
