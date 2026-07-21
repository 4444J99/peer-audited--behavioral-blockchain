-- Migration 043: Compliance artifacts for legal whitepaper release gate
--
-- Stores versioned compliance artifacts (legal whitepapers, counsel opinions)
-- with hash integrity, counsel signature tracking, and expiration monitoring.
-- The CI release gate checks this table before allowing deploys.

CREATE TABLE IF NOT EXISTS compliance_artifacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Artifact type: 'skill_contest_whitepaper', 'fbo_custody_opinion', etc.
  artifact_type TEXT NOT NULL,
  -- Semantic version of the artifact (e.g. "1.0.0")
  version TEXT NOT NULL,
  -- SHA-256 hex digest of the artifact file content
  content_hash TEXT NOT NULL,
  -- Path or URL where the artifact content is stored
  artifact_path TEXT NOT NULL,
  -- Counsel or authority who signed off on this version
  signed_by TEXT,
  -- ISO-8601 timestamp of the counsel's dated signature
  signed_at TIMESTAMPTZ,
  -- Jurisdictions this artifact covers (JSON array of ISO country/region codes)
  jurisdictions JSONB NOT NULL DEFAULT '[]'::jsonb,
  -- When this artifact version expires (null = no expiration)
  expires_at TIMESTAMPTZ,
  -- Whether this is the currently active version
  is_active BOOLEAN NOT NULL DEFAULT false,
  -- Soft delete — superseded versions remain for audit trail
  superseded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Only one active version per artifact type
  CONSTRAINT uq_active_artifact UNIQUE (artifact_type) WHERE is_active = true
);

CREATE INDEX IF NOT EXISTS idx_compliance_artifacts_type_active
  ON compliance_artifacts(artifact_type)
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_compliance_artifacts_type_version
  ON compliance_artifacts(artifact_type, version);

COMMENT ON TABLE compliance_artifacts IS
  'Versioned compliance artifacts with hash integrity, counsel signatures, and expiration tracking. CI release gate checks this table before allowing deploys.';
COMMENT ON COLUMN compliance_artifacts.content_hash IS
  'SHA-256 hex digest of the artifact file — CI verifies this matches the deployed file.';
COMMENT ON COLUMN compliance_artifacts.signed_by IS
  'Counsel or authority who signed off on this version. Null until counsel has reviewed and signed.';
COMMENT ON COLUMN compliance_artifacts.signed_at IS
  'ISO-8601 timestamp of the dated counsel signature. Must match the signature document.';
