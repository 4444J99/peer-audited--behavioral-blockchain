-- Migration 041: Metered usage events (REV-styx-metered-billing)
-- Durable per-user record of billable consumption that drives B2B metered billing.

CREATE TABLE IF NOT EXISTS usage_event (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  enterprise_id UUID REFERENCES enterprises(id),
  event_type TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  idempotency_key TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_usage_event_user
  ON usage_event(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_usage_event_enterprise_type
  ON usage_event(enterprise_id, event_type, created_at)
  WHERE enterprise_id IS NOT NULL;

COMMENT ON TABLE usage_event IS
  'Per-user billable consumption events feeding B2B metered/Stripe billing; retains originating user even when unattributed to an enterprise.';
