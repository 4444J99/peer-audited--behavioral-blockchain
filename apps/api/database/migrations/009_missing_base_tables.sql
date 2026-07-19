-- Migration 009: Add tables present in schema.sql but missing from migrations
-- Tables: accountability_partners, attestations, stripe_events

CREATE TABLE IF NOT EXISTS accountability_partners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id UUID REFERENCES contracts(id) ON DELETE CASCADE,
    partner_user_id UUID REFERENCES users(id),
    partner_email TEXT,
    status TEXT DEFAULT 'PENDING',  -- PENDING, ACTIVE, VETOED
    invited_at TIMESTAMPTZ DEFAULT NOW(),
    accepted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS attestations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id UUID REFERENCES contracts(id),
    user_id UUID REFERENCES users(id),
    attestation_date DATE NOT NULL,
    attested_at TIMESTAMPTZ,
    cosigned_by UUID REFERENCES users(id),
    cosigned_at TIMESTAMPTZ,
    status TEXT DEFAULT 'PENDING',  -- PENDING, ATTESTED, COSIGNED, MISSED
    UNIQUE(contract_id, attestation_date)
);

CREATE TABLE IF NOT EXISTS stripe_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id TEXT UNIQUE NOT NULL,
    event_type TEXT NOT NULL,
    processed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_accountability_partners_contract_id ON accountability_partners(contract_id);
CREATE INDEX IF NOT EXISTS idx_attestations_contract_id ON attestations(contract_id);
CREATE INDEX IF NOT EXISTS idx_attestations_status ON attestations(status);
CREATE INDEX IF NOT EXISTS idx_stripe_events_event_id ON stripe_events(event_id);
