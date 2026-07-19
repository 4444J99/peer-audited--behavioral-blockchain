-- Migration 040: Commitment device subscriptions + pregnancy self-report audit
-- H1 (Triadic Review): subscribeToDevice was a no-op stub. Persist real rows.
-- H3 (Triadic Review): pregnancy_exclusion column existed but no audit trail.

CREATE TABLE IF NOT EXISTS commitment_device_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  device_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  cancelled_at TIMESTAMPTZ,
  UNIQUE(user_id, device_id)
);

CREATE INDEX IF NOT EXISTS idx_commitment_subscriptions_user
  ON commitment_device_subscriptions(user_id);

CREATE INDEX IF NOT EXISTS idx_commitment_subscriptions_device
  ON commitment_device_subscriptions(device_id)
  WHERE status = 'ACTIVE';

COMMENT ON TABLE commitment_device_subscriptions IS
  'Active subscriptions from users to commitment devices (loss-aversion amplification). H1 fix: previously in-memory only.';

-- Pregnancy self-report audit (H3 fix): track activation/deactivation events.
-- The users.pregnancy_exclusion column already exists (migration 039), but
-- there is no history of when the user toggled it. This is needed for:
--  - Audit trail for compliance (regulators can ask when exclusion started)
--  - Reverting a misclick (e.g. user accidentally enabled it) requires
--    knowing how long the exclusion has been active
--  - Mid-challenge penalty-free suspension handoff
CREATE TABLE IF NOT EXISTS pregnancy_exclusion_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  event_type TEXT NOT NULL CHECK (event_type IN ('ACTIVATED', 'DEACTIVATED')),
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  source TEXT NOT NULL DEFAULT 'SELF_REPORT'
);

CREATE INDEX IF NOT EXISTS idx_pregnancy_exclusion_events_user
  ON pregnancy_exclusion_events(user_id, occurred_at DESC);

COMMENT ON TABLE pregnancy_exclusion_events IS
  'Audit log of pregnancy_exclusion toggles on the users row. H3 fix: provides compliance audit trail and reversion basis.';
