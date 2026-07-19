-- Migration 027: Account Quarantine Status
-- The QuarantineService previously appended ' [QUARANTINED]' to accounts.name,
-- but name is the canonical lookup key (e.g. WHERE name = 'SYSTEM_ESCROW') and
-- carries a UNIQUE constraint, so mutating it corrupted lookups. Add a dedicated
-- status column so accounts can be flagged without touching their name.

ALTER TABLE accounts
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'ACTIVE'; -- ACTIVE, QUARANTINED

-- Partial index to quickly surface quarantined accounts during incident response.
CREATE INDEX IF NOT EXISTS idx_accounts_status
  ON accounts(status)
  WHERE status <> 'ACTIVE';
