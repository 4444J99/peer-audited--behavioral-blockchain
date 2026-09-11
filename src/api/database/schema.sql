-- ARC-07: Double-Entry Ledger Schema
-- Enforce absolute financial integrity for user stakes and bounties.

CREATE TYPE account_type AS ENUM ('ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE');
CREATE TYPE access_tier AS ENUM ('free', 'early_access', 'pro');

CREATE TABLE accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    type account_type NOT NULL,
    status TEXT NOT NULL DEFAULT 'ACTIVE', -- ACTIVE, QUARANTINED
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

-- Provider-independent evidence for consequential agent actions. This is an
-- append-only record boundary; it never grants authority or executes mutations.
CREATE TABLE agent_action_evidence_events (
  id UUID PRIMARY KEY,
  schema_version TEXT NOT NULL DEFAULT 'organvm.execution/v1'
    CHECK (schema_version = 'organvm.execution/v1'),
  execution_id TEXT NOT NULL
    CHECK (char_length(execution_id) BETWEEN 1 AND 200),
  sequence_index BIGINT NOT NULL
    CHECK (sequence_index > 0),
  event_type TEXT NOT NULL CHECK (event_type IN (
    'PROPOSED',
    'APPROVAL_RECORDED',
    'MUTATION_RECORDED',
    'VERIFICATION_RECORDED',
    'ROLLBACK_RECORDED',
    'DISPUTE_OPENED',
    'PEER_REVIEW_RECORDED'
  )),
  producer TEXT NOT NULL
    CHECK (char_length(producer) BETWEEN 1 AND 100),
  recorded_by TEXT NOT NULL
    CHECK (char_length(recorded_by) BETWEEN 1 AND 200),
  payload JSONB NOT NULL,
  previous_event_hash CHAR(64) NOT NULL,
  event_hash CHAR(64) NOT NULL UNIQUE,
  truth_log_event_id UUID NOT NULL REFERENCES event_log(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL,
  UNIQUE (execution_id, sequence_index)
);

CREATE INDEX idx_agent_action_evidence_execution
  ON agent_action_evidence_events (execution_id, sequence_index);
CREATE INDEX idx_agent_action_evidence_type_created
  ON agent_action_evidence_events (event_type, created_at DESC);
CREATE INDEX idx_agent_action_evidence_recorded_by
  ON agent_action_evidence_events (recorded_by, created_at DESC);

CREATE OR REPLACE FUNCTION prevent_agent_action_evidence_mutation()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'agent_action_evidence_events is immutable: UPDATE and DELETE are prohibited';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_agent_action_evidence_immutable
  BEFORE UPDATE OR DELETE ON agent_action_evidence_events
  FOR EACH ROW EXECUTE FUNCTION prevent_agent_action_evidence_mutation();

-- ============================================================
-- Domain Tables: Users, Contracts, Proofs, Fury Assignments
-- ============================================================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT,
    stripe_customer_id TEXT,
    subscription_id TEXT,
    integrity_score INTEGER DEFAULT 50,
    account_id UUID REFERENCES accounts(id),
    role TEXT DEFAULT 'USER',
    access_tier access_tier NOT NULL DEFAULT 'early_access',
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
    grace_period_month TEXT,
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
    status TEXT DEFAULT 'PENDING',  -- PENDING, ATTESTED, COSIGNED, MISSED, RELAPSED
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
    honeypot_expected_verdict TEXT,  -- known-correct verdict for honeypots ('PASS'/'FAIL'); NULL for real proofs
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
    rejection_code TEXT,
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

-- User API keys for authenticated API clients.
CREATE TABLE api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    key_id TEXT NOT NULL UNIQUE,
    key_hash TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    prefix TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ,
    last_used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX idx_api_keys_key_id ON api_keys(key_id);
CREATE INDEX idx_api_keys_active_lookup
  ON api_keys(key_id)
  WHERE revoked_at IS NULL;

-- Account lockout columns
ALTER TABLE users ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS locked_until TIMESTAMPTZ;

CREATE INDEX idx_entries_debit_account_id ON entries(debit_account_id);
CREATE INDEX idx_entries_credit_account_id ON entries(credit_account_id);
CREATE INDEX idx_entries_contract_id ON entries(contract_id);
CREATE INDEX idx_users_access_tier ON users(access_tier);
CREATE UNIQUE INDEX idx_users_subscription_id ON users(subscription_id) WHERE subscription_id IS NOT NULL;
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
-- Migration 021: Phase Gamma Enforcement and Recovery (TKT-P1-015, TKT-P1-005)

-- TKT-P1-015: Collusion Slashing
CREATE TABLE IF NOT EXISTS fury_enforcement_cases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reviewer_id UUID REFERENCES users(id),
    case_type TEXT NOT NULL, -- HONEYPOT_FAILURE, COLLUSION_RING
    confidence FLOAT NOT NULL,
    status TEXT DEFAULT 'PENDING_REVIEW', -- PENDING_REVIEW, PENALTY_APPLIED, APPEALED, REVERSED
    evidence_json JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_fury_enforcement_cases_reviewer ON fury_enforcement_cases(reviewer_id);

CREATE TABLE IF NOT EXISTS fury_penalties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID REFERENCES fury_enforcement_cases(id),
    penalty_type TEXT NOT NULL, -- STAKE_SLASH, REP_BURN, BAN
    amount_cents INTEGER,
    applied_at TIMESTAMPTZ DEFAULT NOW(),
    reversed_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_fury_penalties_case ON fury_penalties(case_id);

-- TKT-P1-005: Recovery Timelock
CREATE TABLE IF NOT EXISTS recovery_break_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id UUID REFERENCES contracts(id),
    requested_at TIMESTAMPTZ DEFAULT NOW(),
    unlock_at TIMESTAMPTZ NOT NULL,
    reason TEXT,
    status TEXT DEFAULT 'PENDING_COOLDOWN' -- PENDING_COOLDOWN, UNLOCKED, CANCELLED, CONSUMED
);
CREATE INDEX IF NOT EXISTS idx_recovery_break_requests_contract ON recovery_break_requests(contract_id);
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

-- Migration 024: Goal-Gradient Dashboard and Live Leaderboard (TKT-P1-018)

CREATE TABLE IF NOT EXISTS leaderboard_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    score_delta INTEGER NOT NULL,
    reason TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_leaderboard_events_user ON leaderboard_events(user_id);

CREATE TABLE IF NOT EXISTS dashboard_progress_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
    payload_json JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, snapshot_date)
);

-- Migration 025: Realms — Portal-Based Behavioral Domain Separation

CREATE TABLE IF NOT EXISTS realms (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    stream_prefix TEXT NOT NULL,
    config JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO realms (id, name, slug, stream_prefix, config) VALUES
  ('BIOLOGICAL_HARDWARE',  'Biological Hardware',  'biological-hardware',  'BIOLOGICAL',   '{}'),
  ('COGNITIVE_DEVICE',     'Cognitive Device',     'cognitive-device',     'COGNITIVE',    '{}'),
  ('PROFESSIONAL_API',     'Professional API',     'professional-api',     'PROFESSIONAL', '{}'),
  ('CREATIVE_PROCESS',     'Creative Process',     'creative-process',     'CREATIVE',     '{}'),
  ('ENVIRONMENTAL_VISUAL', 'Environmental Visual', 'environmental-visual', 'VISUAL',       '{}'),
  ('CHARACTER_SOCIAL',     'Character Social',     'character-social',     'SOCIAL',       '{}'),
  ('RECOVERY_ABSTINENCE',  'Recovery Abstinence',  'recovery-abstinence',  'RECOVERY',     '{}')
ON CONFLICT (id) DO NOTHING;

ALTER TABLE contracts ADD COLUMN IF NOT EXISTS realm_id TEXT REFERENCES realms(id);
CREATE INDEX IF NOT EXISTS idx_contracts_realm_id ON contracts(realm_id);

CREATE TABLE IF NOT EXISTS fury_realm_expertise (
    fury_user_id UUID REFERENCES users(id),
    realm_id TEXT REFERENCES realms(id),
    audits_completed INTEGER DEFAULT 0,
    accuracy FLOAT DEFAULT 1.0,
    specialization_level TEXT DEFAULT 'NOVICE',
    PRIMARY KEY (fury_user_id, realm_id)
);

ALTER TABLE fury_assignments ADD COLUMN IF NOT EXISTS realm_id TEXT REFERENCES realms(id);
CREATE INDEX IF NOT EXISTS idx_fury_assignments_realm_id ON fury_assignments(realm_id);

ALTER TABLE users ADD COLUMN IF NOT EXISTS realm_preferences JSONB DEFAULT '{}';

COMMENT ON COLUMN users.access_tier IS
  'Product access tier: free cannot create contracts, early_access is capped, pro has full contract creation access.';

-- ── Circle 5 backend completion (PR #836) ───────────────────────────────────
-- Pod failure broadcast log (050 + 057): cohort-scoped, attribution columns,
-- string pod ids sourced from contracts.metadata.
CREATE TABLE IF NOT EXISTS pod_broadcast_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pod_id TEXT NOT NULL,
    cohort_id TEXT,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    failure_type TEXT,
    failure_count INTEGER NOT NULL DEFAULT 0,
    dampened BOOLEAN NOT NULL DEFAULT FALSE,
    broadcasted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_pbl_pod ON pod_broadcast_log(pod_id);
CREATE INDEX IF NOT EXISTS idx_pbl_pod_cohort ON pod_broadcast_log(pod_id, cohort_id);

-- DECO web-state commitments (055)
CREATE TABLE IF NOT EXISTS deco_commitments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    url TEXT NOT NULL,
    selector TEXT NOT NULL,
    expected_value TEXT NOT NULL,
    commitment_hash TEXT NOT NULL UNIQUE,
    verified BOOLEAN NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_deco_commitments_hash ON deco_commitments(commitment_hash);
CREATE INDEX IF NOT EXISTS idx_deco_commitments_user ON deco_commitments(user_id);

-- Stripe FBO connected accounts by jurisdiction (056)
CREATE TABLE IF NOT EXISTS fbo_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    platform_account_id TEXT NOT NULL UNIQUE,
    platform_name TEXT NOT NULL DEFAULT 'STRIPE',
    jurisdiction TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    deactivated_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_fbo_accounts_jurisdiction ON fbo_accounts(jurisdiction);
CREATE INDEX IF NOT EXISTS idx_fbo_accounts_active ON fbo_accounts(is_active) WHERE is_active = TRUE;
-- Circle-5 practitioner intelligence tables (mirrors migration 058)
CREATE TABLE IF NOT EXISTS practitioner_client_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practitioner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  CHECK (practitioner_id != client_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_pca_active_pair
  ON practitioner_client_assignments(practitioner_id, client_id) WHERE active;
CREATE INDEX IF NOT EXISTS idx_pca_practitioner_active
  ON practitioner_client_assignments(practitioner_id) WHERE active;
CREATE INDEX IF NOT EXISTS idx_pca_client
  ON practitioner_client_assignments(client_id);

-- PractitionerIntelligenceService INSERTs client_id but SELECTs user_id for
-- the same person, so user_id is a generated mirror of client_id.
CREATE TABLE IF NOT EXISTS practitioner_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practitioner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_id UUID GENERATED ALWAYS AS (client_id) STORED,
  alert_type TEXT NOT NULL CHECK (alert_type IN ('RATIONALIZATION', 'DISTRESS_ESCALATION', 'TRIGGER_MENTION', 'CRISIS_LANGUAGE')),
  excerpt TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_practitioner_alerts_client_created
  ON practitioner_alerts(client_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_practitioner_alerts_practitioner
  ON practitioner_alerts(practitioner_id);

CREATE TABLE IF NOT EXISTS activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL DEFAULT 'APP_OPEN',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_log_user_created
  ON activity_log(user_id, created_at);

CREATE TABLE IF NOT EXISTS contract_violations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID REFERENCES contracts(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  violation_type TEXT NOT NULL DEFAULT 'ATTESTATION_MISSED',
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contract_violations_user
  ON contract_violations(user_id);
CREATE INDEX IF NOT EXISTS idx_contract_violations_contract
  ON contract_violations(contract_id);

-- Columns queried by Circle-5 services that predate no other DDL
ALTER TABLE proofs ADD COLUMN IF NOT EXISTS ip_address TEXT;
ALTER TABLE proofs ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
UPDATE proofs SET created_at = submitted_at WHERE submitted_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_proofs_ip_address
  ON proofs(ip_address) WHERE ip_address IS NOT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_number TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS alias TEXT;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS grace_days_total INTEGER NOT NULL DEFAULT 0;-- AML screening infrastructure (migration 059): backing AmlScreeningService
CREATE TABLE IF NOT EXISTS internal_watchlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  list_type TEXT NOT NULL,
  matched_name TEXT NOT NULL,
  -- DOUBLE PRECISION (not NUMERIC): node-postgres returns NUMERIC as a string,
  -- and the service compares confidence numerically against 0.9.
  confidence DOUBLE PRECISION NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  source TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_internal_watchlist_user ON internal_watchlist(user_id);
CREATE INDEX IF NOT EXISTS idx_internal_watchlist_list_type ON internal_watchlist(list_type);

CREATE TABLE IF NOT EXISTS internal_blocklist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
-- user_id lookups are served by the UNIQUE constraint's index.

CREATE TABLE IF NOT EXISTS aml_screenings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  risk_level TEXT NOT NULL CHECK (risk_level IN ('CLEAR', 'FLAGGED', 'BLOCKED')),
  matches JSONB NOT NULL DEFAULT '[]'::jsonb,
  screened_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_aml_screenings_user_screened ON aml_screenings(user_id, screened_at DESC);
CREATE INDEX IF NOT EXISTS idx_aml_screenings_risk ON aml_screenings(risk_level);-- Fitbit verified-webhook OAuth grants (Gate 02: notifications carry only refs;
-- biometric data is fetched server-side with these tokens).
CREATE TABLE IF NOT EXISTS fitbit_oauth_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  -- Fitbit's stable user identifier (webhook notifications reference this).
  -- UNIQUE: one wearable identity may back only one account (anti-Sybil).
  fitbit_user_id TEXT NOT NULL UNIQUE,
  access_token TEXT,
  access_token_expires_at TIMESTAMPTZ,
  refresh_token TEXT NOT NULL,
  scope TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);-- Circle-4 retention state (mirrors migrations/061_retention_state.sql)
ALTER TABLE users ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'America/New_York';
ALTER TABLE users ADD COLUMN IF NOT EXISTS alias TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS oath_categories TEXT[] DEFAULT '{}';

CREATE TABLE IF NOT EXISTS retention_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL,
  dedupe_key TEXT NOT NULL DEFAULT '',
  local_date DATE NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_retention_notifications_daily
    UNIQUE (user_id, contract_id, notification_type, dedupe_key, local_date)
);

CREATE INDEX IF NOT EXISTS idx_retention_notifications_user_date
  ON retention_notifications(user_id, local_date);
CREATE INDEX IF NOT EXISTS idx_partner_checkins_pending_due
  ON partner_checkins(scheduled_at) WHERE status = 'PENDING';-- Durable system-wide operational flags (e.g. the compliance REFUND_ONLY kill
-- switch), previously process-local statics reset by every deploy.
CREATE TABLE IF NOT EXISTS system_flags (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID
);

-- Crisis alerting tables used by CrisisNotificationService (previously absent
-- from both schema.sql and migrations; the fail-loud crisis path writes an
-- operational alert row into crisis_notifications).
CREATE TABLE IF NOT EXISTS crisis_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  severity VARCHAR(20) NOT NULL CHECK (severity IN ('MEDIUM', 'HIGH', 'CRITICAL')),
  category VARCHAR(50) NOT NULL,
  matched_keywords TEXT NOT NULL DEFAULT '[]',
  source VARCHAR(30) NOT NULL,
  message TEXT NOT NULL,
  acknowledged BOOLEAN NOT NULL DEFAULT FALSE,
  acknowledged_by UUID,
  acknowledged_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_crisis_notifications_unacked
  ON crisis_notifications(acknowledged, created_at);

CREATE TABLE IF NOT EXISTS crisis_follow_ups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  crisis_event_id UUID NOT NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'COMPLETED', 'MISSED')),
  response TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_crisis_follow_ups_pending
  ON crisis_follow_ups(status, scheduled_at);

-- ── Schema-drift repair (migration 064) ─────────────────────────────────────
ALTER TABLE proofs ADD COLUMN IF NOT EXISTS content_type TEXT;
ALTER TABLE proofs ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE proofs ADD COLUMN IF NOT EXISTS uploaded_at TIMESTAMPTZ;
ALTER TABLE attestations ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'self-report';

-- ── DECO commitment privacy (migration 065) ─────────────────────────────────
-- Commitments store only the hash, the timestamp hashed into it, and the domain.
ALTER TABLE deco_commitments ADD COLUMN IF NOT EXISTS domain TEXT;
ALTER TABLE deco_commitments ADD COLUMN IF NOT EXISTS committed_at TEXT;
ALTER TABLE deco_commitments DROP COLUMN IF EXISTS url;
ALTER TABLE deco_commitments DROP COLUMN IF EXISTS selector;
ALTER TABLE deco_commitments DROP COLUMN IF EXISTS expected_value;

-- ── Identity-based oath onboarding (migration 069) ──────────────────────────
-- Onboarding asks who the user is becoming, not what they will do; the
-- declaration is stored per user per oath category and the contract is bound to
-- it. `copy_variant` records the activation-copy arm the pledge was composed
-- under, so a later change to the assignment function cannot rewrite a sentence
-- the user already agreed to.
CREATE TABLE IF NOT EXISTS user_identity_oaths (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  oath_category TEXT NOT NULL,
  archetype_id TEXT NOT NULL,
  identity_label TEXT NOT NULL,
  pledge_copy TEXT NOT NULL,
  copy_variant TEXT NOT NULL,
  activated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_user_identity_oaths_user_category UNIQUE (user_id, oath_category)
);

CREATE INDEX IF NOT EXISTS idx_user_identity_oaths_user
  ON user_identity_oaths(user_id);

ALTER TABLE contracts
  ADD COLUMN IF NOT EXISTS identity_oath_id UUID
  REFERENCES user_identity_oaths(id) ON DELETE SET NULL;
