-- Align pod_broadcast_log (050) with the pod orchestration service:
-- cohort scoping, failure attribution, and metadata-driven (string) pod ids.
ALTER TABLE pod_broadcast_log ALTER COLUMN pod_id TYPE TEXT;
ALTER TABLE pod_broadcast_log ADD COLUMN IF NOT EXISTS cohort_id TEXT;
ALTER TABLE pod_broadcast_log ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE pod_broadcast_log ADD COLUMN IF NOT EXISTS failure_type TEXT;
CREATE INDEX IF NOT EXISTS idx_pbl_pod_cohort ON pod_broadcast_log(pod_id, cohort_id);
