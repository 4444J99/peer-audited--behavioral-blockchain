-- ARC-07: Double-Entry Ledger Schema
-- Enforce absolute financial integrity for user stakes and bounties.

CREATE TYPE account_type AS ENUM ('ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE');

CREATE TABLE accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    type account_type NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    debit_account_id UUID REFERENCES accounts(id) ON DELETE RESTRICT,
    credit_account_id UUID REFERENCES accounts(id) ON DELETE RESTRICT,
    amount DECIMAL(19, 4) NOT NULL CHECK (amount > 0),
    contract_id UUID, -- Links to the behavioral contract
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE event_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type TEXT NOT NULL,
    payload JSONB NOT NULL,
    previous_hash TEXT NOT NULL,
    current_hash TEXT NOT NULL, -- hash(previous_hash || payload || created_at)
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for rapid sequential verification of the chain.
CREATE INDEX idx_event_log_created_at ON event_log(created_at);
