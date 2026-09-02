import Std.Tactic.Omega

universe u

structure Tx (Account : Type u) where
  debit  : Account
  credit : Account
  amount : Int

section Ledger

variable {Account : Type u}

def debitEntry (transaction : Tx Account) : Int :=
  transaction.amount

def creditEntry (transaction : Tx Account) : Int :=
  -transaction.amount

def transactionTotal (transaction : Tx Account) : Int :=
  debitEntry transaction + creditEntry transaction

def runLedgerTotal : List (Tx Account) → Int
  | [] => 0
  | transaction :: rest => transactionTotal transaction + runLedgerTotal rest

theorem transactionTotal_zero (transaction : Tx Account) :
    transactionTotal transaction = 0 := by
  unfold transactionTotal debitEntry creditEntry
  omega

theorem runLedgerTotal_zero (transactions : List (Tx Account)) :
    runLedgerTotal transactions = 0 := by
  induction transactions with
  | nil =>
      rfl
  | cons transaction rest inductionHypothesis =>
      rw [runLedgerTotal, transactionTotal_zero, inductionHypothesis]
      rfl

end Ledger
