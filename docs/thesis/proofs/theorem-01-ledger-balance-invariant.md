# Theorem T1: Ledger Balance Invariant

> **Chapter:** 4 (Results)
> **Mathematical tool:** Induction over transaction sequence; group theory over (ℤ, +)
> **Code mapping:** `src/api/services/ledger/ledger.service.ts`
> **Validation gate:** `scripts/validation/01-phantom-money-check.ts`

---

## Formal Definition (D1)

Let *A* be the set of all ledger accounts and *E* = ⟨*e*₁, *e*₂, …, *e*ₙ⟩ an ordered sequence of double-entry transactions where each *e*ᵢ = (*dᵢ*, *cᵢ*, *mᵢ*) consists of:
- *dᵢ* ∈ *A*: debit account
- *cᵢ* ∈ *A*: credit account
- *mᵢ* ∈ ℤ>0: amount in integer cents (strictly positive)

subject to the **entry guard**:  *dᵢ* ≠ *cᵢ* for all *i*.

The **net balance** of account *a* after *n* transactions is:

> *B*ₙ(*a*) = Σᵢ₌₁ⁿ { *mᵢ* if *dᵢ* = *a* } − Σᵢ₌₁ⁿ { *mᵢ* if *cᵢ* = *a* }

---

## Theorem Statement

**Theorem T1 (Ledger Balance Invariant).** For any sequence of transactions *E* = ⟨*e*₁, …, *e*ₙ⟩ satisfying the entry guard, the sum of all account balances is identically zero:

> Σ_{*a* ∈ *A*} *B*ₙ(*a*) = 0     for all *n* ≥ 0

Equivalently: no transaction in the Styx ledger can create or destroy money ("phantom money" is impossible).

---

## Proof

**By strong induction on the number of transactions *n*.**

### Base Case (*n* = 0)

When no transactions have been recorded, *B*₀(*a*) = 0 for all *a* ∈ *A*.

Therefore: Σ_{*a* ∈ *A*} *B*₀(*a*) = 0. ✓

### Inductive Hypothesis

Assume that after *k* transactions (*k* ≥ 0), the invariant holds:

> Σ_{*a* ∈ *A*} *B*_k(*a*) = 0

### Inductive Step (*k* → *k* + 1)

Consider transaction *e*_{k+1} = (*d*_{k+1}, *c*_{k+1}, *m*_{k+1}) where *m*_{k+1} > 0 and *d*_{k+1} ≠ *c*_{k+1}.

The balance update affects exactly two accounts:
- *B*_{k+1}(*d*_{k+1}) = *B*_k(*d*_{k+1}) + *m*_{k+1}
- *B*_{k+1}(*c*_{k+1}) = *B*_k(*c*_{k+1}) − *m*_{k+1}
- For all other *a*: *B*_{k+1}(*a*) = *B*_k(*a*)

Therefore:

> Σ_{*a* ∈ *A*} *B*_{k+1}(*a*)
> = Σ_{*a* ∈ *A*} *B*_k(*a*) + *m*_{k+1} − *m*_{k+1}
> = Σ_{*a* ∈ *A*} *B*_k(*a*) + 0
> = 0  (by inductive hypothesis)

### Guard Enforcement

The entry guards are enforced at the application layer in `recordTransaction()`:

1. **Positive amount:** `if (amount <= 0) throw new Error('Transaction amount must be strictly positive.')`
2. **Integer cents:** `if (!Number.isInteger(amount)) throw new Error('Transaction amount must be an integer (cents).')`
3. **Distinct accounts:** `if (debitAccountId === creditAccountId) throw new Error('Debit and credit accounts must be different.')`

These three guards ensure that every transaction admitted to the ledger satisfies the entry guard precondition (*mᵢ* ∈ ℤ>0, *dᵢ* ≠ *cᵢ*), preserving the inductive step's validity.

### Defense in Depth

The `verifyLedgerIntegrity()` method provides a runtime verification layer:

```typescript
// Sum of all account balances must be exactly zero
let netBalance = 0;
for (const balance of accountBalances.values()) {
  netBalance += balance;
}
return { balanced: Math.abs(netBalance) < 1, ... };
```

This acts as a runtime check on the invariant (with 1-cent tolerance for floating-point representation), complementing the proof-by-construction approach.

### Algebraic Perspective

The ledger operates on the abelian group (ℤ, +, 0). Each transaction *e*ᵢ is a group element pair (+*mᵢ*, −*mᵢ*) whose sum is the identity element 0. The sequence of transactions forms a homomorphism from the transaction monoid to the trivial group, guaranteeing the kernel property Σ*B* = 0. ∎

---

## Code-to-Proof Mapping

| Proof Element | Code Location | Line(s) |
|--------------|---------------|---------|
| Entry guard (amount > 0) | `ledger.service.ts:recordTransaction()` | L24 |
| Entry guard (integer) | `ledger.service.ts:recordTransaction()` | L27 |
| Entry guard (distinct accounts) | `ledger.service.ts:recordTransaction()` | L30 |
| Double-entry insert | `ledger.service.ts:recordTransaction()` | L40–51 |
| Runtime invariant check | `ledger.service.ts:verifyLedgerIntegrity()` | L130–171 |
| Validation gate | `scripts/validation/01-phantom-money-check.ts` | entire file |

---

## Corollary

**Corollary T1.1 (Conservation of Stake).** For any contract *c* with associated ledger entries, the total amount debited equals the total amount credited:

> Σ{*mᵢ* : *e*ᵢ.contract = *c*, role = debit} = Σ{*mᵢ* : *e*ᵢ.contract = *c*, role = credit}

This follows immediately from T1 restricted to the contract-scoped sub-ledger, as verified by `getContractLedger()`.
