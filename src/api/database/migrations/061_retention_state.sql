-- 061: Circle-4 retention state.
-- 1) users.timezone — danger windows are circadian and must be evaluated on
--    the user's local clock (LATE_NIGHT at 2am America/New_York is 06-07 UTC).
-- 2) users.alias / users.oath_categories — read by the accountability-partner
--    matching queries (previously referenced but never created).
-- 3) retention_notifications — dedupe log so a danger window or check-in
--    prompt fires at most once per user/contract/local-day.

ALTER TABLE users ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'America/New_York';
ALTER TABLE users ADD COLUMN IF NOT EXISTS alias TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS oath_categories TEXT[] DEFAULT '{}';

CREATE TABLE IF NOT EXISTS retention_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL,
  -- Danger sweeps store the window type here; check-in prompts store the
  -- check-in id. NOT NULL keeps the unique constraint airtight (NULLs would
  -- never conflict).
  dedupe_key TEXT NOT NULL DEFAULT '',
  -- The user's local calendar date at send time — dedupe rolls over on the
  -- user's midnight, not UTC's.
  local_date DATE NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_retention_notifications_daily
    UNIQUE (user_id, contract_id, notification_type, dedupe_key, local_date)
);

CREATE INDEX IF NOT EXISTS idx_retention_notifications_user_date
  ON retention_notifications(user_id, local_date);
CREATE INDEX IF NOT EXISTS idx_partner_checkins_pending_due
  ON partner_checkins(scheduled_at) WHERE status = 'PENDING';
