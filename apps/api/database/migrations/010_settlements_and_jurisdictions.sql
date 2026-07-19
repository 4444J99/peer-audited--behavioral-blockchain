-- TKT-P0-001: Real-Money FBO Settlement Activation
-- TKT-P0-004: Geofence Fail-Closed Hardening + Policy Registry

-- 1. Settlement Runs tracking
DO $$ BEGIN
    CREATE TYPE settlement_status AS ENUM ('PENDING', 'EXECUTING', 'COMPLETED', 'FAILED', 'RECONCILED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS settlement_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE RESTRICT,
    provider TEXT NOT NULL, -- e.g., 'STRIPE', 'STUB'
    quote_json JSONB NOT NULL,
    status settlement_status DEFAULT 'PENDING',
    idempotency_key TEXT UNIQUE NOT NULL,
    disposition_mode TEXT, -- HOUSE_RETAINED, REFUND_ONLY (TKT-P0-011)
    legal_basis_ref TEXT,
    executed_at TIMESTAMPTZ,
    last_error TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for settlement correlation in ledger
CREATE INDEX IF NOT EXISTS idx_entries_settlement_run_id ON entries ((metadata->>'settlement_run_id')) WHERE (metadata ? 'settlement_run_id');
CREATE INDEX IF NOT EXISTS idx_entries_settlement_provider ON entries ((metadata->>'provider')) WHERE (metadata ? 'provider');

-- Trigger for settlement_runs updated_at
CREATE OR REPLACE TRIGGER settlement_runs_updated_at
    BEFORE UPDATE ON settlement_runs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 2. Jurisdiction Registry
CREATE TABLE IF NOT EXISTS jurisdictions (
    code TEXT PRIMARY KEY, -- e.g. 'NY', 'CA'
    name TEXT NOT NULL,
    tier TEXT NOT NULL, -- 'FULL_ACCESS', 'REFUND_ONLY', 'HARD_BLOCK'
    disposition_mode TEXT DEFAULT 'HOUSE_RETAINED', -- TKT-P0-011
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed with current classification
INSERT INTO jurisdictions (code, name, tier) VALUES
('WA', 'Washington', 'HARD_BLOCK'),
('AR', 'Arkansas', 'HARD_BLOCK'),
('HI', 'Hawaii', 'HARD_BLOCK'),
('UT', 'Utah', 'HARD_BLOCK'),
('ID', 'Idaho', 'HARD_BLOCK'),
('SC', 'South Carolina', 'HARD_BLOCK'),
('NY', 'New York', 'REFUND_ONLY'),
('CT', 'Connecticut', 'REFUND_ONLY'),
('MT', 'Montana', 'REFUND_ONLY'),
('AZ', 'Arizona', 'REFUND_ONLY'),
('IA', 'Iowa', 'REFUND_ONLY'),
('LA', 'Louisiana', 'REFUND_ONLY'),
('ME', 'Maine', 'REFUND_ONLY'),
('TN', 'Tennessee', 'REFUND_ONLY'),
('VA', 'Virginia', 'REFUND_ONLY'),
('IN', 'Indiana', 'REFUND_ONLY'),
('PA', 'Pennsylvania', 'REFUND_ONLY'),
('CA', 'California', 'FULL_ACCESS'),
('TX', 'Texas', 'FULL_ACCESS'),
('FL', 'Florida', 'FULL_ACCESS'),
('IL', 'Illinois', 'FULL_ACCESS'),
('OH', 'Ohio', 'FULL_ACCESS'),
('GA', 'Georgia', 'FULL_ACCESS'),
('NC', 'North Carolina', 'FULL_ACCESS'),
('MI', 'Michigan', 'FULL_ACCESS'),
('NJ', 'New Jersey', 'FULL_ACCESS'),
('MA', 'Massachusetts', 'FULL_ACCESS'),
('WI', 'Wisconsin', 'FULL_ACCESS'),
('MN', 'Minnesota', 'FULL_ACCESS'),
('CO', 'Colorado', 'FULL_ACCESS'),
('AL', 'Alabama', 'FULL_ACCESS'),
('MD', 'Maryland', 'FULL_ACCESS'),
('MO', 'Missouri', 'FULL_ACCESS'),
('OK', 'Oklahoma', 'FULL_ACCESS'),
('OR', 'Oregon', 'FULL_ACCESS'),
('KY', 'Kentucky', 'FULL_ACCESS'),
('NV', 'Nevada', 'FULL_ACCESS'),
('KS', 'Kansas', 'FULL_ACCESS'),
('NE', 'Nebraska', 'FULL_ACCESS'),
('MS', 'Mississippi', 'FULL_ACCESS'),
('NM', 'New Mexico', 'FULL_ACCESS'),
('WV', 'West Virginia', 'FULL_ACCESS'),
('NH', 'New Hampshire', 'FULL_ACCESS'),
('ND', 'North Dakota', 'FULL_ACCESS'),
('SD', 'South Dakota', 'FULL_ACCESS'),
('DE', 'Delaware', 'FULL_ACCESS'),
('RI', 'Rhode Island', 'FULL_ACCESS'),
('VT', 'Vermont', 'FULL_ACCESS'),
('WY', 'Wyoming', 'FULL_ACCESS'),
('AK', 'Alaska', 'FULL_ACCESS'),
('DC', 'District of Columbia', 'FULL_ACCESS')
ON CONFLICT (code) DO UPDATE SET tier = EXCLUDED.tier;

-- 3. Compliance Decisions Audit
CREATE TABLE IF NOT EXISTS compliance_decisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    action TEXT NOT NULL,
    jurisdiction_code TEXT,
    tier TEXT,
    allowed BOOLEAN NOT NULL,
    reason_code TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_compliance_decisions_user_id ON compliance_decisions(user_id);
CREATE INDEX IF NOT EXISTS idx_compliance_decisions_created_at ON compliance_decisions(created_at);
