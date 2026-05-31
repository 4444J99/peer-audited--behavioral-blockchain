CREATE TABLE IF NOT EXISTS crisis_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES accounts(id),
    trigger TEXT NOT NULL,
    severity VARCHAR(50) NOT NULL DEFAULT 'HIGH',
    matched_keywords JSONB,
    escalated BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_crisis_events_user_id ON crisis_events(user_id);
