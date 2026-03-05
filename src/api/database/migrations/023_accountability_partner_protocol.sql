-- Migration 023: Accountability Partner Protocol (TKT-P1-017)

CREATE TABLE IF NOT EXISTS accountability_partner_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id UUID REFERENCES contracts(id),
    actor_id UUID REFERENCES users(id),
    event_type TEXT NOT NULL, -- INVITE_SENT, INVITE_ACCEPTED, INVITE_DECLINED, VETO_TRIGGERED
    payload JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE accountability_partners 
ALTER COLUMN status TYPE TEXT,
ALTER COLUMN status SET DEFAULT 'PENDING';

-- Ensure status is one of: PENDING, ACTIVE, DECLINED, REVOKED

