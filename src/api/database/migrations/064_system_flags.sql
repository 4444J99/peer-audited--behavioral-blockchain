-- Durable system-wide operational flags (e.g. the compliance REFUND_ONLY kill
-- switch). These were previously process-local statics: silently reset by every
-- deploy and never shared across replicas.
CREATE TABLE IF NOT EXISTS system_flags (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID
);

-- Backfill: crisis alerting tables used by CrisisNotificationService but never
-- covered by any prior migration. The fail-loud crisis alerting path writes an
-- operational alert row into crisis_notifications, so the table must exist in
-- every environment. IF NOT EXISTS keeps this a no-op on databases where the
-- tables were created out-of-band.
CREATE TABLE IF NOT EXISTS crisis_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  severity VARCHAR(20) NOT NULL CHECK (severity IN ('MEDIUM', 'HIGH', 'CRITICAL')),
  category VARCHAR(50) NOT NULL,
  -- Written/read as a JSON string by the service (JSON.stringify / JSON.parse),
  -- so this stays TEXT, not JSONB.
  matched_keywords TEXT NOT NULL DEFAULT '[]',
  source VARCHAR(30) NOT NULL,
  message TEXT NOT NULL,
  acknowledged BOOLEAN NOT NULL DEFAULT FALSE,
  acknowledged_by UUID,
  acknowledged_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_crisis_notifications_unacked
  ON crisis_notifications(acknowledged, created_at);

CREATE TABLE IF NOT EXISTS crisis_follow_ups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  crisis_event_id UUID NOT NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'COMPLETED', 'MISSED')),
  response TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_crisis_follow_ups_pending
  ON crisis_follow_ups(status, scheduled_at);
