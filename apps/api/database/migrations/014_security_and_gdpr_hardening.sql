-- Migration 014: Security + GDPR hardening parity
-- Aligns runtime migrations with schema-level controls that were added incrementally.

-- 1) Ledger precision: enforce integer amounts for entries.
ALTER TABLE entries
  ALTER COLUMN amount TYPE BIGINT
  USING ROUND(amount);

-- 2) Event log immutability: append-only audit trail.
CREATE OR REPLACE FUNCTION prevent_event_log_mutation()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'event_log is immutable: UPDATE and DELETE are prohibited';
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'trg_event_log_immutable'
      AND tgrelid = 'event_log'::regclass
  ) THEN
    CREATE TRIGGER trg_event_log_immutable
      BEFORE UPDATE OR DELETE ON event_log
      FOR EACH ROW EXECUTE FUNCTION prevent_event_log_mutation();
  END IF;
END;
$$;

-- 3) Auth hardening: refresh-token storage + lockout fields.
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token_hash ON refresh_tokens(token_hash);

ALTER TABLE users ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS locked_until TIMESTAMPTZ;

-- 4) GDPR deletion lifecycle: track request timestamp for 30-day cooling window.
ALTER TABLE users ADD COLUMN IF NOT EXISTS deletion_requested_at TIMESTAMPTZ;

-- Backfill rows already marked pending deletion.
UPDATE users
SET deletion_requested_at = COALESCE(deletion_requested_at, NOW())
WHERE status = 'PENDING_DELETION';

-- 5) Ledger read performance indexes.
CREATE INDEX IF NOT EXISTS idx_entries_debit_account_id ON entries(debit_account_id);
CREATE INDEX IF NOT EXISTS idx_entries_credit_account_id ON entries(credit_account_id);
CREATE INDEX IF NOT EXISTS idx_entries_contract_id ON entries(contract_id);
CREATE INDEX IF NOT EXISTS idx_users_deletion_requested_at ON users(deletion_requested_at);
