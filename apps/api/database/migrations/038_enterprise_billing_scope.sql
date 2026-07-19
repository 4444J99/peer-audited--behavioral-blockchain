-- Migration 038: Enterprise Billing Scope Management
-- Per-organization scope budget, seat tracking, and usage caps.

CREATE TABLE IF NOT EXISTS enterprise_scopes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enterprise_id UUID NOT NULL REFERENCES enterprises(id),
  scope_key TEXT NOT NULL,
  limit_value INTEGER NOT NULL DEFAULT 0,
  current_usage INTEGER NOT NULL DEFAULT 0,
  reset_period TEXT NOT NULL DEFAULT 'monthly',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT one_scope_per_enterprise UNIQUE (enterprise_id, scope_key)
);

CREATE INDEX IF NOT EXISTS idx_enterprise_scopes_enterprise ON enterprise_scopes(enterprise_id);

CREATE TABLE IF NOT EXISTS enterprise_seats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enterprise_id UUID NOT NULL REFERENCES enterprises(id),
  user_id UUID REFERENCES users(id),
  seat_type TEXT NOT NULL DEFAULT 'MEMBER',
  active BOOLEAN NOT NULL DEFAULT TRUE,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT one_seat_per_user_per_enterprise UNIQUE (enterprise_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_enterprise_seats_enterprise ON enterprise_seats(enterprise_id);
