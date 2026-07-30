-- Columns referenced by live SQL that existed in no migration and not in the
-- consolidated schema.sql. Every spec in this repo mocks the pg Pool, so these
-- queries were never executed against a real database and threw
-- 'column ... does not exist' at runtime. Found by a live route smoke plus a
-- static column audit of all API SQL against a fully-migrated database.

-- proofs: columns referenced by the core submission + Fury audit loop.
--
-- content_type: media MIME type from ProofMediaType (video/mp4, image/jpeg,
--   image/png, image/webp). Distinct from proof_type, which is the proof KIND
--   (MEDIA vs ATTESTATION). Nullable: legacy rows have no known MIME type and
--   TranscodingService.getExtension already falls back to 'mp4'.
-- description: optional user-supplied prose from RequestUploadUrlDto; shown to
--   Fury auditors and scanned by Aegis crisis detection.
-- uploaded_at: when the media upload was CONFIRMED. Distinct from submitted_at,
--   which is when the proof row was created and the presigned URL issued; a proof
--   that never completes upload keeps uploaded_at NULL. No default for that reason.
ALTER TABLE proofs ADD COLUMN IF NOT EXISTS content_type TEXT;
ALTER TABLE proofs ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE proofs ADD COLUMN IF NOT EXISTS uploaded_at TIMESTAMPTZ;

-- attestations.source: provenance tag for a daily attestation credit.
-- Gate 02: the hardware-oracle path (verified Fitbit webhook -> server-side fetch)
-- must be distinguishable from self-reported/scheduler-created attestations after
-- the fact. Existing rows all originate from the self-report/scheduler paths, so
-- 'self-report' is the correct backfill default.
ALTER TABLE attestations ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'self-report';
