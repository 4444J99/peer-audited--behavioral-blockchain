-- Migration 024: Goal-Gradient Dashboard and Live Leaderboard (TKT-P1-018)

CREATE TABLE IF NOT EXISTS leaderboard_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    score_delta INTEGER NOT NULL,
    reason TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_leaderboard_events_user ON leaderboard_events(user_id);

CREATE TABLE IF NOT EXISTS dashboard_progress_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
    payload_json JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, snapshot_date)
);

