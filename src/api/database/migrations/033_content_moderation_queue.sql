-- Migration 033: Content moderation queue
-- App Store compliance: UGC moderation pipeline for user-submitted proofs

CREATE TABLE IF NOT EXISTS content_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type VARCHAR(50) NOT NULL CHECK (content_type IN ('PROOF_MEDIA', 'PROFILE_TEXT', 'CONTRACT_TITLE', 'WHISTLEBLOWER_REPORT')),
  content_id UUID NOT NULL,
  reporter_id UUID REFERENCES users(id),
  reason VARCHAR(100) NOT NULL,
  details TEXT,
  severity VARCHAR(20) NOT NULL DEFAULT 'LOW' CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'UNDER_REVIEW', 'APPROVED', 'REMOVED', 'ESCALATED')),
  auto_flagged BOOLEAN DEFAULT FALSE,
  auto_filter_matches TEXT[],
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  appeal_text TEXT,
  appeal_status VARCHAR(20) CHECK (appeal_status IN (NULL, 'PENDING', 'UPHELD', 'OVERTURNED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_content_flags_status ON content_flags(status);
CREATE INDEX idx_content_flags_severity ON content_flags(severity);
CREATE INDEX idx_content_flags_content ON content_flags(content_type, content_id);
CREATE INDEX idx_content_flags_reporter ON content_flags(reporter_id);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_content_flags_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_content_flags_updated_at
  BEFORE UPDATE ON content_flags
  FOR EACH ROW
  EXECUTE FUNCTION update_content_flags_timestamp();
