-- Migration 043: Capture Nonce Challenge for Native Camera Proofs
-- TKT-P0-002: Native iOS camera proof capture with nonce challenge

CREATE TABLE IF NOT EXISTS capture_nonces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nonce TEXT NOT NULL UNIQUE,
    raw TEXT NOT NULL,
    contract_id UUID NOT NULL REFERENCES contracts(id),
    user_id UUID NOT NULL REFERENCES users(id),
    proof_id UUID REFERENCES proofs(id),
    used BOOLEAN NOT NULL DEFAULT FALSE,
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_capture_nonces_nonce ON capture_nonces (nonce);
CREATE INDEX IF NOT EXISTS idx_capture_nonces_user_id ON capture_nonces (user_id);
CREATE INDEX IF NOT EXISTS idx_capture_nonces_expires_at ON capture_nonces (expires_at);
CREATE INDEX IF NOT EXISTS idx_capture_nonces_used ON capture_nonces (used) WHERE used = FALSE;
