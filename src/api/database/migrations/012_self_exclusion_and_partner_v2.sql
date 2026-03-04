-- Migration 012: Add self-exclusion and harden accountability partners
-- ARC-12: Self-Exclusion Protocol

ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS self_exclusion_expires_at TIMESTAMPTZ;

-- Ensure partner status is tracked with a state machine
-- PENDING -> ACTIVE, DECLINED, REVOKED
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'partner_status') THEN
        CREATE TYPE partner_status AS ENUM ('PENDING', 'ACTIVE', 'DECLINED', 'REVOKED');
    END IF;
END $$;

-- Note: We already have 'status' column as TEXT, we'll keep it as TEXT for now to avoid migration pain but document the expected values.
-- Migration 009 created it as TEXT DEFAULT 'PENDING'.
