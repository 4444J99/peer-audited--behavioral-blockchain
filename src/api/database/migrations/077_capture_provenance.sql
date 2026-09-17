-- Migration 070: record HOW a proof was captured.
--
-- Styx's authority is verifiability, and until now the pipeline could not answer
-- the most basic question about a piece of evidence: did a camera produce this?
-- The Phase-1 mobile client calls createSyntheticCaptureSession, which
-- base64-encodes a JSON metadata blob behind a `data:video/mp4;base64,` prefix —
-- so today's "recording" is JSON wearing an mp4 costume. That is a DISCLOSED
-- pilot exception (the completion matrix marks native capture PILOT-EXCEPTION,
-- and the scope lock keeps Phase 1 synthetic-only), not a secret.
--
-- What was missing is not the camera. It is the RECORD: nothing distinguished a
-- synthetic capture from a real one at rest, so a future real capture and
-- today's placeholder are indistinguishable in the database, and no reviewer,
-- auditor or export could tell them apart after the fact.
--
-- capture_source is that record. It is deliberately NOT a boolean: the honest
-- states are "a native camera produced this", "the beta placeholder produced
-- this", and "we do not know", and collapsing the third into either of the
-- others is how an unverified proof starts reading as verified.

ALTER TABLE proofs
  ADD COLUMN IF NOT EXISTS capture_source TEXT,
  ADD COLUMN IF NOT EXISTS capture_nonce TEXT,
  ADD COLUMN IF NOT EXISTS capture_verified BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_proofs_capture_source ON proofs(capture_source);

COMMENT ON COLUMN proofs.capture_source IS
  'NATIVE_CAMERA | SYNTHETIC_BETA | NULL (unknown — proofs predating this migration). NULL is a real answer, not a default.';
COMMENT ON COLUMN proofs.capture_nonce IS
  'The server-issued nonce echoed back at confirm time. Its presence and match are what capture_verified asserts.';
COMMENT ON COLUMN proofs.capture_verified IS
  'TRUE only when a NATIVE_CAMERA capture echoed the server nonce it was issued. A synthetic capture is never verified, by definition.';
