---
generated: true
department: LEG
artifact_id: L16
governing_sop: "SOP--legal-documentation.md"
phase: hardening
product: styx
date: "2026-08-15"
---

# Stake Custody and Escrow Agreement (Draft)

**STYX -- THE BLOCKCHAIN OF TRUTH**

_Last updated: 2026-08-15_
_Effective date: [TBD -- prior to real-money activation]_

> **DRAFT — NOT COUNSEL-REVIEWED.**
> This is an internal draft authored from the platform's own implementation. It has **not** been
> reviewed by qualified legal counsel and is **not** a legally binding instrument. Outside counsel
> has not yet been retained (issue **#315**); the gambling-classification opinion this agreement
> depends on is issue **#136**. Do not publish, execute, or present this document to a user,
> a regulator, or a payment processor until counsel has reviewed and revised it.

Named by the phase gate at `docs/checklists/phase-gate-public-process.md` §2 → Legal Documents:
*"Escrow Agreement published (terms governing stake holding and release)."*

Companion documents: `docs/legal/terms-of-service.md` (§ Definitions, § Vault),
`docs/legal/legal--performance-wagering.md` (the classification analysis this agreement rests on),
`docs/legal/appendices/fbo-architecture.md` (the fund-flow diagram),
`docs/legal/state-jurisdiction-matrix-DRAFT.md` (the tier assignments §4 depends on).

---

## 1. Purpose and Parties

This Agreement governs how [ORGANVM Entity TBD] ("Company", "we", "us") holds and releases the
financial deposit a User places behind an Oath ("Stake"). It is incorporated by reference into the
Terms of Service and applies to every Oath created on the Platform.

**"User"** is the individual who creates an Oath and places a Stake.
**"Platform"** is the Styx behavioral contract platform.
**"Processor"** is Stripe, Inc., the payment services provider through which all Stakes are
authorized, captured, and released.
**"Vault"** is the term the Terms of Service uses for the custody arrangement described in §2. It is
a product term, not a separate legal entity.

## 2. What a Stake Actually Is

**This section is the one most likely to be misunderstood, so it states the mechanism before the
consequences.**

### 2.1 A Stake is an authorization hold, not a transfer

When a User creates an Oath, the Company does **not** take possession of the User's money. The
Company creates a payment authorization with the Processor using a manual-capture instruction. The
effect on the User's payment instrument is a **hold** — the amount is reserved against the User's
available credit or balance and is unavailable to the User for the duration of the Oath, but it is
**not** debited, and it does **not** move into any account controlled by the Company.

Funds move exactly once, at settlement, and only in the direction §3 specifies.

### 2.2 Consequences of §2.1

- **No interest, yield, or appreciation accrues on a Stake**, because there is no principal in a
  Company-held account to accrue on.
- **A Stake is not a deposit** with the Company in the banking sense, is not insured, and is not a
  claim against the Company's assets.
- **A Stake is not an investment.** A successful Oath results in no money changing hands at all.
  There is no mechanism by which a User can receive more than they staked.
- The Company's records of Stakes are an internal double-entry ledger (§6). Ledger balances are an
  accounting record; the authoritative record of the hold is the Processor's.

### 2.3 For-Benefit-Of accounts

Where a Stake is captured (§3.2), settlement routes through a For Benefit Of ("FBO") connected
account registered with the Processor for the User's jurisdiction. FBO accounts are registered per
ISO-3166-2 subdivision and selected at settlement from the User's recorded jurisdiction. Captured
funds held in an FBO account are held off the Company's balance sheet.

> **OPEN QUESTION FOR COUNSEL — FBO characterization.** Whether the FBO structure is sufficient to
> keep captured Stakes off the Company's balance sheet as a matter of law, and whether it triggers
> money transmitter licensing in any jurisdiction, is not resolved. This draft describes the
> mechanism; it does not opine on its legal characterization.

## 3. Release of a Stake

### 3.1 Successful Oath

If the Oath resolves as completed, the authorization is **released in full**. No amount is captured.
The hold on the User's payment instrument lifts on the Processor's own schedule, which is typically
within three to five business days and is outside the Company's control.

### 3.2 Failed Oath

If the Oath resolves as failed, the disposition of the Stake depends on the User's jurisdiction:

| Jurisdiction tier | Disposition of a failed Oath's Stake |
|---|---|
| **TIER_1** (full access) | **Captured.** The authorization is captured and the amount becomes Company revenue. |
| **TIER_2** (refund-only) | **Released.** The authorization is released in full. No amount is captured. |
| **TIER_3** (hard-blocked) | **Released.** An Oath should never exist in this tier; if one does, the Stake is released. |

This is not discretionary. It is enforced by a single function in the codebase
(`resolveStakeDisposition` in `src/api/services/escrow/disposition.ts`) to which every payment rail
delegates, so the answer cannot differ between the Processor rail and the internal ledger.

### 3.3 Partial capture

The Platform supports capturing less than the full authorized amount. Where a partial capture
occurs, the balance of the authorization is released. The Company will disclose the basis for any
partial capture in the User's settlement record.

### 3.4 Jurisdiction is determined at settlement

The tier in §3.2 is determined from the jurisdiction the Platform has recorded for the User at the
time of settlement, resolved by IP geolocation. Jurisdiction resolution is documented, with its
known limits, in `docs/enterprise/security-whitepaper.md` §5.

> **OPEN QUESTION FOR COUNSEL — jurisdiction at creation vs. at settlement.** A User may create an
> Oath in one tier and settle in another. The implementation reads the User's last known state at
> settlement. Counsel must confirm whether the governing jurisdiction should instead be fixed at
> Oath creation, and what disclosure a User is owed if the two differ.

## 4. Kill Switch and Fail-Safe Disposition

The Platform carries an administrative kill switch that forces **every** settlement to release
rather than capture, regardless of tier. Its state is stored durably and re-read before each
settlement, and if that store is unreachable the switch **defaults to on** — releasing is always
lawful, capturing while the switch's state is unknowable is not. Where the Platform cannot
determine a User's jurisdiction, the disposition likewise defaults to release. In every ambiguous
case, the Stake returns to the User.

The Company may exercise the kill switch without notice where it believes, in good faith, that
continued capture would be unlawful in any jurisdiction in which it operates.

## 5. Disputes and Appeals

A User may appeal a failed-Oath determination through the Platform's dispute process before the
Stake is captured. Where an appeal is pending, the authorization is held rather than captured, up to
the limits the Processor imposes on authorization lifetime.

> **OPEN QUESTION FOR COUNSEL — authorization expiry during an appeal.** Payment authorizations
> expire (commonly seven days). An appeal that outlasts the authorization forces a choice between
> re-authorizing, capturing before the appeal resolves, or releasing. **The Platform has no
> implemented policy for this case today**: a contract whose settlement cannot be completed is
> parked in a `RECONCILE_REQUIRED` state and swept every fifteen minutes; a contract that exhausts
> its retry budget is left for an operator rather than settled automatically. Counsel must state
> the correct default, and it must then be implemented before this Agreement is published.

Nothing in this Agreement limits the User's rights against their card issuer or bank, including the
right to dispute a charge.

## 6. Records and Auditability

Every movement of value is recorded as a double-entry posting in the Company's internal ledger, and
every settlement event is appended to a hash-chained, append-only audit log. Postings carry
deterministic idempotency keys so that a retried settlement cannot post twice. The ledger is
subjected to automated integrity checks; the audit log's hash chain is verified on a daily schedule.

The technical description of both mechanisms, including their limits, is in
`docs/enterprise/security-whitepaper.md` §2 and §3. A User may request the settlement record for
their own Oath.

## 7. Fees

No Platform Fee is charged during the beta. Where a Platform Fee applies, it is disclosed at the
point of purchase, is separate from the Stake, and is non-refundable. **A Platform Fee is never
taken from the Stake.**

## 8. What This Agreement Does Not Do

- It does not make the Company a bank, a trustee, or a fiduciary.
- It does not create a security, an investment contract, or a financial instrument.
- It does not guarantee the timing of a release, which depends on the Processor and the User's card
  issuer.
- It does not survive a determination by counsel or a regulator that the underlying model requires
  a licence the Company does not hold. In that event the Company will release all outstanding
  Stakes.

## 9. Amendment

The Company will provide notice of any material change to this Agreement before it applies to a new
Oath. A change never applies retroactively to an Oath already in progress.

---

## Drafting Notes (internal — remove before publication)

| Item | Status |
|---|---|
| Outside counsel retained | **No** — issue #315 |
| Gambling-classification opinion on file | **No** — issue #136 |
| Jurisdiction tier assignments signed off | **No** — issue #317 |
| Entity formed / named | **No** — "[ORGANVM Entity TBD]" throughout |
| Money transmitter analysis | **Not performed** |
| Processor high-risk underwriting approved | Tracked at `docs/checklists/phase-gate-public-process.md` §2 |

**Source of every factual claim about mechanism in this draft:**
`src/api/services/escrow/stripe.service.ts` (manual-capture holds, capture, partial capture,
idempotency), `src/api/services/escrow/disposition.ts` (§3.2 table),
`src/api/src/modules/payments/fbo-account.service.ts` (§2.3),
`src/api/services/escrow/dispute.service.ts` (§5),
`src/api/services/ledger/ledger.service.ts` and `src/api/services/ledger/truth-log.service.ts` (§6).
If any of those change, this draft is stale.
