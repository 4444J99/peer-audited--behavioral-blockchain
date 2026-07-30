-- AML screening infrastructure backing AmlScreeningService:
-- internal_watchlist (per-user watchlist matches), internal_blocklist
-- (hard-blocked users), aml_screenings (screening run history).

CREATE TABLE IF NOT EXISTS internal_watchlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  list_type TEXT NOT NULL,
  matched_name TEXT NOT NULL,
  -- DOUBLE PRECISION (not NUMERIC): node-postgres returns NUMERIC as a string,
  -- and the service compares confidence numerically against 0.9.
  confidence DOUBLE PRECISION NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  source TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_internal_watchlist_user ON internal_watchlist(user_id);
CREATE INDEX IF NOT EXISTS idx_internal_watchlist_list_type ON internal_watchlist(list_type);

CREATE TABLE IF NOT EXISTS internal_blocklist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
-- user_id lookups are served by the UNIQUE constraint's index.

CREATE TABLE IF NOT EXISTS aml_screenings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  risk_level TEXT NOT NULL CHECK (risk_level IN ('CLEAR', 'FLAGGED', 'BLOCKED')),
  matches JSONB NOT NULL DEFAULT '[]'::jsonb,
  screened_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_aml_screenings_user_screened ON aml_screenings(user_id, screened_at DESC);
CREATE INDEX IF NOT EXISTS idx_aml_screenings_risk ON aml_screenings(risk_level);
