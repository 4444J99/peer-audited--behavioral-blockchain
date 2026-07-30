-- Align pod_broadcast_log (050) with the pod orchestration service:
-- cohort scoping, failure attribution, and metadata-driven (string) pod ids.
--
-- Created defensively first: a database provisioned from the old consolidated
-- schema.sql may have migration 050 baselined as applied even though that
-- snapshot never created this table, in which case a bare ALTER would fail and
-- block the remainder of the chain.
CREATE TABLE IF NOT EXISTS pod_broadcast_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pod_id TEXT NOT NULL,
  failure_count INTEGER NOT NULL DEFAULT 0,
  dampened BOOLEAN NOT NULL DEFAULT FALSE,
  broadcasted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE pod_broadcast_log ALTER COLUMN pod_id TYPE TEXT;
ALTER TABLE pod_broadcast_log ADD COLUMN IF NOT EXISTS cohort_id TEXT;
ALTER TABLE pod_broadcast_log ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE pod_broadcast_log ADD COLUMN IF NOT EXISTS failure_type TEXT;
CREATE INDEX IF NOT EXISTS idx_pbl_pod ON pod_broadcast_log(pod_id);
CREATE INDEX IF NOT EXISTS idx_pbl_pod_cohort ON pod_broadcast_log(pod_id, cohort_id);
