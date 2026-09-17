-- Migration 048: Behavioral Enrichment — exit interviews, friction audits, gateway oaths, re-entry tracking

CREATE TABLE IF NOT EXISTS exit_interviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES contracts(id),
  user_id UUID NOT NULL REFERENCES users(id),
  answers JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(contract_id)
);

CREATE INDEX IF NOT EXISTS idx_exit_interviews_user ON exit_interviews(user_id);

CREATE TABLE IF NOT EXISTS friction_audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  answers JSONB NOT NULL DEFAULT '{}',
  score DECIMAL(5,2) NOT NULL,
  risk_level TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_friction_audits_user ON friction_audits(user_id);

CREATE TABLE IF NOT EXISTS gateway_oaths (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  stake_cents INTEGER NOT NULL,
  duration_days INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gateway_oaths_user ON gateway_oaths(user_id);

CREATE TABLE IF NOT EXISTS reentry_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  attempt_number INTEGER NOT NULL DEFAULT 1,
  stake_discount_pct DECIMAL(5,2) NOT NULL DEFAULT 50.00,
  phoenix_bonus_cents INTEGER NOT NULL DEFAULT 200,
  status TEXT NOT NULL DEFAULT 'PENDING',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_reentry_attempts_user ON reentry_attempts(user_id);
