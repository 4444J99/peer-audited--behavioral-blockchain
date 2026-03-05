-- Migration 021: Phase Gamma Enforcement and Recovery (TKT-P1-015, TKT-P1-005)

-- TKT-P1-015: Collusion Slashing
CREATE TABLE IF NOT EXISTS fury_enforcement_cases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reviewer_id UUID REFERENCES users(id),
    case_type TEXT NOT NULL, -- HONEYPOT_FAILURE, COLLUSION_RING
    confidence FLOAT NOT NULL,
    status TEXT DEFAULT 'PENDING_REVIEW', -- PENDING_REVIEW, PENALTY_APPLIED, APPEALED, REVERSED
    evidence_json JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_fury_enforcement_cases_reviewer ON fury_enforcement_cases(reviewer_id);

CREATE TABLE IF NOT EXISTS fury_penalties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID REFERENCES fury_enforcement_cases(id),
    penalty_type TEXT NOT NULL, -- STAKE_SLASH, REP_BURN, BAN
    amount_cents INTEGER,
    applied_at TIMESTAMPTZ DEFAULT NOW(),
    reversed_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_fury_penalties_case ON fury_penalties(case_id);

-- TKT-P1-005: Recovery Timelock
CREATE TABLE IF NOT EXISTS recovery_break_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id UUID REFERENCES contracts(id),
    requested_at TIMESTAMPTZ DEFAULT NOW(),
    unlock_at TIMESTAMPTZ NOT NULL,
    reason TEXT,
    status TEXT DEFAULT 'PENDING_COOLDOWN' -- PENDING_COOLDOWN, UNLOCKED, CANCELLED, CONSUMED
);
CREATE INDEX IF NOT EXISTS idx_recovery_break_requests_contract ON recovery_break_requests(contract_id);
