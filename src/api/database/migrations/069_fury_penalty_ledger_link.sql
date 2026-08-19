-- Migration 069: link a Fury penalty to the ledger transaction that charged it.
--
-- fury_penalties has carried a `reversed_at` column since migration 021, but no
-- code ever set it: resolveAppeal's REVERSED branch DELETEd the row instead, and
-- the money never came back at all. The honeypot slash is posted in
-- fury.worker.ts via ledger.recordTransaction, entirely outside the case system,
-- so the appeal flow had nothing to point at even if it had tried to compensate.
--
-- These columns are that pointer. A reversal needs the transaction it is
-- compensating and the account to credit back; without both, "reverse the
-- penalty" cannot mean anything more than deleting a bookkeeping row.

ALTER TABLE fury_penalties
  ADD COLUMN IF NOT EXISTS ledger_transaction_id UUID,
  ADD COLUMN IF NOT EXISTS ledger_debit_account_id UUID,
  ADD COLUMN IF NOT EXISTS reversal_transaction_id UUID;

CREATE INDEX IF NOT EXISTS idx_fury_penalties_ledger_txn
  ON fury_penalties(ledger_transaction_id);

COMMENT ON COLUMN fury_penalties.ledger_transaction_id IS
  'The ledger transaction that took the money. NULL for non-financial penalties (REP_BURN).';
COMMENT ON COLUMN fury_penalties.ledger_debit_account_id IS
  'The account the money was taken FROM — the account a reversal credits back.';
COMMENT ON COLUMN fury_penalties.reversal_transaction_id IS
  'Set when an appeal is REVERSED and the compensating entry is posted. Its presence is what makes the reversal idempotent.';
