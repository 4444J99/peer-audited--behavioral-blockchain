-- Migration 049: Omega behavioral features — disenchantment tracking, implementation intentions

CREATE TABLE IF NOT EXISTS disenchantment_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  contract_id UUID NOT NULL REFERENCES contracts(id),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 10),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_disenchantment_contract ON disenchantment_ratings(contract_id);
CREATE INDEX IF NOT EXISTS idx_disenchantment_user ON disenchantment_ratings(user_id);

ALTER TABLE contracts ADD COLUMN IF NOT EXISTS implementation_intention JSONB;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS life_transition_type TEXT;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS life_transition_date TIMESTAMPTZ;
