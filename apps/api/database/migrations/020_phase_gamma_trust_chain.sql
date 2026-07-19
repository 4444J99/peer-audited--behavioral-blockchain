-- Migration 020: Phase Gamma Trust Chain (TKT-P1-007, TKT-P1-013, TKT-P1-014)

-- 1. TKT-P1-007: Health Data Bridge
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

-- 2. TKT-P1-013: Video Proof Processing Pipeline
ALTER TABLE proofs
ADD COLUMN IF NOT EXISTS processing_status TEXT DEFAULT 'NOT_STARTED',
ADD COLUMN IF NOT EXISTS challenge_token TEXT,
ADD COLUMN IF NOT EXISTS metadata_hash TEXT;

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

-- 3. TKT-P1-014: Identity Redaction Runtime
ALTER TABLE proofs
ADD COLUMN IF NOT EXISTS masked_media_uri TEXT,
ADD COLUMN IF NOT EXISTS redaction_status TEXT DEFAULT 'NOT_APPLICABLE',
ADD COLUMN IF NOT EXISTS redaction_profile TEXT;

ALTER TABLE fury_assignments
ADD COLUMN IF NOT EXISTS subject_alias TEXT;

-- Backfill subject_alias for existing assignments
UPDATE fury_assignments
SET subject_alias = 'Target_' || substr(id::text, 1, 8)
WHERE subject_alias IS NULL;
