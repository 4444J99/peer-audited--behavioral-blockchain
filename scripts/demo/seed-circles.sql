-- ============================================================================
-- Styx Demo Cohort: "The Concentric Circles"
-- ============================================================================
-- Layers a realistic demo cohort ON TOP of src/api/database/seed.sql.
-- Run order: docker compose up (schema.sql + seed.sql via initdb) -> migrate
-- -> psql -f scripts/demo/seed-circles.sql. See scripts/demo/README.md.
--
-- Every insert is idempotent (ON CONFLICT DO NOTHING / NOT EXISTS guards), so
-- re-running this file against a live database is safe.
--
-- Cast:
--   12 users total (all passwords: demo-password-123):
--     7 no-contact consumers  d1..0001-0007 (5-member pod via contracts.metadata.cohort)
--     3 Fury auditors         d1..0008-000a (Alecto, Megaera, Tisiphone)
--     1 practitioner          d1..000b
--     1 enterprise admin      d1..000c  (Acheron Logistics, e0..0001 — the id
--                                        src/web/app/hr/page.tsx defaults to)
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Ledger accounts (users.account_id references accounts.id)
-- ---------------------------------------------------------------------------
INSERT INTO accounts (id, name, type) VALUES
  ('a1000000-0000-0000-0000-000000000001', 'USER_river',     'ASSET'),
  ('a1000000-0000-0000-0000-000000000002', 'USER_ash',       'ASSET'),
  ('a1000000-0000-0000-0000-000000000003', 'USER_juno',      'ASSET'),
  ('a1000000-0000-0000-0000-000000000004', 'USER_wren',      'ASSET'),
  ('a1000000-0000-0000-0000-000000000005', 'USER_sage',      'ASSET'),
  ('a1000000-0000-0000-0000-000000000006', 'USER_indigo',    'ASSET'),
  ('a1000000-0000-0000-0000-000000000007', 'USER_marlow',    'ASSET'),
  ('a1000000-0000-0000-0000-000000000008', 'USER_alecto',    'ASSET'),
  ('a1000000-0000-0000-0000-000000000009', 'USER_megaera',   'ASSET'),
  ('a1000000-0000-0000-0000-00000000000a', 'USER_tisiphone', 'ASSET'),
  ('a1000000-0000-0000-0000-00000000000b', 'USER_dr_moira',  'ASSET'),
  ('a1000000-0000-0000-0000-00000000000c', 'USER_hr_lead',   'ASSET')
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- Enterprise: Acheron Logistics (id matches the /hr dashboard default)
-- ---------------------------------------------------------------------------
INSERT INTO enterprises (id, name, status) VALUES
  ('e0000000-0000-0000-0000-000000000001', 'Acheron Logistics Group', 'ACTIVE')
ON CONFLICT DO NOTHING;

INSERT INTO enterprise_scopes (id, enterprise_id, scope_key, limit_value, current_usage, reset_period) VALUES
  ('ec100000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001', 'active_contracts', 100, 8, 'monthly'),
  ('ec100000-0000-0000-0000-000000000002', 'e0000000-0000-0000-0000-000000000001', 'seats',             25, 6, 'monthly')
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- Users (bcrypt hash reused from base seed: demo-password-123) -- allow-secret
-- Consumers 1-3 and 7 are Acheron employees so the /hr metrics light up.
-- ---------------------------------------------------------------------------
INSERT INTO users (
  id, email, password_hash, stripe_customer_id, integrity_score, account_id,
  role, access_tier, enterprise_id, status,
  kyc_status, age_verification_status, identity_provider, identity_verification_id, identity_verified_at,
  terms_accepted_at, terms_version, date_of_birth
) VALUES
  -- No-contact consumers (pod members: river, ash, juno, wren, sage)
  ('d1000000-0000-0000-0000-000000000001', 'river@demo.styx.protocol',     '$2b$10$Qvqvkece7/TpoSbDjHr75eHpT7blt9.4dwoub11ClSk2/PCk4tehe', 'cus_demo_river',     82, 'a1000000-0000-0000-0000-000000000001', 'USER', 'early_access', 'e0000000-0000-0000-0000-000000000001', 'ACTIVE', 'VERIFIED',    'VERIFIED',    'MOCK', 'ivs_mock_demo_river',  NOW() - INTERVAL '25 days', NOW() - INTERVAL '26 days', '2026-05', '1994-03-14'),
  ('d1000000-0000-0000-0000-000000000002', 'ash@demo.styx.protocol',       '$2b$10$Qvqvkece7/TpoSbDjHr75eHpT7blt9.4dwoub11ClSk2/PCk4tehe', 'cus_demo_ash',       64, 'a1000000-0000-0000-0000-000000000002', 'USER', 'early_access', 'e0000000-0000-0000-0000-000000000001', 'ACTIVE', 'NOT_STARTED', 'VERIFIED',    NULL,   NULL,                   NULL,                       NOW() - INTERVAL '16 days', '2026-05', '1991-11-02'),
  ('d1000000-0000-0000-0000-000000000003', 'juno@demo.styx.protocol',      '$2b$10$Qvqvkece7/TpoSbDjHr75eHpT7blt9.4dwoub11ClSk2/PCk4tehe', 'cus_demo_juno',      71, 'a1000000-0000-0000-0000-000000000003', 'USER', 'early_access', 'e0000000-0000-0000-0000-000000000001', 'ACTIVE', 'NOT_STARTED', 'VERIFIED',    NULL,   NULL,                   NULL,                       NOW() - INTERVAL '11 days', '2026-05', '1997-07-21'),
  ('d1000000-0000-0000-0000-000000000004', 'wren@demo.styx.protocol',      '$2b$10$Qvqvkece7/TpoSbDjHr75eHpT7blt9.4dwoub11ClSk2/PCk4tehe', 'cus_demo_wren',      93, 'a1000000-0000-0000-0000-000000000004', 'USER', 'pro',          NULL,                                   'ACTIVE', 'VERIFIED',    'VERIFIED',    'MOCK', 'ivs_mock_demo_wren',   NOW() - INTERVAL '40 days', NOW() - INTERVAL '42 days', '2026-05', '1989-01-30'),
  ('d1000000-0000-0000-0000-000000000005', 'sage@demo.styx.protocol',      '$2b$10$Qvqvkece7/TpoSbDjHr75eHpT7blt9.4dwoub11ClSk2/PCk4tehe', 'cus_demo_sage',      55, 'a1000000-0000-0000-0000-000000000005', 'USER', 'early_access', NULL,                                   'ACTIVE', 'PENDING',     'PENDING',     'MOCK', 'ivs_mock_demo_sage',   NULL,                       NOW() - INTERVAL '6 days',  '2026-05', '1999-09-09'),
  -- Non-pod consumers
  ('d1000000-0000-0000-0000-000000000006', 'indigo@demo.styx.protocol',    '$2b$10$Qvqvkece7/TpoSbDjHr75eHpT7blt9.4dwoub11ClSk2/PCk4tehe', 'cus_demo_indigo',    68, 'a1000000-0000-0000-0000-000000000006', 'USER', 'early_access', NULL,                                   'ACTIVE', 'NOT_STARTED', 'VERIFIED',    NULL,   NULL,                   NULL,                       NOW() - INTERVAL '13 days', '2026-05', '1995-04-18'),
  ('d1000000-0000-0000-0000-000000000007', 'marlow@demo.styx.protocol',    '$2b$10$Qvqvkece7/TpoSbDjHr75eHpT7blt9.4dwoub11ClSk2/PCk4tehe', 'cus_demo_marlow',    47, 'a1000000-0000-0000-0000-000000000007', 'USER', 'early_access', 'e0000000-0000-0000-0000-000000000001', 'ACTIVE', 'NOT_STARTED', 'VERIFIED',    NULL,   NULL,                   NULL,                       NOW() - INTERVAL '70 days', '2026-04', '1987-12-05'),
  -- Fury auditors (the three Furies)
  ('d1000000-0000-0000-0000-000000000008', 'alecto@demo.styx.protocol',    '$2b$10$Qvqvkece7/TpoSbDjHr75eHpT7blt9.4dwoub11ClSk2/PCk4tehe', 'cus_demo_alecto',    95, 'a1000000-0000-0000-0000-000000000008', 'FURY', 'pro',          NULL,                                   'ACTIVE', 'VERIFIED',    'VERIFIED',    'MOCK', 'ivs_mock_demo_alecto', NOW() - INTERVAL '60 days', NOW() - INTERVAL '61 days', '2026-04', '1990-06-16'),
  ('d1000000-0000-0000-0000-000000000009', 'megaera@demo.styx.protocol',   '$2b$10$Qvqvkece7/TpoSbDjHr75eHpT7blt9.4dwoub11ClSk2/PCk4tehe', 'cus_demo_megaera',   91, 'a1000000-0000-0000-0000-000000000009', 'FURY', 'pro',          NULL,                                   'ACTIVE', 'VERIFIED',    'VERIFIED',    'MOCK', 'ivs_mock_demo_megaera', NOW() - INTERVAL '55 days', NOW() - INTERVAL '56 days', '2026-04', '1992-02-28'),
  ('d1000000-0000-0000-0000-00000000000a', 'tisiphone@demo.styx.protocol', '$2b$10$Qvqvkece7/TpoSbDjHr75eHpT7blt9.4dwoub11ClSk2/PCk4tehe', 'cus_demo_tisiphone', 88, 'a1000000-0000-0000-0000-00000000000a', 'FURY', 'pro',          NULL,                                   'ACTIVE', 'VERIFIED',    'VERIFIED',    'MOCK', 'ivs_mock_demo_tisiphone', NOW() - INTERVAL '50 days', NOW() - INTERVAL '51 days', '2026-04', '1993-10-10'),
  -- Practitioner tier
  ('d1000000-0000-0000-0000-00000000000b', 'dr.moira@demo.styx.protocol',  '$2b$10$Qvqvkece7/TpoSbDjHr75eHpT7blt9.4dwoub11ClSk2/PCk4tehe', 'cus_demo_moira',     99, 'a1000000-0000-0000-0000-00000000000b', 'PRACTITIONER', 'pro',  NULL,                                   'ACTIVE', 'VERIFIED',    'VERIFIED',    'MOCK', 'ivs_mock_demo_moira',  NOW() - INTERVAL '90 days', NOW() - INTERVAL '92 days', '2026-04', '1978-08-08'),
  -- Enterprise admin (logs into /hr as Acheron Logistics)
  ('d1000000-0000-0000-0000-00000000000c', 'hr.lead@acheron.example',      '$2b$10$Qvqvkece7/TpoSbDjHr75eHpT7blt9.4dwoub11ClSk2/PCk4tehe', 'cus_demo_hrlead',    85, 'a1000000-0000-0000-0000-00000000000c', 'ADMIN', 'pro',         'e0000000-0000-0000-0000-000000000001', 'ACTIVE', 'VERIFIED',    'VERIFIED',    'MOCK', 'ivs_mock_demo_hrlead', NOW() - INTERVAL '30 days', NOW() - INTERVAL '31 days', '2026-05', '1984-05-23')
ON CONFLICT DO NOTHING;

-- Display aliases (users.alias, added in migration 058) — the practitioner
-- console and pod peer-identity reveal both render these.
UPDATE users SET alias = v.alias FROM (VALUES
  ('d1000000-0000-0000-0000-000000000001'::uuid, 'River Quinn'),
  ('d1000000-0000-0000-0000-000000000002'::uuid, 'Ash Mercer'),
  ('d1000000-0000-0000-0000-000000000003'::uuid, 'Juno Vance'),
  ('d1000000-0000-0000-0000-000000000004'::uuid, 'Wren Abbott'),
  ('d1000000-0000-0000-0000-000000000005'::uuid, 'Sage Ellis'),
  ('d1000000-0000-0000-0000-000000000006'::uuid, 'Indigo Park'),
  ('d1000000-0000-0000-0000-000000000007'::uuid, 'Marlow Reed'),
  ('d1000000-0000-0000-0000-000000000008'::uuid, 'Alecto'),
  ('d1000000-0000-0000-0000-000000000009'::uuid, 'Megaera'),
  ('d1000000-0000-0000-0000-00000000000a'::uuid, 'Tisiphone'),
  ('d1000000-0000-0000-0000-00000000000b'::uuid, 'Dr. Moira Kesh'),
  ('d1000000-0000-0000-0000-00000000000c'::uuid, 'Acheron HR Lead')
) AS v(id, alias) WHERE users.id = v.id AND users.alias IS DISTINCT FROM v.alias;

-- ---------------------------------------------------------------------------
-- Jurisdiction placement (users.last_known_state + compliance_metadata.state)
-- ---------------------------------------------------------------------------
-- Without this every demo user sits at NULL, and three Circle-5 surfaces go
-- quiet in ways that look like working software:
--   * /admin/jurisdictions renders one undifferentiated TIER_3 blob, because
--     compliance-policy.service.ts falls back to TIER_3 for a missing state.
--   * POST /users/me/ccpa/deletion-request always 403s — ccpa.service.ts gates
--     on compliance_metadata.state = 'CA' (CCPA rights attach to California
--     residents), so with no state nobody can ever exercise it.
--   * fbo-account.service.ts joins users.last_known_state to
--     fbo_accounts.jurisdiction; against NULL the join never matches and every
--     contract silently takes the 'US' fallback, hiding the routing entirely.
--
-- The spread deliberately covers all three tiers from services/geofencing.ts so
-- the jurisdiction console shows real contrast: TIER_1 full access, TIER_2
-- refund-only (NY), TIER_3 blocked (WA). The two blocked/restricted users are
-- non-pod consumers, so no seeded contract flow depends on them.
--
-- Both columns are written because the codebase reads two different sources:
-- geofencing persists last_known_state, CCPA reads compliance_metadata.state.
-- Seeding only one leaves the other half of Circle 5 dark.
--
-- INITIALIZE, NEVER OVERWRITE. This is a live-database seed the README promises
-- is safe to re-run, and last_known_state is not a demo-owned field:
-- compliance-policy.service.ts persists the caller's real state on every
-- request (evaluateUserComplianceForRequest). Assigning unconditionally would
-- reset a demo user who has since been geofenced elsewhere back to the
-- hard-coded value here, and silently route their contracts to the stale
-- jurisdiction's FBO account. Each field is therefore set only when it is
-- absent, and the two are guarded independently because they drift apart —
-- CCPA's opt-out path writes compliance_metadata without touching
-- last_known_state.
UPDATE users SET
  last_known_state = COALESCE(users.last_known_state, v.state),
  compliance_metadata =
    CASE
      WHEN COALESCE(users.compliance_metadata, '{}'::jsonb) ? 'state'
        THEN users.compliance_metadata
      ELSE COALESCE(users.compliance_metadata, '{}'::jsonb)
           || jsonb_build_object('state', COALESCE(users.last_known_state, v.state))
    END
FROM (VALUES
  -- TIER_1 (full access) — the flagship demo paths
  ('d1000000-0000-0000-0000-000000000001'::uuid, 'CA'),  -- river   — CCPA demo subject
  ('d1000000-0000-0000-0000-000000000002'::uuid, 'TX'),  -- ash
  ('d1000000-0000-0000-0000-000000000003'::uuid, 'FL'),  -- juno
  ('d1000000-0000-0000-0000-000000000004'::uuid, 'IL'),  -- wren
  ('d1000000-0000-0000-0000-000000000005'::uuid, 'CA'),  -- sage    — second CA resident
  -- TIER_2 (refund-only) and TIER_3 (blocked) — non-pod, nothing depends on them
  ('d1000000-0000-0000-0000-000000000006'::uuid, 'NY'),  -- indigo  — REFUND_ONLY
  ('d1000000-0000-0000-0000-000000000007'::uuid, 'WA'),  -- marlow  — BLOCKED
  -- Furies, practitioner, enterprise admin
  ('d1000000-0000-0000-0000-000000000008'::uuid, 'CA'),  -- alecto
  ('d1000000-0000-0000-0000-000000000009'::uuid, 'TX'),  -- megaera
  ('d1000000-0000-0000-0000-00000000000a'::uuid, 'OH'),  -- tisiphone
  ('d1000000-0000-0000-0000-00000000000b'::uuid, 'CA'),  -- dr.moira
  ('d1000000-0000-0000-0000-00000000000c'::uuid, 'CA')   -- hr.lead
) AS v(id, state)
WHERE users.id = v.id
  -- Never write to an erased user. CcpaService.runErasureStatements sets
  -- last_known_state = NULL, compliance_metadata = '{}' and status = 'DELETED'.
  -- Initialize-only semantics are not enough on their own here: erasure leaves
  -- both fields exactly as "absent" as a fresh row, so without this guard a
  -- re-run would refill them and partially reverse a completed CCPA deletion.
  -- Seeding the CA residents is what made that path reachable in the first
  -- place, so this guard has to land with it.
  AND users.status <> 'DELETED'
  -- Only touch rows that are actually missing something, so a settled database
  -- reports zero updated rows instead of rewriting identical values.
  AND (users.last_known_state IS NULL
       OR NOT (COALESCE(users.compliance_metadata, '{}'::jsonb) ? 'state'));

-- ---------------------------------------------------------------------------
-- FBO custody accounts (Circle 5 — Stripe for-benefit-of routing)
-- ---------------------------------------------------------------------------
-- fbo-account.service.ts routes a contract to the account whose jurisdiction
-- matches the owner's state, and falls back to getActiveAccount('US'). The
-- table shipped empty, so both halves returned null and the routing was
-- untestable against demo data.
--
-- Jurisdictions are registered as ISO-3166-2 subdivisions ('US-CA') while
-- geofencing persists bare state codes ('CA'); the service normalizes on the
-- suffix. Seeding both shapes plus the bare 'US' fallback exercises every
-- branch of that join.
INSERT INTO fbo_accounts (id, platform_account_id, platform_name, jurisdiction, is_active, deactivated_at) VALUES
  ('fb000000-0000-0000-0000-000000000001', 'acct_demo_fbo_us_ca', 'STRIPE', 'US-CA', TRUE,  NULL),
  ('fb000000-0000-0000-0000-000000000002', 'acct_demo_fbo_us_tx', 'STRIPE', 'US-TX', TRUE,  NULL),
  ('fb000000-0000-0000-0000-000000000003', 'acct_demo_fbo_us_ny', 'STRIPE', 'US-NY', TRUE,  NULL),
  ('fb000000-0000-0000-0000-000000000004', 'acct_demo_fbo_us',    'STRIPE', 'US',    TRUE,  NULL),
  -- A deactivated account so "is_active = FALSE is skipped" is visible, not assumed.
  ('fb000000-0000-0000-0000-000000000005', 'acct_demo_fbo_us_wa', 'STRIPE', 'US-WA', FALSE, NOW() - INTERVAL '9 days')
ON CONFLICT DO NOTHING;

-- Enterprise seats (admin seat + member seats for the Acheron employees)
INSERT INTO enterprise_seats (id, enterprise_id, user_id, seat_type, active) VALUES
  ('e5100000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-00000000000c', 'ADMIN',  TRUE),
  ('e5100000-0000-0000-0000-000000000002', 'e0000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000001', 'MEMBER', TRUE),
  ('e5100000-0000-0000-0000-000000000003', 'e0000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000002', 'MEMBER', TRUE),
  ('e5100000-0000-0000-0000-000000000004', 'e0000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000003', 'MEMBER', TRUE),
  ('e5100000-0000-0000-0000-000000000005', 'e0000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000007', 'MEMBER', TRUE)
ON CONFLICT DO NOTHING;

-- Seat for the base-seed demo user (guarded: only if base seed.sql ran first)
INSERT INTO enterprise_seats (id, enterprise_id, user_id, seat_type, active)
SELECT 'e5100000-0000-0000-0000-000000000006', 'e0000000-0000-0000-0000-000000000001', u.id, 'MEMBER', TRUE
FROM users u WHERE u.id = 'd0000000-0000-0000-0000-000000000001'
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- Contracts
-- The 5 pod members share contracts.metadata.cohort (the shape read by
-- pod-orchestration.service.ts: cohortId / podId / joinedAt / displayAlias).
-- ---------------------------------------------------------------------------
INSERT INTO contracts (
  id, user_id, oath_category, verification_method, stake_amount,
  payment_intent_id, duration_days, status, grace_days_used,
  started_at, ends_at, realm_id, metadata
) VALUES
  -- Pod "Cerberus" (cohort-2026-07): five active RECOVERY no-contact contracts
  ('c1000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000001', 'RECOVERY_NO_CONTACT_TEXT', 'SELF_REPORT', 40.00, 'pi_demo_river_01',  60, 'ACTIVE',    0, NOW() - INTERVAL '21 days', NOW() + INTERVAL '39 days', 'RECOVERY_ABSTINENCE', '{"cohort": {"cohortId": "cohort-2026-07", "podId": "pod-cerberus", "joinedAt": "2026-07-08T00:00:00Z", "displayAlias": "River"}}'::jsonb),
  ('c1000000-0000-0000-0000-000000000002', 'd1000000-0000-0000-0000-000000000002', 'RECOVERY_NO_CONTACT_TEXT', 'SELF_REPORT', 30.00, 'pi_demo_ash_01',    30, 'ACTIVE',    1, NOW() - INTERVAL '14 days', NOW() + INTERVAL '16 days', 'RECOVERY_ABSTINENCE', '{"cohort": {"cohortId": "cohort-2026-07", "podId": "pod-cerberus", "joinedAt": "2026-07-15T00:00:00Z", "displayAlias": "Ash"}}'::jsonb),
  ('c1000000-0000-0000-0000-000000000003', 'd1000000-0000-0000-0000-000000000003', 'RECOVERY_NO_CONTACT_TEXT', 'SELF_REPORT', 25.00, 'pi_demo_juno_01',   30, 'ACTIVE',    0, NOW() - INTERVAL '9 days',  NOW() + INTERVAL '21 days', 'RECOVERY_ABSTINENCE', '{"cohort": {"cohortId": "cohort-2026-07", "podId": "pod-cerberus", "joinedAt": "2026-07-20T00:00:00Z", "displayAlias": "Juno"}}'::jsonb),
  ('c1000000-0000-0000-0000-000000000004', 'd1000000-0000-0000-0000-000000000004', 'RECOVERY_NO_CONTACT_TEXT', 'SELF_REPORT', 60.00, 'pi_demo_wren_01',   90, 'ACTIVE',    0, NOW() - INTERVAL '30 days', NOW() + INTERVAL '60 days', 'RECOVERY_ABSTINENCE', '{"cohort": {"cohortId": "cohort-2026-07", "podId": "pod-cerberus", "joinedAt": "2026-06-30T00:00:00Z", "displayAlias": "Wren"}}'::jsonb),
  ('c1000000-0000-0000-0000-000000000005', 'd1000000-0000-0000-0000-000000000005', 'RECOVERY_NO_CONTACT_TEXT', 'SELF_REPORT', 20.00, 'pi_demo_sage_01',   30, 'ACTIVE',    0, NOW() - INTERVAL '5 days',  NOW() + INTERVAL '25 days', 'RECOVERY_ABSTINENCE', '{"cohort": {"cohortId": "cohort-2026-07", "podId": "pod-cerberus", "joinedAt": "2026-07-24T00:00:00Z", "displayAlias": "Sage"}}'::jsonb),
  -- Non-pod actives
  ('c1000000-0000-0000-0000-000000000006', 'd1000000-0000-0000-0000-000000000006', 'RECOVERY_NO_CONTACT_TEXT', 'SELF_REPORT', 35.00, 'pi_demo_indigo_01', 30, 'ACTIVE',    2, NOW() - INTERVAL '12 days', NOW() + INTERVAL '18 days', 'RECOVERY_ABSTINENCE', '{}'::jsonb),
  ('c1000000-0000-0000-0000-000000000008', 'd1000000-0000-0000-0000-000000000007', 'RECOVERY_NO_CONTACT_TEXT', 'SELF_REPORT', 45.00, 'pi_demo_marlow_02', 30, 'ACTIVE',    0, NOW() - INTERVAL '8 days',  NOW() + INTERVAL '22 days', 'RECOVERY_ABSTINENCE', '{}'::jsonb),
  -- Lifecycle history (feeds /hr completion + failure metrics)
  ('c1000000-0000-0000-0000-000000000007', 'd1000000-0000-0000-0000-000000000007', 'RECOVERY_NO_CONTACT_TEXT', 'SELF_REPORT', 50.00, 'pi_demo_marlow_01', 30, 'COMPLETED', 1, NOW() - INTERVAL '50 days', NOW() - INTERVAL '20 days', 'RECOVERY_ABSTINENCE', '{}'::jsonb),
  ('c1000000-0000-0000-0000-000000000009', 'd1000000-0000-0000-0000-000000000007', 'RECOVERY_NO_CONTACT_TEXT', 'SELF_REPORT', 30.00, 'pi_demo_marlow_00', 30, 'FAILED',    3, NOW() - INTERVAL '95 days', NOW() - INTERVAL '65 days', 'RECOVERY_ABSTINENCE', '{}'::jsonb),
  -- A media-verified contract so the Fury queue has work (Circle Gamma)
  ('c1000000-0000-0000-0000-00000000000a', 'd1000000-0000-0000-0000-000000000001', 'COGNITIVE_FOCUS',          'SCREENTIME',  15.00, 'pi_demo_river_02',  14, 'ACTIVE',    0, NOW() - INTERVAL '6 days',  NOW() + INTERVAL '8 days',  'COGNITIVE_DEVICE',    '{}'::jsonb)
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- Attestation streaks (idempotent via UNIQUE(contract_id, attestation_date))
-- ---------------------------------------------------------------------------
-- River: 21-day perfect streak, pod partner cosigns every 4th calendar day
INSERT INTO attestations (contract_id, user_id, attestation_date, attested_at, cosigned_by, cosigned_at, status)
SELECT
  'c1000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000001',
  d::date, d + INTERVAL '20 hours',
  CASE WHEN EXTRACT(DAY FROM d)::int % 4 = 0 THEN 'd1000000-0000-0000-0000-000000000004'::uuid END,
  CASE WHEN EXTRACT(DAY FROM d)::int % 4 = 0 THEN d + INTERVAL '22 hours' END,
  CASE WHEN EXTRACT(DAY FROM d)::int % 4 = 0 THEN 'COSIGNED' ELSE 'ATTESTED' END
FROM generate_series(CURRENT_DATE - INTERVAL '21 days', CURRENT_DATE - INTERVAL '1 day', INTERVAL '1 day') AS d
ON CONFLICT DO NOTHING;

-- Ash: 14 days with a miss 7 days ago (burned one grace day), recovered since
INSERT INTO attestations (contract_id, user_id, attestation_date, attested_at, status)
SELECT
  'c1000000-0000-0000-0000-000000000002', 'd1000000-0000-0000-0000-000000000002',
  d::date,
  CASE WHEN d::date = CURRENT_DATE - 7 THEN NULL ELSE d + INTERVAL '21 hours' END,
  CASE WHEN d::date = CURRENT_DATE - 7 THEN 'MISSED' ELSE 'ATTESTED' END
FROM generate_series(CURRENT_DATE - INTERVAL '14 days', CURRENT_DATE - INTERVAL '1 day', INTERVAL '1 day') AS d
ON CONFLICT DO NOTHING;

-- Juno: 9-day streak, clean
INSERT INTO attestations (contract_id, user_id, attestation_date, attested_at, status)
SELECT
  'c1000000-0000-0000-0000-000000000003', 'd1000000-0000-0000-0000-000000000003',
  d::date, d + INTERVAL '19 hours', 'ATTESTED'
FROM generate_series(CURRENT_DATE - INTERVAL '9 days', CURRENT_DATE - INTERVAL '1 day', INTERVAL '1 day') AS d
ON CONFLICT DO NOTHING;

-- Wren: 30-day model streak, partner cosigns every 3rd calendar day
INSERT INTO attestations (contract_id, user_id, attestation_date, attested_at, cosigned_by, cosigned_at, status)
SELECT
  'c1000000-0000-0000-0000-000000000004', 'd1000000-0000-0000-0000-000000000004',
  d::date, d + INTERVAL '18 hours',
  CASE WHEN EXTRACT(DAY FROM d)::int % 3 = 0 THEN 'd1000000-0000-0000-0000-000000000002'::uuid END,
  CASE WHEN EXTRACT(DAY FROM d)::int % 3 = 0 THEN d + INTERVAL '21 hours' END,
  CASE WHEN EXTRACT(DAY FROM d)::int % 3 = 0 THEN 'COSIGNED' ELSE 'ATTESTED' END
FROM generate_series(CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE - INTERVAL '1 day', INTERVAL '1 day') AS d
ON CONFLICT DO NOTHING;

-- Sage: young 5-day streak (fresh join, KYC still pending)
INSERT INTO attestations (contract_id, user_id, attestation_date, attested_at, status)
SELECT
  'c1000000-0000-0000-0000-000000000005', 'd1000000-0000-0000-0000-000000000005',
  d::date, d + INTERVAL '22 hours', 'ATTESTED'
FROM generate_series(CURRENT_DATE - INTERVAL '5 days', CURRENT_DATE - INTERVAL '1 day', INTERVAL '1 day') AS d
ON CONFLICT DO NOTHING;

-- Indigo: 12 days with two misses (both grace days burned) — a wobbling streak
INSERT INTO attestations (contract_id, user_id, attestation_date, attested_at, status)
SELECT
  'c1000000-0000-0000-0000-000000000006', 'd1000000-0000-0000-0000-000000000006',
  d::date,
  CASE WHEN d::date IN (CURRENT_DATE - 9, CURRENT_DATE - 2) THEN NULL ELSE d + INTERVAL '23 hours' END,
  CASE WHEN d::date IN (CURRENT_DATE - 9, CURRENT_DATE - 2) THEN 'MISSED' ELSE 'ATTESTED' END
FROM generate_series(CURRENT_DATE - INTERVAL '12 days', CURRENT_DATE - INTERVAL '1 day', INTERVAL '1 day') AS d
ON CONFLICT DO NOTHING;

-- Marlow: 8-day streak on the current contract
INSERT INTO attestations (contract_id, user_id, attestation_date, attested_at, status)
SELECT
  'c1000000-0000-0000-0000-000000000008', 'd1000000-0000-0000-0000-000000000007',
  d::date, d + INTERVAL '20 hours', 'ATTESTED'
FROM generate_series(CURRENT_DATE - INTERVAL '8 days', CURRENT_DATE - INTERVAL '1 day', INTERVAL '1 day') AS d
ON CONFLICT DO NOTHING;

-- Today's PENDING attestation for every active recovery contract (a tester
-- opening the app has today's check-in waiting)
INSERT INTO attestations (contract_id, user_id, attestation_date, status) VALUES
  ('c1000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000001', CURRENT_DATE, 'PENDING'),
  ('c1000000-0000-0000-0000-000000000002', 'd1000000-0000-0000-0000-000000000002', CURRENT_DATE, 'PENDING'),
  ('c1000000-0000-0000-0000-000000000003', 'd1000000-0000-0000-0000-000000000003', CURRENT_DATE, 'PENDING'),
  ('c1000000-0000-0000-0000-000000000004', 'd1000000-0000-0000-0000-000000000004', CURRENT_DATE, 'PENDING'),
  ('c1000000-0000-0000-0000-000000000005', 'd1000000-0000-0000-0000-000000000005', CURRENT_DATE, 'PENDING'),
  ('c1000000-0000-0000-0000-000000000006', 'd1000000-0000-0000-0000-000000000006', CURRENT_DATE, 'PENDING'),
  ('c1000000-0000-0000-0000-000000000008', 'd1000000-0000-0000-0000-000000000007', CURRENT_DATE, 'PENDING')
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- Accountability partner links (pod members partner each other; one email-only
-- invite still pending; one cross-cohort link)
-- ---------------------------------------------------------------------------
INSERT INTO accountability_partners (id, contract_id, partner_user_id, partner_email, status, invited_at, accepted_at) VALUES
  ('ab100000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000004', 'wren@demo.styx.protocol',   'ACTIVE',  NOW() - INTERVAL '21 days', NOW() - INTERVAL '20 days'),
  ('ab100000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000002', 'd1000000-0000-0000-0000-000000000001', 'river@demo.styx.protocol',  'ACTIVE',  NOW() - INTERVAL '14 days', NOW() - INTERVAL '13 days'),
  ('ab100000-0000-0000-0000-000000000003', 'c1000000-0000-0000-0000-000000000004', 'd1000000-0000-0000-0000-000000000002', 'ash@demo.styx.protocol',    'ACTIVE',  NOW() - INTERVAL '30 days', NOW() - INTERVAL '29 days'),
  ('ab100000-0000-0000-0000-000000000004', 'c1000000-0000-0000-0000-000000000005', NULL,                                   'sibling@example.com',       'PENDING', NOW() - INTERVAL '4 days',  NULL),
  ('ab100000-0000-0000-0000-000000000005', 'c1000000-0000-0000-0000-000000000006', 'd1000000-0000-0000-0000-000000000007', 'marlow@demo.styx.protocol', 'ACTIVE',  NOW() - INTERVAL '12 days', NOW() - INTERVAL '11 days')
ON CONFLICT DO NOTHING;

-- Partner check-ins (052)
INSERT INTO partner_checkins (id, contract_id, partner_id, type, status, scheduled_at, completed_at, message) VALUES
  ('cc100000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000004', 'STREAK_MILESTONE', 'COMPLETED', NOW() - INTERVAL '7 days', NOW() - INTERVAL '7 days' + INTERVAL '3 hours', 'Two weeks strong. Proud of you.'),
  ('cc100000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000002', 'd1000000-0000-0000-0000-000000000001', 'EMERGENCY',        'COMPLETED', NOW() - INTERVAL '7 days', NOW() - INTERVAL '7 days' + INTERVAL '1 hour',  'Rough night after the missed day — called it out together.'),
  ('cc100000-0000-0000-0000-000000000003', 'c1000000-0000-0000-0000-000000000004', 'd1000000-0000-0000-0000-000000000002', 'SCHEDULED',        'PENDING',   NOW() + INTERVAL '2 days', NULL, NULL)
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- Fury workload (Circle Gamma): one proof pending 3-way review, one resolved
-- ---------------------------------------------------------------------------
INSERT INTO proofs (id, contract_id, user_id, media_uri, proof_type, status, submitted_at) VALUES
  ('b1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-00000000000a', 'd1000000-0000-0000-0000-000000000001', 'https://styx-fury-proofs.r2.dev/demo/screentime-week1.png', 'MEDIA', 'PENDING_REVIEW', NOW() - INTERVAL '6 hours'),
  ('b1000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-00000000000a', 'd1000000-0000-0000-0000-000000000001', 'https://styx-fury-proofs.r2.dev/demo/screentime-day2.png',  'MEDIA', 'VERIFIED',       NOW() - INTERVAL '4 days')
ON CONFLICT DO NOTHING;

INSERT INTO fury_assignments (id, proof_id, fury_user_id, verdict, reviewed_at, assigned_at, subject_alias, realm_id) VALUES
  -- Pending 3-way review
  ('fa100000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000008', NULL,   NULL,                     NOW() - INTERVAL '5 hours', 'Subject_1f9a04c2', 'COGNITIVE_DEVICE'),
  ('fa100000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000009', NULL,   NULL,                     NOW() - INTERVAL '5 hours', 'Subject_1f9a04c2', 'COGNITIVE_DEVICE'),
  ('fa100000-0000-0000-0000-000000000003', 'b1000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-00000000000a', NULL,   NULL,                     NOW() - INTERVAL '5 hours', 'Subject_1f9a04c2', 'COGNITIVE_DEVICE'),
  -- Resolved consensus (feeds fury accuracy stats)
  ('fa100000-0000-0000-0000-000000000004', 'b1000000-0000-0000-0000-000000000002', 'd1000000-0000-0000-0000-000000000008', 'PASS', NOW() - INTERVAL '3 days', NOW() - INTERVAL '4 days', 'Subject_1f9a04c2', 'COGNITIVE_DEVICE'),
  ('fa100000-0000-0000-0000-000000000005', 'b1000000-0000-0000-0000-000000000002', 'd1000000-0000-0000-0000-000000000009', 'PASS', NOW() - INTERVAL '3 days', NOW() - INTERVAL '4 days', 'Subject_1f9a04c2', 'COGNITIVE_DEVICE'),
  ('fa100000-0000-0000-0000-000000000006', 'b1000000-0000-0000-0000-000000000002', 'd1000000-0000-0000-0000-00000000000a', 'PASS', NOW() - INTERVAL '3 days', NOW() - INTERVAL '4 days', 'Subject_1f9a04c2', 'COGNITIVE_DEVICE')
ON CONFLICT DO NOTHING;

-- Realm specialization for the three auditors (composite-PK, idempotent)
INSERT INTO fury_realm_expertise (fury_user_id, realm_id, audits_completed, accuracy, specialization_level) VALUES
  ('d1000000-0000-0000-0000-000000000008', 'RECOVERY_ABSTINENCE', 148, 0.97, 'EXPERT'),
  ('d1000000-0000-0000-0000-000000000008', 'COGNITIVE_DEVICE',     52, 0.94, 'ADEPT'),
  ('d1000000-0000-0000-0000-000000000009', 'RECOVERY_ABSTINENCE',  95, 0.92, 'ADEPT'),
  ('d1000000-0000-0000-0000-000000000009', 'COGNITIVE_DEVICE',     31, 0.90, 'NOVICE'),
  ('d1000000-0000-0000-0000-00000000000a', 'RECOVERY_ABSTINENCE',  67, 0.95, 'ADEPT'),
  ('d1000000-0000-0000-0000-00000000000a', 'COGNITIVE_DEVICE',     12, 1.00, 'NOVICE')
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- Ledger entries: stake holds for active contracts, one return, one forfeit
-- (amounts in integer cents; escrow = a0..01, revenue = a0..02 from base seed)
-- ---------------------------------------------------------------------------
INSERT INTO entries (id, debit_account_id, credit_account_id, amount, contract_id, metadata) VALUES
  ('ee100000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 4000, 'c1000000-0000-0000-0000-000000000001', '{"type": "STAKE_HOLD", "userId": "d1000000-0000-0000-0000-000000000001"}'::jsonb),
  ('ee100000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 3000, 'c1000000-0000-0000-0000-000000000002', '{"type": "STAKE_HOLD", "userId": "d1000000-0000-0000-0000-000000000002"}'::jsonb),
  ('ee100000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 2500, 'c1000000-0000-0000-0000-000000000003', '{"type": "STAKE_HOLD", "userId": "d1000000-0000-0000-0000-000000000003"}'::jsonb),
  ('ee100000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 6000, 'c1000000-0000-0000-0000-000000000004', '{"type": "STAKE_HOLD", "userId": "d1000000-0000-0000-0000-000000000004"}'::jsonb),
  ('ee100000-0000-0000-0000-000000000005', 'a1000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', 2000, 'c1000000-0000-0000-0000-000000000005', '{"type": "STAKE_HOLD", "userId": "d1000000-0000-0000-0000-000000000005"}'::jsonb),
  ('ee100000-0000-0000-0000-000000000006', 'a1000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000001', 3500, 'c1000000-0000-0000-0000-000000000006', '{"type": "STAKE_HOLD", "userId": "d1000000-0000-0000-0000-000000000006"}'::jsonb),
  ('ee100000-0000-0000-0000-000000000007', 'a1000000-0000-0000-0000-000000000007', 'a0000000-0000-0000-0000-000000000001', 4500, 'c1000000-0000-0000-0000-000000000008', '{"type": "STAKE_HOLD", "userId": "d1000000-0000-0000-0000-000000000007"}'::jsonb),
  ('ee100000-0000-0000-0000-000000000008', 'a1000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 1500, 'c1000000-0000-0000-0000-00000000000a', '{"type": "STAKE_HOLD", "userId": "d1000000-0000-0000-0000-000000000001"}'::jsonb),
  -- Completed contract: stake returned to Marlow
  ('ee100000-0000-0000-0000-000000000009', 'a0000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000007', 5000, 'c1000000-0000-0000-0000-000000000007', '{"type": "STAKE_RETURN", "outcome": "COMPLETED"}'::jsonb),
  -- Failed contract: stake forfeited to revenue
  ('ee100000-0000-0000-0000-00000000000a', 'a0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000002', 3000, 'c1000000-0000-0000-0000-000000000009', '{"type": "STAKE_FORFEIT", "outcome": "FAILED"}'::jsonb)
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- Waitlists (Circle Alpha funnel)
-- ---------------------------------------------------------------------------
-- In-app cohort fill queue (036): registered users waiting for the next pod
INSERT INTO waitlist_entries (id, user_id, cohort_id, pod_id, display_alias, position, enrolled) VALUES
  ('aa100000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000006', 'cohort-2026-08', NULL, 'Indigo', 1, FALSE),
  ('aa100000-0000-0000-0000-000000000002', 'd1000000-0000-0000-0000-000000000007', 'cohort-2026-08', NULL, 'Marlow', 2, FALSE),
  ('aa100000-0000-0000-0000-000000000003', 'd1000000-0000-0000-0000-000000000005', 'cohort-2026-08', NULL, 'Sage',   3, FALSE)
ON CONFLICT DO NOTHING;

-- Public landing-page prospects (041, email-keyed, not yet registered)
INSERT INTO beta_waitlist (id, email, email_normalized, name, goal, platform, source, channel, status, confirmation_token, confirmed_at, admitted_at) VALUES
  ('ba100000-0000-0000-0000-000000000001', 'Nadia.K@example.com',    'nadia.k@example.com',    'Nadia',  'no-contact after a 4-year relationship',  'ios', 'do-not-text-tonight', 'organic',      'confirmed', 'demo-confirm-token-0001', NOW() - INTERVAL '3 days', NULL),
  ('ba100000-0000-0000-0000-000000000002', 'theo@example.com',       'theo@example.com',       'Theo',   'stop late-night check-ins on her profile','ios', 'creator-styxtok',     'creator',      'pending',   'demo-confirm-token-0002', NULL,                      NULL),
  ('ba100000-0000-0000-0000-000000000003', 'jules.r@example.com',    'jules.r@example.com',    'Jules',  'referred by my therapist',                'ios', 'practitioner-moira',  'practitioner', 'admitted',  'demo-confirm-token-0003', NOW() - INTERVAL '9 days', NOW() - INTERVAL '2 days'),
  ('ba100000-0000-0000-0000-000000000004', 'sam.ellery@example.com', 'sam.ellery@example.com', 'Sam',    'no-contact, 60 days this time',           'ios', 'referral',            'referral',     'pending',   'demo-confirm-token-0004', NULL,                      NULL)
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- Pod broadcast log (Circle Delta): a dampened failure signal in the pod
-- ---------------------------------------------------------------------------
INSERT INTO pod_broadcast_log (id, pod_id, cohort_id, user_id, failure_type, failure_count, dampened, broadcasted_at) VALUES
  ('bb100000-0000-0000-0000-000000000001', 'pod-cerberus', 'cohort-2026-07', 'd1000000-0000-0000-0000-000000000002', 'MISSED_ATTESTATION', 1, TRUE, NOW() - INTERVAL '7 days')
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- Notifications
-- ---------------------------------------------------------------------------
INSERT INTO notifications (id, user_id, type, title, body, read, metadata) VALUES
  ('dd100000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000001', 'STREAK_MILESTONE',     '21 days of no contact',              'Three full weeks. Your pod cosigned yesterday''s attestation.',          FALSE, '{"contractId": "c1000000-0000-0000-0000-000000000001", "streak": 21}'::jsonb),
  ('dd100000-0000-0000-0000-000000000002', 'd1000000-0000-0000-0000-000000000005', 'ATTESTATION_REMINDER', 'Today''s check-in is waiting',        'Attest before midnight to keep your 5-day streak alive.',                FALSE, '{"contractId": "c1000000-0000-0000-0000-000000000005"}'::jsonb),
  ('dd100000-0000-0000-0000-000000000003', 'd1000000-0000-0000-0000-000000000002', 'POD_BROADCAST',        'Your pod has your back',             'A pod member had a hard night. Check-in rhythm continues.',              TRUE,  '{"podId": "pod-cerberus"}'::jsonb),
  ('dd100000-0000-0000-0000-000000000004', 'd1000000-0000-0000-0000-000000000008', 'FURY_ASSIGNMENT',      'New proof awaiting audit',           'A screentime proof entered your queue. Verdict due within 24h.',         FALSE, '{"proofId": "b1000000-0000-0000-0000-000000000001"}'::jsonb),
  ('dd100000-0000-0000-0000-000000000005', 'd1000000-0000-0000-0000-000000000009', 'FURY_ASSIGNMENT',      'New proof awaiting audit',           'A screentime proof entered your queue. Verdict due within 24h.',         FALSE, '{"proofId": "b1000000-0000-0000-0000-000000000001"}'::jsonb),
  ('dd100000-0000-0000-0000-000000000006', 'd1000000-0000-0000-0000-00000000000a', 'FURY_ASSIGNMENT',      'New proof awaiting audit',           'A screentime proof entered your queue. Verdict due within 24h.',         FALSE, '{"proofId": "b1000000-0000-0000-0000-000000000001"}'::jsonb),
  ('dd100000-0000-0000-0000-000000000007', 'd1000000-0000-0000-0000-00000000000b', 'PRACTITIONER_ALERT',   'Client risk trend changed',          'One of your assigned clients moved from GREEN to YELLOW this week.',     FALSE, '{"clientId": "d1000000-0000-0000-0000-000000000002"}'::jsonb),
  ('dd100000-0000-0000-0000-000000000008', 'd1000000-0000-0000-0000-00000000000c', 'ENTERPRISE_DIGEST',    'Acheron weekly compliance digest',   'Completion rate steady. One failed contract closed out this period.',    TRUE,  '{"enterpriseId": "e0000000-0000-0000-0000-000000000001"}'::jsonb),
  ('dd100000-0000-0000-0000-000000000009', 'd1000000-0000-0000-0000-000000000006', 'WAITLIST_POSITION',    'You are #1 for the August cohort',   'The next pod forms when the cohort reaches minimum enrollment.',         FALSE, '{"cohortId": "cohort-2026-08", "position": 1}'::jsonb)
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- Truth log (append-only event chain; demo hashes)
-- ---------------------------------------------------------------------------
INSERT INTO event_log (id, event_type, payload, previous_hash, current_hash) VALUES
  ('e1100000-0000-0000-0000-000000000001', 'POD_FORMED',       '{"podId": "pod-cerberus", "cohortId": "cohort-2026-07", "members": 5}'::jsonb,                                              'f6e5d4c3b2a1', '1a2b3c4d5e6f'),
  ('e1100000-0000-0000-0000-000000000002', 'CONTRACT_CREATED', '{"contractId": "c1000000-0000-0000-0000-000000000001", "userId": "d1000000-0000-0000-0000-000000000001", "stakeAmount": 40}'::jsonb, '1a2b3c4d5e6f', '6f5e4d3c2b1a'),
  ('e1100000-0000-0000-0000-000000000003', 'PROOF_SUBMITTED',  '{"proofId": "b1000000-0000-0000-0000-000000000001", "contractId": "c1000000-0000-0000-0000-00000000000a"}'::jsonb,          '6f5e4d3c2b1a', 'abc123def456')
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- Practitioner tier (Circle Omega)
-- practitioner_client_assignments / practitioner_alerts are introduced by the
-- practitioner-intelligence migration, which may not have landed yet in a
-- given checkout. Guard on table existence so this seed works on either side
-- of that migration; re-run it after migrating to pick these rows up.
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF to_regclass('public.practitioner_client_assignments') IS NOT NULL THEN
    INSERT INTO practitioner_client_assignments (practitioner_id, client_id, active)
    SELECT v.practitioner_id::uuid, v.client_id::uuid, TRUE
    FROM (VALUES
      ('d1000000-0000-0000-0000-00000000000b', 'd1000000-0000-0000-0000-000000000001'),
      ('d1000000-0000-0000-0000-00000000000b', 'd1000000-0000-0000-0000-000000000002'),
      ('d1000000-0000-0000-0000-00000000000b', 'd1000000-0000-0000-0000-000000000005'),
      ('d1000000-0000-0000-0000-00000000000b', 'd1000000-0000-0000-0000-000000000006')
    ) AS v(practitioner_id, client_id)
    WHERE NOT EXISTS (
      SELECT 1 FROM practitioner_client_assignments pca
      WHERE pca.practitioner_id = v.practitioner_id::uuid
        AND pca.client_id = v.client_id::uuid
    );
  END IF;

  IF to_regclass('public.practitioner_alerts') IS NOT NULL THEN
    INSERT INTO practitioner_alerts (practitioner_id, client_id, alert_type, excerpt, severity, created_at)
    SELECT v.practitioner_id::uuid, v.client_id::uuid, v.alert_type, v.excerpt, v.severity, v.created_at
    FROM (VALUES
      ('d1000000-0000-0000-0000-00000000000b', 'd1000000-0000-0000-0000-000000000002', 'RATIONALIZATION',      'just one more time', 'MEDIUM', NOW() - INTERVAL '2 days'),
      ('d1000000-0000-0000-0000-00000000000b', 'd1000000-0000-0000-0000-000000000006', 'DISTRESS_ESCALATION',  'falling apart',      'HIGH',   NOW() - INTERVAL '1 day'),
      ('d1000000-0000-0000-0000-00000000000b', 'd1000000-0000-0000-0000-000000000005', 'TRIGGER_MENTION',      'saw them at the cafe near work', 'LOW', NOW() - INTERVAL '3 days')
    ) AS v(practitioner_id, client_id, alert_type, excerpt, severity, created_at)
    WHERE NOT EXISTS (
      SELECT 1 FROM practitioner_alerts pa
      WHERE pa.practitioner_id = v.practitioner_id::uuid
        AND pa.client_id = v.client_id::uuid
        AND pa.alert_type = v.alert_type
    );
  END IF;
END $$;
