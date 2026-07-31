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

-- disposition_mode moves with the tier. Leaving it at the column default
-- ('HOUSE_RETAINED') would make GET /payments/disposition-policy/effective
-- report house retention for jurisdictions the settlement mapper now refunds —
-- the same class of split-source disagreement this migration exists to remove.
UPDATE jurisdictions
   SET tier = 'HARD_BLOCK',
       disposition_mode = 'REFUND_ONLY',
       updated_at = NOW()
 WHERE code IN ('NV', 'SD', 'AZ', 'MT')
   AND (tier <> 'HARD_BLOCK' OR disposition_mode <> 'REFUND_ONLY');

-- Cover a database provisioned before 010 seeded these rows.
INSERT INTO jurisdictions (code, name, tier, disposition_mode) VALUES
    ('NV', 'Nevada', 'HARD_BLOCK', 'REFUND_ONLY'),
    ('SD', 'South Dakota', 'HARD_BLOCK', 'REFUND_ONLY'),
    ('AZ', 'Arizona', 'HARD_BLOCK', 'REFUND_ONLY'),
    ('MT', 'Montana', 'HARD_BLOCK', 'REFUND_ONLY')
ON CONFLICT (code) DO NOTHING;
