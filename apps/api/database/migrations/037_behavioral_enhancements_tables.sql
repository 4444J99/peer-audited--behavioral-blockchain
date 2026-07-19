-- Migration 037: Behavioral Enhancements — support tables
-- Crab Bucket signals and Behavior Swap proposals.

CREATE TABLE IF NOT EXISTS crab_bucket_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  pattern TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'LOW',
  reported_by UUID REFERENCES users(id),
  contract_id UUID REFERENCES contracts(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_crab_bucket_signals_user ON crab_bucket_signals(user_id);

CREATE TABLE IF NOT EXISTS behavior_swaps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_contract_id UUID NOT NULL REFERENCES contracts(id),
  target_oath_category TEXT NOT NULL,
  carry_over_stake_pct DECIMAL(5,2) NOT NULL DEFAULT 50.00,
  status TEXT NOT NULL DEFAULT 'PROPOSED',
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_behavior_swaps_source ON behavior_swaps(source_contract_id);
