-- 046: Ostrich effect detection (F-AEGIS-09)
-- Tracks user activity to detect avoidance patterns and trigger interventions.

ALTER TABLE users ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS consecutive_missed_proofs INTEGER DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_users_last_active_at ON users(last_active_at);
