-- TKT-P1-016: Biometric Verification Support (Stub for API)
-- Ensure proofs can be flagged as biometric-verified by native mobile clients.

ALTER TABLE proofs
ADD COLUMN IF NOT EXISTS biometric_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS biometric_type TEXT; -- 'FACE', 'VOICE'
