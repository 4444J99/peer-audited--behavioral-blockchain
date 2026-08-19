-- 070: Index the enforcement-case access paths the collusion wiring introduced.
--
-- Until TKT-P1-008 the only reader of fury_enforcement_cases was a per-reviewer
-- lookup, which idx_fury_enforcement_cases_reviewer already served. Two new hot
-- paths arrive with the sweep:
--
--   1. CollusionDetectionScheduler runs every 6 hours and, for each ring member,
--      asks "does this reviewer already have an open COLLUSION_RING case?" before
--      filing. That is a (reviewer_id, case_type, status) probe on every sweep.
--   2. The admin read API lists cases filtered by status/case_type, newest first.
--
-- Both would otherwise degrade into sequential scans as cases accumulate, and
-- cases only ever accumulate — nothing deletes them.

CREATE INDEX IF NOT EXISTS idx_fury_enforcement_cases_reviewer_type_status
    ON fury_enforcement_cases(reviewer_id, case_type, status);

CREATE INDEX IF NOT EXISTS idx_fury_enforcement_cases_status_created
    ON fury_enforcement_cases(status, case_type, created_at DESC);
