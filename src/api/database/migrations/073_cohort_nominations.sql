-- 073: Cohort nominations for curated beta growth (max 2 invites per user)
CREATE TABLE IF NOT EXISTS cohort_nominations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nominator_id UUID NOT NULL REFERENCES users(id),
    nominee_email TEXT NOT NULL,
    nominee_name TEXT,
    note TEXT,
    invite_code VARCHAR(32) NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACCEPTED', 'EXPIRED')),
    accepted_user_id UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    accepted_at TIMESTAMPTZ,
    UNIQUE(nominator_id, nominee_email)
);

CREATE INDEX IF NOT EXISTS idx_cohort_nominations_nominator ON cohort_nominations(nominator_id);
CREATE INDEX IF NOT EXISTS idx_cohort_nominations_invite_code ON cohort_nominations(invite_code);
CREATE INDEX IF NOT EXISTS idx_cohort_nominations_nominee_email ON cohort_nominations(nominee_email);
