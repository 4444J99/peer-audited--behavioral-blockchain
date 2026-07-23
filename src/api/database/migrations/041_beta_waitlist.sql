-- Migration 041: Public Beta Waitlist Funnel
-- Captures pre-registration signups from the public landing page and the
-- no-contact emergency asset. Distinct from `waitlist_entries` (036), which is
-- the authenticated in-app cohort fill queue keyed by user_id. This table holds
-- not-yet-registered prospects keyed by email, with the source attribution and
-- qualification fields needed for confirmation and cohort admission decisions.

CREATE TABLE IF NOT EXISTS beta_waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  -- Lowercased/trimmed email used for dedupe; the display email keeps original casing.
  email_normalized TEXT NOT NULL UNIQUE,
  name TEXT,
  -- Free-text qualification: what the prospect wants help with (e.g. "no-contact").
  goal TEXT,
  -- Phase 1 wedge is iOS; kept flexible for later platforms.
  platform TEXT NOT NULL DEFAULT 'ios',
  -- Raw source token preserved verbatim from the CTA/campaign.
  source TEXT NOT NULL DEFAULT 'direct',
  -- Normalized marketing channel: organic | creator | practitioner | referral | direct.
  channel TEXT NOT NULL DEFAULT 'direct',
  intent TEXT,
  utm_source TEXT,
  utm_campaign TEXT,
  utm_medium TEXT,
  referrer TEXT,
  referral_code TEXT,
  -- pending (awaiting confirmation) | confirmed | admitted (promoted to a cohort).
  status TEXT NOT NULL DEFAULT 'pending',
  confirmation_token TEXT NOT NULL,
  confirmed_at TIMESTAMPTZ,
  admitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT beta_waitlist_status_check
    CHECK (status IN ('pending', 'confirmed', 'admitted')),
  CONSTRAINT beta_waitlist_channel_check
    CHECK (channel IN ('organic', 'creator', 'practitioner', 'referral', 'direct'))
);

CREATE INDEX IF NOT EXISTS idx_beta_waitlist_channel ON beta_waitlist(channel);
CREATE INDEX IF NOT EXISTS idx_beta_waitlist_status ON beta_waitlist(status);
CREATE INDEX IF NOT EXISTS idx_beta_waitlist_created ON beta_waitlist(created_at);
