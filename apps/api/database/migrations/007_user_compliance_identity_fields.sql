-- 007_user_compliance_identity_fields:
-- Persist KYC / age-verification / identity-provider status so policy decisions
-- can be made against actual user state instead of documentation claims.

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS kyc_status TEXT NOT NULL DEFAULT 'NOT_STARTED';

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS age_verification_status TEXT NOT NULL DEFAULT 'NOT_STARTED';

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS identity_provider TEXT;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS identity_verification_id TEXT;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS identity_verified_at TIMESTAMPTZ;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS compliance_metadata JSONB NOT NULL DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_users_kyc_status ON users (kyc_status);
CREATE INDEX IF NOT EXISTS idx_users_age_verification_status ON users (age_verification_status);
