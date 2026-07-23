-- Migration 041: User access tiers for beta contract-creation caps

DO $$
BEGIN
  CREATE TYPE access_tier AS ENUM ('free', 'early_access', 'pro');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS access_tier access_tier NOT NULL DEFAULT 'early_access';

CREATE INDEX IF NOT EXISTS idx_users_access_tier ON users(access_tier);

COMMENT ON COLUMN users.access_tier IS
  'Product access tier: free cannot create contracts, early_access is capped, pro has full contract creation access.';
