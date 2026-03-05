-- TKT-P1-020: Resilience Badge Storage
-- Store gamified psychological reframing tokens.

ALTER TABLE users
ADD COLUMN IF NOT EXISTS badges JSONB NOT NULL DEFAULT '[]'::jsonb;

CREATE INDEX IF NOT EXISTS idx_users_badges ON users USING GIN (badges);
