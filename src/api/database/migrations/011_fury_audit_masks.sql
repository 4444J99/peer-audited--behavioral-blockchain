-- TKT-P1-014: Fury Audit Masks (Identity Redaction) Runtime
-- Ensure anti-bias and privacy controls for peer reviewers.

ALTER TABLE proofs
ADD COLUMN IF NOT EXISTS masked_media_uri TEXT,
ADD COLUMN IF NOT EXISTS redaction_status TEXT DEFAULT 'PENDING', -- PENDING, COMPLETED, FAILED, BYPASSED
ADD COLUMN IF NOT EXISTS redaction_profile TEXT; -- e.g., 'FACE_BLUR', 'VOICE_PIVOT'

ALTER TABLE fury_assignments
ADD COLUMN IF NOT EXISTS subject_alias TEXT;

-- Seed existing fury_assignments with a default alias
UPDATE fury_assignments
SET subject_alias = 'Subject_' || substring(id::text from 1 for 8)
WHERE subject_alias IS NULL;

CREATE INDEX IF NOT EXISTS idx_proofs_redaction_status ON proofs(redaction_status);
