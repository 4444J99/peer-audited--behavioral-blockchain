import Mathlib.Algebra.BigOperators.Group.Finset.Basic
import Mathlib.Data.Fintype.Basic
import Mathlib.Data.Int.Basic

open scoped BigOperators

universe u

structure Tx (Account : Type u) where
  debit  : Account
  credit : Account
  amount : ℤ

section Ledger

variable {Account : Type u} [Fintype Account] [DecidableEq Account]

def delta (t : Tx Account) (a : Account) : ℤ :=
  (if t.debit = a then t.amount else 0) -
  (if t.credit = a then t.amount else 0)

def applyTx (t : Tx Account) (balances : Account → ℤ) : Account → ℤ :=
  fun a => balances a + delta t a

def runLedger (transactions : List (Tx Account)) : Account → ℤ :=
  transactions.foldr applyTx (fun _ => 0)

theorem transaction_delta_sums_to_zero (t : Tx Account) :
    ∑ a, delta t a = 0 := by
  simp [delta, Finset.sum_sub_distrib]

theorem applyTx_preserves_total
    (t : Tx Account)
    (balances : Account → ℤ)
    (h : ∑ a, balances a = 0) :
    ∑ a, applyTx t balances a = 0 := by
  simp [applyTx, Finset.sum_add_distrib, h, transaction_delta_sums_to_zero]

theorem runLedger_total_zero (transactions : List (Tx Account)) :
    ∑ a, runLedger transactions a = 0 := by
  induction transactions with
  | nil =>
      simp [runLedger]
  | cons t rest ih =>
      simpa [runLedger] using applyTx_preserves_total t (runLedger rest) ih

end Ledger
