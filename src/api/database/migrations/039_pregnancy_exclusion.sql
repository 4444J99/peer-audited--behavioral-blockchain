-- Migration 034: Pregnancy exclusion gate + recovery guardrails
-- Issue #61: Pregnancy exclusion gate & mid-challenge penalty-free suspension
-- Issue #306: Recovery protocol guardrails

ALTER TABLE users ADD COLUMN IF NOT EXISTS pregnancy_exclusion BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS pregnancy_exclusion_at TIMESTAMPTZ;

COMMENT ON COLUMN users.pregnancy_exclusion IS 'User has self-reported pregnancy; penalty-bearing contracts are blocked';
COMMENT ON COLUMN users.pregnancy_exclusion_at IS 'Timestamp when pregnancy exclusion was activated';
