-- Reconcile the migration chain with columns/tables that existed only in the
-- consolidated schema.sql (which fresh installs no longer execute). Verified by
-- diffing information_schema between a schema.sql-built DB and a chain-built DB.

ALTER TABLE contracts ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

ALTER TABLE proofs ADD COLUMN IF NOT EXISTS proof_type TEXT DEFAULT 'MEDIA';  -- MEDIA, ATTESTATION

CREATE TABLE IF NOT EXISTS consumption_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    enterprise_id UUID NOT NULL,
    event_type TEXT NOT NULL,
    units INTEGER NOT NULL DEFAULT 1,
    recorded_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_consumption_logs_enterprise_period
  ON consumption_logs(enterprise_id, recorded_at);
CREATE INDEX IF NOT EXISTS idx_consumption_logs_event_type
  ON consumption_logs(enterprise_id, event_type, recorded_at);

ALTER TABLE settlement_runs ADD COLUMN IF NOT EXISTS outcome TEXT;
ALTER TABLE settlement_runs ADD COLUMN IF NOT EXISTS amount_cents INTEGER;
ALTER TABLE settlement_runs ADD COLUMN IF NOT EXISTS provider_tx_id TEXT;
ALTER TABLE settlement_runs ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE settlement_runs ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;
