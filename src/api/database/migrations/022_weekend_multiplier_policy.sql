-- Migration 022: Weekend Multiplier Policy (TKT-P1-012)

CREATE TABLE IF NOT EXISTS contract_penalty_windows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id UUID REFERENCES contracts(id),
    starts_at TIMESTAMPTZ NOT NULL,
    ends_at TIMESTAMPTZ NOT NULL,
    multiplier FLOAT NOT NULL DEFAULT 2.0,
    source_policy TEXT NOT NULL -- WEEKEND_RELAPSE_PREVENTION
);
CREATE INDEX IF NOT EXISTS idx_contract_penalty_windows_contract ON contract_penalty_windows(contract_id);

