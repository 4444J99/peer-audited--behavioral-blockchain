-- Migration 042: Store Stripe subscription linkage for early-access billing

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS subscription_id TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_subscription_id
  ON users(subscription_id)
  WHERE subscription_id IS NOT NULL;

COMMENT ON COLUMN users.subscription_id IS
  'Stripe subscription ID for early-access subscription billing.';
