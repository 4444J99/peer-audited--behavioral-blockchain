-- 062_fitbit_oauth_tokens.sql
-- Per-user Fitbit OAuth2 grants for verified webhook ingestion (Gate 02).
-- Subscription notifications carry only user/collection/date refs; readiness
-- data is fetched server-side with these tokens, so no client-supplied
-- biometric value is ever trusted.

CREATE TABLE IF NOT EXISTS fitbit_oauth_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  -- Fitbit's stable user identifier (webhook notifications reference this).
  -- UNIQUE: one wearable identity may back only one account (anti-Sybil).
  fitbit_user_id TEXT NOT NULL UNIQUE,
  access_token TEXT,
  access_token_expires_at TIMESTAMPTZ,
  refresh_token TEXT NOT NULL,
  scope TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
