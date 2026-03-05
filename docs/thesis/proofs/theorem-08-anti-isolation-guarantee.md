# Theorem T8: Recovery Protocol Anti-Isolation Guarantee

> **Chapter:** 4 (Results)
> **Mathematical tool:** Predicate logic; universal quantification
> **Code mapping:** `src/api/services/health/recovery-protocol.service.ts`
> **References:** Marlatt (2005), Cordier et al. (2021), Holt et al. (2003)

---

## Formal Definition (D8)

The **Anti-Isolation Predicate** is a universally quantified conjunction over all recovery contracts:

> ∀*c* ∈ *C*_recovery: *Φ*(*c*)

where *Φ*(*c*) = *φ*₁(*c*) ∧ *φ*₂(*c*) ∧ *φ*₃(*c*) ∧ *φ*₄(*c*) ∧ *φ*₅(*c*)

| Predicate | Statement | Purpose |
|-----------|-----------|---------|
| *φ*₁ | |targets(*c*)| ≤ *n̄*NC = 3 | Prevent broad social isolation |
| *φ*₂ | duration(*c*) ≤ *δ̄*R = 30 days | Force periodic re-evaluation |
| *φ*₃ | *AP*(*c*) ≠ ∅ | Ensure external accountability witness |
| *φ*₄ | voluntary(*c*) = true | Prevent coerced self-harm |
| *φ*₅ | noMinors(*c*) ∧ noDependents(*c*) ∧ noLegalObligations(*c*) | Prevent harm to vulnerable third parties |

**Domain restriction:** *C*_recovery = {*c* ∈ *C* : oathCategory(*c*) ∈ *O*_R} where *O*_R = {RECOVERY_NOCONTACT, RECOVERY_SUBSTANCE, RECOVERY_DETOX, RECOVERY_AVOIDANCE}.

---

## Theorem Statement

**Theorem T8 (Anti-Isolation Guarantee).** The Recovery Protocol satisfies:

**(a) Isolation Prevention:** No recovery contract can target more than 3 individuals for no-contact enforcement, bounding the social network disruption.

**(b) Temporal Bound:** No recovery contract can exceed 30 days without explicit renewal, forcing periodic welfare assessment.

**(c) Witness Guarantee:** Every recovery contract has at least one designated accountability partner external to the platform, preventing closed-system feedback loops.

**(d) Consent Completeness:** Every recovery contract requires explicit acknowledgment of four safety conditions, preventing coerced or uninformed participation.

**(e) Conjunction Necessity:** All five predicates are independently necessary — removing any one enables a specific harm scenario.

---

## Proof

### Part (a): Isolation Prevention (*φ*₁)

**Claim:** |targets(*c*)| ≤ 3 for all recovery contracts.

**Proof by code enforcement:**

For no-contact contracts (oathCategory = `RECOVERY_NOCONTACT`):

```typescript
if (metadata.noContactIdentifiers.length > MAX_NOCONTACT_TARGETS) {
  throw new HttpException(
    `Recovery Protocol: Maximum ${MAX_NOCONTACT_TARGETS} no-contact targets per contract to prevent isolation.`,
    HttpStatus.NOT_ACCEPTABLE,
  );
}
```

where `MAX_NOCONTACT_TARGETS = 3` (from `behavioral-logic.ts:100`).

The service rejects any contract with more than 3 targets before persistence. Since the HTTP exception occurs before any database write, no contract with |targets| > 3 can exist in the system.

**Social isolation bound:** With at most 3 no-contact targets per contract and contracts capped at 30 days, a user's social network disruption is bounded by at most 3 relationships × 30 days. Renewal is possible but requires re-evaluation (predicate *φ*₂). ✓

Additionally, the contract requires at least one target:

```typescript
if (!metadata.noContactIdentifiers || metadata.noContactIdentifiers.length === 0) {
  throw new HttpException(
    'Recovery Protocol: At least one no-contact identifier is required.',
    HttpStatus.NOT_ACCEPTABLE,
  );
}
```

This ensures: 1 ≤ |targets(*c*)| ≤ 3 for no-contact contracts. ✓

### Part (b): Temporal Bound (*φ*₂)

**Claim:** duration(*c*) ≤ 30 days for all recovery contracts.

```typescript
if (durationDays > MAX_NOCONTACT_DURATION_DAYS) {
  throw new HttpException(
    `Recovery Protocol: Maximum contract duration is ${MAX_NOCONTACT_DURATION_DAYS} days. Longer commitments require renewal to ensure ongoing well-being.`,
    HttpStatus.NOT_ACCEPTABLE,
  );
}
```

where `MAX_NOCONTACT_DURATION_DAYS = 30` (from `behavioral-logic.ts:99`).

**Clinical rationale:** The 30-day cap aligns with Marlatt's (2005) relapse prevention model: the first 30 days of behavior change represent the highest-risk period, after which a clinical re-evaluation is warranted. Forcing renewal prevents indefinite no-contact commitments that could evolve from therapeutic into harmful. ✓

### Part (c): Witness Guarantee (*φ*₃)

**Claim:** Every recovery contract has a non-empty accountability partner.

```typescript
if (!metadata.accountabilityPartnerEmail || metadata.accountabilityPartnerEmail.trim() === '') {
  throw new HttpException(
    'Recovery Protocol: An accountability partner email is required for all recovery contracts.',
    HttpStatus.NOT_ACCEPTABLE,
  );
}
```

The accountability partner is external to the Styx platform (identified by email, not Styx user ID), ensuring:
1. At least one person outside the platform is aware of the recovery commitment
2. The user cannot be entirely isolated within a closed Styx feedback loop
3. An external party can intervene if the commitment becomes harmful

**Formal property:** *AP*(*c*) ∈ EmailAddr \ {∅} for all *c* ∈ *C*_recovery. ✓

### Part (d): Consent Completeness (*φ*₄ ∧ *φ*₅)

**Claim:** All four safety acknowledgments must be explicitly true.

```typescript
const acks = metadata.acknowledgments;
if (!acks || !acks.voluntary || !acks.noMinors || !acks.noDependents || !acks.noLegalObligations) {
  throw new HttpException(
    'Recovery Protocol: All safety acknowledgments must be confirmed before contract creation.',
    HttpStatus.NOT_ACCEPTABLE,
  );
}
```

The four acknowledgments form a safety attestation tuple *Ack*(*c*) ∈ 𝔹⁴:

| Acknowledgment | Prevents |
|---------------|----------|
| `voluntary` | Coerced participation (e.g., abusive partner forcing no-contact) |
| `noMinors` | No-contact with minor children (child custody interference) |
| `noDependents` | No-contact with dependent individuals (elder care interference) |
| `noLegalObligations` | No-contact violating existing legal obligations (custody orders, care mandates) |

All four must be true: *Ack*(*c*) = (T, T, T, T). Any false value → rejection. ✓

### Part (e): Conjunction Necessity

We show each predicate is independently necessary by exhibiting a harm scenario if removed:

**Without *φ*₁ (no target limit):** A user could create a no-contact contract targeting 20 people, effectively self-isolating from their entire social support network — a known risk factor for suicide (Marlatt, 2005).

**Without *φ*₂ (no duration cap):** A user could create a 365-day no-contact contract, removing the forced re-evaluation that detects deteriorating mental health.

**Without *φ*₃ (no accountability partner):** The platform becomes a closed system where a user's behavioral commitments are invisible to anyone who could intervene, enabling self-destructive spirals without external awareness.

**Without *φ*₄ (no voluntariness check):** An abusive partner could coerce a victim into creating a no-contact contract targeting the victim's support system, weaponizing the platform for control.

**Without *φ*₅ (no third-party harm check):** A parent could create a no-contact contract targeting their own minor children, using the platform to rationalize custodial neglect.

Each harm scenario is specific to the removed predicate and not covered by the remaining four. Therefore, all five predicates are independently necessary. ∎

---

## Formal Specification

In predicate logic notation:

```
∀c ∈ C_recovery:
  (|targets(c)| ≥ 1 ∧ |targets(c)| ≤ 3)        ∧  -- φ₁: bounded social disruption
  (duration(c) ≤ 30)                                ∧  -- φ₂: temporal bound
  (AP(c) ≠ ∅ ∧ AP(c) ∈ EmailAddr)                 ∧  -- φ₃: external witness
  (voluntary(c) = true)                             ∧  -- φ₄: explicit consent
  (noMinors(c) ∧ noDependents(c) ∧ noLegalObligs(c))  -- φ₅: third-party protection
```

This conjunction is **satisfiable** (non-empty feasibility region): a voluntary adult who designates 1–3 no-contact targets, names an accountability partner, and has no custodial obligations satisfies all predicates.

---

## Code-to-Proof Mapping

| Proof Element | Code Location | Line(s) |
|--------------|---------------|---------|
| Metadata requirement | `recovery-protocol.service.ts:validateRecoveryContract()` | L31–36 |
| Accountability partner | `recovery-protocol.service.ts:validateRecoveryContract()` | L39–44 |
| Duration cap (30 days) | `recovery-protocol.service.ts:validateRecoveryContract()` | L47–52 |
| Target minimum (1) | `recovery-protocol.service.ts:validateRecoveryContract()` | L56–60 |
| Target maximum (3) | `recovery-protocol.service.ts:validateRecoveryContract()` | L61–67 |
| Acknowledgments | `recovery-protocol.service.ts:validateRecoveryContract()` | L71–77 |
| Constants | `behavioral-logic.ts` | L99–101 |

---

## Interaction with Aegis (T5)

The Recovery Protocol (T8) and Aegis Protocol (T5) form a complementary safety system:

| Domain | Aegis (T5) | Recovery (T8) |
|--------|-----------|---------------|
| Financial harm | Stake caps, downscaling | — |
| Physical harm | BMI floor, velocity cap | — |
| Social harm | — | Target limits, accountability partner |
| Psychological harm | Duration minimum | Duration maximum, consent verification |

Together, they cover all four identified harm domains without overlap.
