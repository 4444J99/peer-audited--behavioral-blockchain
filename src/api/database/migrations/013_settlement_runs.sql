-- Migration 013: Settlement Runs for Omega propulsion
-- Tracks real-money movements and ensures idempotency for payouts.

CREATE TABLE IF NOT EXISTS settlement_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id UUID REFERENCES contracts(id),
    outcome TEXT NOT NULL,
    amount_cents INTEGER NOT NULL,
    status TEXT NOT NULL, -- PROCESSING, SUCCESS, FAILED
    provider_tx_id TEXT,
    last_error TEXT,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_settlement_runs_contract_id ON settlement_runs(contract_id);
CREATE INDEX IF NOT EXISTS idx_settlement_runs_status ON settlement_runs(status);
