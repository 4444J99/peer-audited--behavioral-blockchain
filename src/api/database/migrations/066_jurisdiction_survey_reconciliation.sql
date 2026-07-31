-- 066: Reconcile the jurisdictions registry with our own 50-state survey.
--
-- `STATE_TIERS` (src/api/services/geofencing.ts) and this table are dual
-- sources of truth: request-time guards read the TS map, while
-- CompliancePolicyService reads these rows. Migration 010 seeded four states
-- more permissively than docs/legal/legal--50-state-skill-contest-survey.md
-- recommends, and the TS map has now been tightened to match. This brings the
-- registry along so the two do not disagree.
--
--   NV, SD  FULL_ACCESS -> HARD_BLOCK  (survey: BLOCK; licensure required)
--   AZ, MT  REFUND_ONLY -> HARD_BLOCK  (survey: BLOCK; no safe harbor)
--
-- NV and SD are the material change: at FULL_ACCESS the platform would capture
-- a forfeited deposit in states our own research says require a gaming licence.
--
-- Tightening needs no counsel; relaxing does. Counsel sign-off on the full
-- matrix is issue #317 — if counsel clears any of these, reverse it in a new
-- migration and update STATE_TIERS in the same change, never one alone.

UPDATE jurisdictions
   SET tier = 'HARD_BLOCK',
       updated_at = NOW()
 WHERE code IN ('NV', 'SD', 'AZ', 'MT')
   AND tier <> 'HARD_BLOCK';

-- Cover a database provisioned before 010 seeded these rows.
INSERT INTO jurisdictions (code, name, tier) VALUES
    ('NV', 'Nevada', 'HARD_BLOCK'),
    ('SD', 'South Dakota', 'HARD_BLOCK'),
    ('AZ', 'Arizona', 'HARD_BLOCK'),
    ('MT', 'Montana', 'HARD_BLOCK')
ON CONFLICT (code) DO NOTHING;
