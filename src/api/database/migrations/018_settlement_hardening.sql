-- Migration 018: Settlement Hardening and Entry Indices

ALTER TABLE settlement_runs ADD COLUMN IF NOT EXISTS disposition_mode TEXT;
ALTER TABLE settlement_runs ADD COLUMN IF NOT EXISTS quote_json JSONB;

-- Index entries metadata for settlement auditability
CREATE INDEX IF NOT EXISTS idx_entries_settlement_run_id ON entries ((metadata->>'settlement_run_id'));
CREATE INDEX IF NOT EXISTS idx_entries_provider ON entries ((metadata->>'provider'));
