-- 047: Rationalization classifier audit trail (F-AEGIS-10)
-- Logs AI-classified user rationalizations for pattern tracking and Judge review.

CREATE TABLE IF NOT EXISTS rationalization_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    context_type TEXT NOT NULL CHECK (context_type IN ('GRACE_DAY', 'EXTENSION_REQUEST', 'DISPUTE_NARRATIVE', 'PROOF_FAILURE')),
    context_id TEXT,
    raw_text TEXT NOT NULL,
    classification TEXT NOT NULL CHECK (classification IN ('GENUINE_EMERGENCY', 'LEGITIMATE_BUT_NOT_BLOCKING', 'PURE_RATIONALIZATION')),
    confidence DECIMAL(4,3),
    ai_response TEXT,
    user_action TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_rationalization_log_user_id ON rationalization_log(user_id);
CREATE INDEX idx_rationalization_log_classification ON rationalization_log(classification);
CREATE INDEX idx_rationalization_log_created_at ON rationalization_log(created_at DESC);
