-- Migration 002: Whistleblower Bounty System
-- Adds support for tracking unique bounty links and submissions for No Contact contracts.

ALTER TABLE contracts ADD COLUMN bounty_link_id TEXT UNIQUE;

CREATE TABLE bounties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id UUID REFERENCES contracts(id) ON DELETE CASCADE,
    bounty_link_id TEXT UNIQUE NOT NULL,
    status TEXT DEFAULT 'ACTIVE', -- ACTIVE, CLAIMED, EXPIRED, VETOED
    claimed_at TIMESTAMPTZ,
    claimant_ip TEXT,             -- For basic abuse prevention
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Note: When a bounty is 'CLAIMED', a corresponding record will be created in the `proofs` table
-- with the media_uri of the evidence submitted via the bounty link.
