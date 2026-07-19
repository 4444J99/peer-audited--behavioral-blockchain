-- Migration 029: Per-Month Grace-Day Reset Marker
-- MAX_GRACE_DAYS_PER_MONTH is a per-CALENDAR-MONTH cap. We record the month
-- (UTC 'YYYY-MM') that the current grace_days_used count belongs to, so a
-- long-running multi-month contract regains its full allowance each month
-- instead of being permanently capped after the first month.

ALTER TABLE contracts
  ADD COLUMN IF NOT EXISTS grace_period_month TEXT; -- e.g. '2026-05'
