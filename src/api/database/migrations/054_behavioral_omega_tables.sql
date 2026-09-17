-- Migration 050: Omega behavioral tables — passive proofs, pod broadcast, auditor wellness,
-- generosity, rollovers, academy, resistance, assessment, oracle, arbiter, stablecoin, revenue, whistleblower

CREATE TABLE IF NOT EXISTS passive_proof_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  provider TEXT NOT NULL,
  credentials JSONB NOT NULL DEFAULT '{}',
  active BOOLEAN NOT NULL DEFAULT TRUE,
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, provider)
);
CREATE INDEX IF NOT EXISTS idx_ppc_user ON passive_proof_connections(user_id);

CREATE TABLE IF NOT EXISTS pod_broadcast_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pod_id UUID NOT NULL,
  failure_count INTEGER NOT NULL DEFAULT 0,
  dampened BOOLEAN NOT NULL DEFAULT FALSE,
  broadcasted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_pbl_pod ON pod_broadcast_log(pod_id);

CREATE TABLE IF NOT EXISTS auditor_wellness_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auditor_id UUID NOT NULL REFERENCES users(id),
  fatigue_score INTEGER NOT NULL DEFAULT 0,
  bias_risk TEXT NOT NULL DEFAULT 'LOW',
  recommended_break BOOLEAN NOT NULL DEFAULT FALSE,
  consecutive_reviews INTEGER NOT NULL DEFAULT 0,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_awl_auditor ON auditor_wellness_log(auditor_id);

CREATE TABLE IF NOT EXISTS generosity_grants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  giver_id UUID NOT NULL REFERENCES users(id),
  receiver_id UUID NOT NULL REFERENCES users(id),
  amount_cents INTEGER NOT NULL,
  badge_awarded BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_gg_giver ON generosity_grants(giver_id);
CREATE INDEX IF NOT EXISTS idx_gg_receiver ON generosity_grants(receiver_id);

CREATE TABLE IF NOT EXISTS contract_rollovers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  previous_contract_id UUID NOT NULL REFERENCES contracts(id),
  new_contract_id UUID REFERENCES contracts(id),
  category TEXT NOT NULL,
  continuity_bonus_cents INTEGER NOT NULL DEFAULT 0,
  expires_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_cr_user ON contract_rollovers(user_id);

CREATE TABLE IF NOT EXISTS academy_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  module_id TEXT NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  reward_claimed BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, module_id)
);
CREATE INDEX IF NOT EXISTS idx_ap_user ON academy_progress(user_id);

CREATE TABLE IF NOT EXISTS resistance_pattern_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  source TEXT NOT NULL,
  text_snippet TEXT,
  patterns JSONB NOT NULL DEFAULT '[]',
  detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_rpl_user ON resistance_pattern_log(user_id);

CREATE TABLE IF NOT EXISTS assessment_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  answers JSONB NOT NULL DEFAULT '{}',
  profile JSONB NOT NULL DEFAULT '{}',
  archetype TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ar_user ON assessment_results(user_id);

CREATE TABLE IF NOT EXISTS deco_proofs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  url TEXT NOT NULL,
  selector TEXT NOT NULL,
  expected_value TEXT NOT NULL,
  verified BOOLEAN NOT NULL DEFAULT FALSE,
  revealed_fields JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_dp_user ON deco_proofs(user_id);

CREATE TABLE IF NOT EXISTS arbiter_verdicts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES contracts(id),
  verdict TEXT NOT NULL,
  stake_at_risk_cents INTEGER NOT NULL DEFAULT 0,
  arbiter_count INTEGER NOT NULL DEFAULT 0,
  resolved_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_av_contract ON arbiter_verdicts(contract_id);

CREATE TABLE IF NOT EXISTS stablecoin_quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  contract_id UUID REFERENCES contracts(id),
  usd_cents INTEGER NOT NULL,
  stablecoin_type TEXT NOT NULL,
  stablecoin_amount TEXT NOT NULL,
  exchange_rate DECIMAL(10,6) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_sq_user ON stablecoin_quotes(user_id);

CREATE TABLE IF NOT EXISTS revenue_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  period TEXT NOT NULL,
  total_pool_cents INTEGER NOT NULL,
  user_share_cents INTEGER NOT NULL,
  data_points INTEGER NOT NULL DEFAULT 0,
  paid BOOLEAN NOT NULL DEFAULT FALSE,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_rs_user ON revenue_shares(user_id);

CREATE TABLE IF NOT EXISTS whistleblower_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID REFERENCES users(id),
  target_user_id UUID REFERENCES users(id),
  category TEXT NOT NULL,
  description TEXT,
  evidence_hash TEXT,
  reward_cents INTEGER NOT NULL DEFAULT 0,
  anonymity_level TEXT NOT NULL DEFAULT 'FULL',
  status TEXT NOT NULL DEFAULT 'PENDING',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_wr_reporter ON whistleblower_reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_wr_target ON whistleblower_reports(target_user_id);
CREATE INDEX IF NOT EXISTS idx_wr_status ON whistleblower_reports(status);
