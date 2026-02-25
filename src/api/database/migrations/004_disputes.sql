-- 004_disputes: Dispute/appeal tracking table for The Judge resolution pipeline.

CREATE TABLE IF NOT EXISTS disputes (
  id                  UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  proof_id            UUID NOT NULL REFERENCES proofs(id) ON DELETE CASCADE,
  user_id             UUID NOT NULL REFERENCES users(id),
  appeal_status       VARCHAR(50) NOT NULL DEFAULT 'FEE_AUTHORIZED_PENDING_REVIEW',
  payment_intent_id   VARCHAR(255),
  judge_user_id       UUID REFERENCES users(id),
  judge_notes         TEXT,
  resolved_at         TIMESTAMP WITH TIME ZONE,
  created_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT uq_disputes_proof_id UNIQUE (proof_id)
);

CREATE INDEX IF NOT EXISTS idx_disputes_appeal_status ON disputes (appeal_status);
CREATE INDEX IF NOT EXISTS idx_disputes_user_id ON disputes (user_id);

-- Track migration
INSERT INTO schema_migrations (version, name) VALUES (4, '004_disputes')
ON CONFLICT (version) DO NOTHING;
