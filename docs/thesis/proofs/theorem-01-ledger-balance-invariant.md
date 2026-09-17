# Theorem T1: Ledger Balance Invariant

> **Chapter:** 4 (Results)
> **Mathematical tool:** Induction over transaction sequence; group theory over (ℤ, +)
> **Code mapping:** `src/api/services/ledger/ledger.service.ts`
> **Validation gate:** `scripts/validation/01-phantom-money-check.ts`

---

## Formal Definition (D1)

Let _A_ be the set of all ledger accounts and _E_ = ⟨*e*₁, *e*₂, …, *e*ₙ⟩ an ordered sequence of double-entry transactions where each *e*ᵢ = (_dᵢ_, _cᵢ_, _mᵢ_) consists of:

- _dᵢ_ ∈ _A_: debit account
- _cᵢ_ ∈ _A_: credit account
- _mᵢ_ ∈ ℤ>0: amount in integer cents (strictly positive)

subject to the **entry guard**: _dᵢ_ ≠ _cᵢ_ for all _i_.

The **net balance** of account _a_ after _n_ transactions is:

> *B*ₙ(_a_) = Σᵢ₌₁ⁿ { _mᵢ_ if _dᵢ_ = _a_ } − Σᵢ₌₁ⁿ { _mᵢ_ if _cᵢ_ = _a_ }

---

## Theorem Statement

**Theorem T1 (Ledger Balance Invariant).** For any sequence of transactions _E_ = ⟨*e*₁, …, *e*ₙ⟩ satisfying the entry guard, the sum of all account balances is identically zero:

> Σ_{_a_ ∈ _A_} *B*ₙ(_a_) = 0 for all _n_ ≥ 0

Equivalently: no transaction in the Styx ledger can create or destroy money ("phantom money" is impossible).

---

## Proof

**By strong induction on the number of transactions _n_.**

### Base Case (_n_ = 0)

When no transactions have been recorded, *B*₀(_a_) = 0 for all _a_ ∈ _A_.

Therefore: Σ_{_a_ ∈ _A_} *B*₀(_a_) = 0. ✓

### Inductive Hypothesis

Assume that after _k_ transactions (_k_ ≥ 0), the invariant holds:

> Σ_{_a_ ∈ _A_} _B__k(_a_) = 0

### Inductive Step (_k_ → _k_ + 1)

Consider transaction _e__{k+1} = (*d*_{k+1}, _c__{k+1}, *m*_{k+1}) where _m__{k+1} > 0 and *d*_{k+1} ≠ _c__{k+1}.

The balance update affects exactly two accounts:

- _B__{k+1}(*d*_{k+1}) = _B__k(*d*_{k+1}) + _m__{k+1}
- _B__{k+1}(*c*_{k+1}) = _B__k(*c*_{k+1}) − _m__{k+1}
- For all other _a_: _B__{k+1}(_a_) = _B__k(_a_)

Therefore:

> Σ_{_a_ ∈ _A_} _B__{k+1}(*a*)
> = Σ_{_a_ ∈ _A_} _B__k(*a*) + *m*_{k+1} − _m__{k+1}
> = Σ_{_a_ ∈ _A_} _B__k(_a_) + 0
> = 0 (by inductive hypothesis)

### Guard Enforcement

The entry guards are enforced at the application layer in `recordTransaction()`:

1. **Positive amount:** `if (amount <= 0) throw new Error('Transaction amount must be strictly positive.')`
2. **Integer cents:** `if (!Number.isInteger(amount)) throw new Error('Transaction amount must be an integer (cents).')`
3. **Distinct accounts:** `if (debitAccountId === creditAccountId) throw new Error('Debit and credit accounts must be different.')`

These three guards ensure that every transaction admitted to the ledger satisfies the entry guard precondition (_mᵢ_ ∈ ℤ>0, _dᵢ_ ≠ _cᵢ_), preserving the inductive step's validity.

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

The ledger operates on the abelian group (ℤ, +, 0). Each transaction *e*ᵢ is a group element pair (+_mᵢ_, −*mᵢ*) whose sum is the identity element 0. The sequence of transactions forms a homomorphism from the transaction monoid to the trivial group, guaranteeing the kernel property Σ*B* = 0. ∎

---

## Code-to-Proof Mapping

| Proof Element                   | Code Location                                  | Line(s)     |
| ------------------------------- | ---------------------------------------------- | ----------- |
| Entry guard (amount > 0)        | `ledger.service.ts:recordTransaction()`        | L24         |
| Entry guard (integer)           | `ledger.service.ts:recordTransaction()`        | L27         |
| Entry guard (distinct accounts) | `ledger.service.ts:recordTransaction()`        | L30         |
| Double-entry insert             | `ledger.service.ts:recordTransaction()`        | L40–51      |
| Runtime invariant check         | `ledger.service.ts:verifyLedgerIntegrity()`    | L130–171    |
| Validation gate                 | `scripts/validation/01-phantom-money-check.ts` | entire file |

---

## Corollary

**Corollary T1.1 (Conservation of Stake).** For any contract _c_ with associated ledger entries, the total amount debited equals the total amount credited:

> Σ{_mᵢ_ : *e*ᵢ.contract = _c_, role = debit} = Σ{_mᵢ_ : *e*ᵢ.contract = _c_, role = credit}

This follows immediately from T1 restricted to the contract-scoped sub-ledger, as verified by `getContractLedger()`.
