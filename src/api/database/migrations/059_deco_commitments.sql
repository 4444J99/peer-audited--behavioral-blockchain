CREATE TABLE IF NOT EXISTS deco_commitments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  url TEXT NOT NULL,
  selector TEXT NOT NULL,
  expected_value TEXT NOT NULL,
  commitment_hash TEXT NOT NULL UNIQUE,
  verified BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_deco_commitments_hash ON deco_commitments(commitment_hash);
CREATE INDEX IF NOT EXISTS idx_deco_commitments_user ON deco_commitments(user_id);
