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
    -- Stored as integer cents to avoid floating-point drift.
    amount BIGINT NOT NULL CHECK (amount > 0),
    contract_id UUID,
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

-- Immutability: prevent UPDATE/DELETE on event_log (append-only audit trail)
CREATE OR REPLACE FUNCTION prevent_event_log_mutation()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'event_log is immutable: UPDATE and DELETE are prohibited';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_event_log_immutable
  BEFORE UPDATE OR DELETE ON event_log
  FOR EACH ROW EXECUTE FUNCTION prevent_event_log_mutation();

-- ============================================================
-- Domain Tables: Users, Contracts, Proofs, Fury Assignments
-- ============================================================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT,
    stripe_customer_id TEXT,
    integrity_score INTEGER DEFAULT 50,
    account_id UUID REFERENCES accounts(id),
    role TEXT DEFAULT 'USER',
    enterprise_id UUID,
    status TEXT DEFAULT 'ACTIVE', last_known_state TEXT, social_guild_id UUID,
    deletion_requested_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    oath_category TEXT NOT NULL,
    verification_method TEXT NOT NULL,
    stake_amount DECIMAL(19,4) NOT NULL CHECK (stake_amount > 0),
    payment_intent_id TEXT,
    duration_days INTEGER NOT NULL,
    status TEXT DEFAULT 'PENDING_STAKE',
    grace_days_used INTEGER DEFAULT 0,
    strikes INTEGER DEFAULT 0,
    started_at TIMESTAMPTZ,
    ends_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Deferred FK: entries.contract_id references contracts (entries table defined before contracts)
ALTER TABLE entries ADD CONSTRAINT fk_entries_contract_id
  FOREIGN KEY (contract_id) REFERENCES contracts(id) ON DELETE RESTRICT;

-- Auto-update updated_at on row modification
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER contracts_updated_at
    BEFORE UPDATE ON contracts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- Recovery Stream: Accountability Partners & Daily Attestations
-- ============================================================

ALTER TABLE contracts ADD COLUMN metadata JSONB DEFAULT '{}';

CREATE TABLE accountability_partners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id UUID REFERENCES contracts(id) ON DELETE CASCADE,
    partner_user_id UUID REFERENCES users(id),
    partner_email TEXT,
    status TEXT DEFAULT 'PENDING',  -- PENDING, ACTIVE, VETOED
    invited_at TIMESTAMPTZ DEFAULT NOW(),
    accepted_at TIMESTAMPTZ
);

CREATE TABLE attestations (
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

CREATE INDEX idx_attestations_contract_id ON attestations(contract_id);
CREATE INDEX idx_attestations_status ON attestations(status);
CREATE INDEX idx_accountability_partners_contract_id ON accountability_partners(contract_id);

CREATE TABLE proofs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id UUID REFERENCES contracts(id),
    user_id UUID REFERENCES users(id),
    media_uri TEXT,
    proof_type TEXT DEFAULT 'MEDIA',  -- MEDIA, ATTESTATION
    is_honeypot BOOLEAN DEFAULT FALSE,
    status TEXT DEFAULT 'PENDING_REVIEW',
    processing_status TEXT DEFAULT 'NOT_STARTED',
    challenge_token TEXT,
    metadata_hash TEXT,
    masked_media_uri TEXT,
    redaction_status TEXT DEFAULT 'NOT_APPLICABLE',
    redaction_profile TEXT,
    submitted_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE fury_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    proof_id UUID REFERENCES proofs(id),
    fury_user_id UUID REFERENCES users(id),
    verdict TEXT,
    reviewed_at TIMESTAMPTZ,
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    subject_alias TEXT
);

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    body TEXT,
    read BOOLEAN DEFAULT FALSE,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, read) WHERE read = FALSE;

-- Stripe webhook idempotency: track processed event IDs
CREATE TABLE stripe_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id TEXT UNIQUE NOT NULL,
    event_type TEXT NOT NULL,
    processed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_stripe_events_event_id ON stripe_events(event_id);

CREATE TABLE contract_resolution_side_effects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id UUID REFERENCES contracts(id) ON DELETE CASCADE,
    outcome TEXT NOT NULL,
    effect_type TEXT NOT NULL,
    dedupe_key TEXT NOT NULL UNIQUE,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    status TEXT NOT NULL DEFAULT 'PENDING',
    attempts INTEGER NOT NULL DEFAULT 0,
    last_error TEXT,
    locked_at TIMESTAMPTZ,
    next_retry_at TIMESTAMPTZ,
    quarantined_at TIMESTAMPTZ,
    quarantine_reason TEXT,
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT chk_contract_resolution_effect_status
      CHECK (status IN ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'QUARANTINED'))
);

CREATE INDEX idx_contract_resolution_effects_contract
  ON contract_resolution_side_effects(contract_id, created_at);
CREATE INDEX idx_contract_resolution_effects_status
  ON contract_resolution_side_effects(status, created_at);
CREATE INDEX idx_contract_resolution_effects_retry_due
  ON contract_resolution_side_effects(status, next_retry_at)
  WHERE status = 'FAILED';
CREATE INDEX idx_contract_resolution_effects_quarantined
  ON contract_resolution_side_effects(status, quarantined_at)
  WHERE status = 'QUARANTINED';

-- B2B Consumption Billing
CREATE TABLE consumption_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    enterprise_id UUID NOT NULL,
    event_type TEXT NOT NULL,
    units INTEGER NOT NULL DEFAULT 1,
    recorded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_consumption_logs_enterprise_period
  ON consumption_logs(enterprise_id, recorded_at);
CREATE INDEX idx_consumption_logs_event_type
  ON consumption_logs(enterprise_id, event_type, recorded_at);

CREATE INDEX idx_contracts_user_id ON contracts(user_id);
CREATE INDEX idx_contracts_status ON contracts(status);
CREATE INDEX idx_proofs_contract_id ON proofs(contract_id);
CREATE INDEX idx_proofs_status ON proofs(status);
CREATE INDEX idx_fury_assignments_proof_id ON fury_assignments(proof_id);
CREATE INDEX idx_fury_assignments_fury_user_id ON fury_assignments(fury_user_id);

-- Ledger performance indexes
-- Refresh tokens for JWT rotation
CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    revoked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_token_hash ON refresh_tokens(token_hash);

-- Account lockout columns
ALTER TABLE users ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS locked_until TIMESTAMPTZ;

CREATE INDEX idx_entries_debit_account_id ON entries(debit_account_id);
CREATE INDEX idx_entries_credit_account_id ON entries(credit_account_id);
CREATE INDEX idx_entries_contract_id ON entries(contract_id);
CREATE INDEX idx_users_enterprise_id ON users(enterprise_id);
CREATE INDEX idx_users_deletion_requested_at ON users(deletion_requested_at);

CREATE INDEX idx_users_last_known_state ON users(last_known_state);
CREATE INDEX idx_users_social_guild_id ON users(social_guild_id);

-- Real-money settlement tracking (TKT-P0-001)
CREATE TABLE IF NOT EXISTS settlement_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id UUID REFERENCES contracts(id),
    outcome TEXT NOT NULL,
    amount_cents INTEGER NOT NULL,
    status TEXT NOT NULL, -- PROCESSING, SUCCESS, FAILED
    disposition_mode TEXT, -- CAPTURE, REFUND
    quote_json JSONB, -- Deterministic payout breakdown
    provider_tx_id TEXT,
    last_error TEXT,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_settlement_runs_contract_id ON settlement_runs(contract_id);
CREATE INDEX IF NOT EXISTS idx_settlement_runs_status ON settlement_runs(status);

-- Settlement auditability indexes for ledger entries
CREATE INDEX IF NOT EXISTS idx_entries_settlement_run_id ON entries ((metadata->>'settlement_run_id'));
CREATE INDEX IF NOT EXISTS idx_entries_provider ON entries ((metadata->>'provider'));

-- Phase Gamma: Trust Chain (TKT-P1-007, TKT-P1-013, TKT-P1-014)

CREATE TABLE IF NOT EXISTS health_oracle_samples (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    contract_id UUID REFERENCES contracts(id),
    source_bundle_id TEXT NOT NULL,
    was_user_entered BOOLEAN NOT NULL DEFAULT FALSE,
    sample_hash TEXT NOT NULL UNIQUE,
    accepted BOOLEAN NOT NULL,
    reason TEXT,
    payload JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_health_oracle_samples_user_id ON health_oracle_samples(user_id);

CREATE TABLE IF NOT EXISTS proof_processing_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    proof_id UUID REFERENCES proofs(id),
    stage TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'QUEUED',
    attempts INTEGER DEFAULT 0,
    worker_ref TEXT,
    error TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_proof_processing_jobs_proof_id ON proof_processing_jobs(proof_id);
