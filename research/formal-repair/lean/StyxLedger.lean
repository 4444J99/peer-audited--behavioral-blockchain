import Mathlib.Data.Int.Basic

universe u

structure Tx (Account : Type u) where
  debit  : Account
  credit : Account
  amount : ℤ

section Ledger

variable {Account : Type u}

def debitEntry (t : Tx Account) : ℤ :=
  t.amount

def creditEntry (t : Tx Account) : ℤ :=
  -t.amount

def transactionTotal (t : Tx Account) : ℤ :=
  debitEntry t + creditEntry t

def runLedgerTotal : List (Tx Account) → ℤ
  | [] => 0
  | transaction :: rest => transactionTotal transaction + runLedgerTotal rest

theorem transactionTotal_zero (transaction : Tx Account) :
    transactionTotal transaction = 0 := by
  simp [transactionTotal, debitEntry, creditEntry]

theorem runLedgerTotal_zero (transactions : List (Tx Account)) :
    runLedgerTotal transactions = 0 := by
  induction transactions with
  | nil =>
      rfl
  | cons transaction rest inductionHypothesis =>
      simp [runLedgerTotal, transactionTotal_zero, inductionHypothesis]

end Ledger
