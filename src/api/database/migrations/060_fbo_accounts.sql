CREATE TABLE IF NOT EXISTS fbo_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform_account_id TEXT NOT NULL UNIQUE,
  platform_name TEXT NOT NULL DEFAULT 'STRIPE',
  jurisdiction TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  deactivated_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_fbo_accounts_jurisdiction ON fbo_accounts(jurisdiction);
CREATE INDEX IF NOT EXISTS idx_fbo_accounts_active ON fbo_accounts(is_active) WHERE is_active = TRUE;
