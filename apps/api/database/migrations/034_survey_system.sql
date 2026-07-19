-- Migration 034: Baseline & Final Survey System
-- Tracks pre-contract baseline and post-contract final surveys for behavioral metrics.

CREATE TABLE IF NOT EXISTS survey_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  contract_id UUID REFERENCES contracts(id),
  survey_type TEXT NOT NULL CHECK (survey_type IN ('BASELINE', 'FINAL')),
  responses JSONB NOT NULL DEFAULT '{}',
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT one_survey_per_contract_per_type UNIQUE (contract_id, survey_type)
);

CREATE INDEX IF NOT EXISTS idx_survey_responses_user_id ON survey_responses(user_id);
CREATE INDEX IF NOT EXISTS idx_survey_responses_contract_id ON survey_responses(contract_id);
