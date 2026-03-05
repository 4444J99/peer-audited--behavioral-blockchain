-- Migration 019: Anomaly Detection Flags and Device Metadata

ALTER TABLE proofs ADD COLUMN IF NOT EXISTS anomaly_flags JSONB DEFAULT '[]'::jsonb;
ALTER TABLE proofs ADD COLUMN IF NOT EXISTS device_metadata JSONB;

CREATE INDEX IF NOT EXISTS idx_proofs_anomaly_flags ON proofs USING GIN (anomaly_flags);
