-- Styx Development Seed Data
-- Populates a fresh database with demo users, accounts, contracts, and fury assignments.
-- All IDs are valid UUIDs (hex only: 0-9, a-f).

-- System accounts (double-entry ledger requires these)
INSERT INTO accounts (id, name, type) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'SYSTEM_ESCROW', 'LIABILITY'),
  ('a0000000-0000-0000-0000-000000000002', 'SYSTEM_REVENUE', 'REVENUE')
ON CONFLICT (name) DO NOTHING;

-- User accounts (personal ledger accounts)
INSERT INTO accounts (id, name, type) VALUES
  ('a0000000-0000-0000-0000-000000000010', 'USER_demo', 'ASSET'),
  ('a0000000-0000-0000-0000-000000000011', 'USER_fury', 'ASSET'),
  ('a0000000-0000-0000-0000-000000000012', 'USER_admin', 'ASSET')
ON CONFLICT (name) DO NOTHING;

-- Demo users (password: demo-password-123, bcrypt cost 10) -- allow-secret
INSERT INTO users (id, email, password_hash, stripe_customer_id, integrity_score, account_id, role, enterprise_id, status) VALUES
  ('d0000000-0000-0000-0000-000000000001', 'demo@styx.protocol', '$2b$10$Qvqvkece7/TpoSbDjHr75eHpT7blt9.4dwoub11ClSk2/PCk4tehe', 'cus_demo_001', 75, 'a0000000-0000-0000-0000-000000000010', 'USER', 'e0000000-0000-0000-0000-000000000001', 'ACTIVE'),
  ('d0000000-0000-0000-0000-000000000002', 'fury@styx.protocol', '$2b$10$Qvqvkece7/TpoSbDjHr75eHpT7blt9.4dwoub11ClSk2/PCk4tehe', 'cus_fury_001', 90, 'a0000000-0000-0000-0000-000000000011', 'FURY', 'e0000000-0000-0000-0000-000000000001', 'ACTIVE'),
  ('d0000000-0000-0000-0000-000000000003', 'admin@styx.protocol', '$2b$10$Qvqvkece7/TpoSbDjHr75eHpT7blt9.4dwoub11ClSk2/PCk4tehe', 'cus_admin_001', 200, 'a0000000-0000-0000-0000-000000000012', 'ADMIN', 'e0000000-0000-0000-0000-000000000001', 'ACTIVE')
ON CONFLICT (id) DO NOTHING;

-- Contracts in different states
INSERT INTO contracts (id, user_id, oath_category, verification_method, stake_amount, payment_intent_id, duration_days, status, started_at, ends_at) VALUES
  (
    'c0000000-0000-0000-0000-000000000001',
    'd0000000-0000-0000-0000-000000000001',
    'BIOLOGICAL_CARDIO',
    'HEALTHKIT',
    50.00,
    'pi_demo_001',
    30,
    'ACTIVE',
    NOW(),
    NOW() + INTERVAL '30 days'
  ),
  (
    'c0000000-0000-0000-0000-000000000002',
    'd0000000-0000-0000-0000-000000000001',
    'COGNITIVE_FOCUS',
    'SCREENTIME',
    25.00,
    'pi_demo_002',
    14,
    'COMPLETED',
    NOW() - INTERVAL '14 days',
    NOW()
  )
ON CONFLICT (id) DO NOTHING;

-- A proof with pending fury assignments
INSERT INTO proofs (id, contract_id, user_id, media_uri, status) VALUES
  (
    'b0000000-0000-0000-0000-000000000001',
    'c0000000-0000-0000-0000-000000000001',
    'd0000000-0000-0000-0000-000000000001',
    'https://styx-fury-proofs.r2.dev/demo/proof-001.mp4',
    'PENDING_REVIEW'
  )
ON CONFLICT (id) DO NOTHING;

-- Fury assignments for the proof
INSERT INTO fury_assignments (id, proof_id, fury_user_id) VALUES
  ('fa000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000002'),
  ('fa000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000003')
ON CONFLICT (id) DO NOTHING;

-- Seed ledger entries for the active contract stake
INSERT INTO entries (id, debit_account_id, credit_account_id, amount, contract_id, metadata) VALUES
  (
    'ee000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000010',
    'a0000000-0000-0000-0000-000000000001',
    50.00,
    'c0000000-0000-0000-0000-000000000001',
    '{"type": "STAKE_HOLD", "userId": "d0000000-0000-0000-0000-000000000001"}'::jsonb
  ),
  (
    'ee000000-0000-0000-0000-000000000002',
    'a0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000010',
    25.00,
    'c0000000-0000-0000-0000-000000000002',
    '{"type": "STAKE_RETURN", "outcome": "COMPLETED"}'::jsonb
  )
ON CONFLICT (id) DO NOTHING;

-- System account: Fury Bounty Pool (needed for bounty disbursement)
INSERT INTO accounts (id, name, type) VALUES
  ('a0000000-0000-0000-0000-000000000003', 'FURY_BOUNTY_POOL', 'LIABILITY')
ON CONFLICT (name) DO NOTHING;

-- Recovery contract: ACTIVE no-contact (30 days, started 10 days ago)
INSERT INTO contracts (id, user_id, oath_category, verification_method, stake_amount, payment_intent_id, duration_days, status, started_at, ends_at) VALUES
  (
    'c0000000-0000-0000-0000-000000000003',
    'd0000000-0000-0000-0000-000000000001',
    'RECOVERY_NO_CONTACT_TEXT',
    'SELF_REPORT',
    30.00,
    'pi_demo_003',
    30,
    'ACTIVE',
    NOW() - INTERVAL '10 days',
    NOW() + INTERVAL '20 days'
  )
ON CONFLICT (id) DO NOTHING;

-- Recovery contract: COMPLETED lifecycle example (30 days, finished 5 days ago)
INSERT INTO contracts (id, user_id, oath_category, verification_method, stake_amount, payment_intent_id, duration_days, status, started_at, ends_at) VALUES
  (
    'c0000000-0000-0000-0000-000000000004',
    'd0000000-0000-0000-0000-000000000001',
    'RECOVERY_NO_CONTACT_TEXT',
    'SELF_REPORT',
    20.00,
    'pi_demo_004',
    30,
    'COMPLETED',
    NOW() - INTERVAL '35 days',
    NOW() - INTERVAL '5 days'
  )
ON CONFLICT (id) DO NOTHING;

-- Accountability partner for the active recovery contract
INSERT INTO accountability_partners (id, contract_id, partner_user_id, partner_email, status, invited_at, accepted_at) VALUES
  (
    'ab000000-0000-0000-0000-000000000001',
    'c0000000-0000-0000-0000-000000000003',
    'd0000000-0000-0000-0000-000000000002',
    'fury@styx.protocol',
    'ACTIVE',
    NOW() - INTERVAL '10 days',
    NOW() - INTERVAL '9 days'
  )
ON CONFLICT (id) DO NOTHING;

-- Attestation rows for active recovery contract: realistic 10-day streak
-- Days 1-8: ATTESTED (cosigned by partner for some)
INSERT INTO attestations (id, contract_id, user_id, attestation_date, attested_at, cosigned_by, cosigned_at, status) VALUES
  ('ae000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000001', CURRENT_DATE - 9, NOW() - INTERVAL '9 days', 'd0000000-0000-0000-0000-000000000002', NOW() - INTERVAL '9 days' + INTERVAL '2 hours', 'COSIGNED'),
  ('ae000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000001', CURRENT_DATE - 8, NOW() - INTERVAL '8 days', 'd0000000-0000-0000-0000-000000000002', NOW() - INTERVAL '8 days' + INTERVAL '1 hour', 'COSIGNED'),
  ('ae000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000001', CURRENT_DATE - 7, NOW() - INTERVAL '7 days', NULL, NULL, 'ATTESTED'),
  ('ae000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000001', CURRENT_DATE - 6, NOW() - INTERVAL '6 days', 'd0000000-0000-0000-0000-000000000002', NOW() - INTERVAL '6 days' + INTERVAL '3 hours', 'COSIGNED'),
  ('ae000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000001', CURRENT_DATE - 5, NOW() - INTERVAL '5 days', NULL, NULL, 'ATTESTED'),
  ('ae000000-0000-0000-0000-000000000006', 'c0000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000001', CURRENT_DATE - 4, NOW() - INTERVAL '4 days', NULL, NULL, 'ATTESTED'),
  -- Day 7: MISSED (gap in streak, represents a realistic scenario)
  ('ae000000-0000-0000-0000-000000000007', 'c0000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000001', CURRENT_DATE - 3, NULL, NULL, NULL, 'MISSED'),
  -- Days 8-9: Recovered streak
  ('ae000000-0000-0000-0000-000000000008', 'c0000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000001', CURRENT_DATE - 2, NOW() - INTERVAL '2 days', NULL, NULL, 'ATTESTED'),
  ('ae000000-0000-0000-0000-000000000009', 'c0000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000001', CURRENT_DATE - 1, NOW() - INTERVAL '1 day', 'd0000000-0000-0000-0000-000000000002', NOW() - INTERVAL '1 day' + INTERVAL '4 hours', 'COSIGNED'),
  -- Today: PENDING (not yet attested — realistic for a tester opening the app)
  ('ae000000-0000-0000-0000-000000000010', 'c0000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000001', CURRENT_DATE, NULL, NULL, NULL, 'PENDING')
ON CONFLICT (contract_id, attestation_date) DO NOTHING;

-- Seed truth log entries
INSERT INTO event_log (id, event_type, payload, previous_hash, current_hash) VALUES
  (
    'e1000000-0000-0000-0000-000000000001',
    'CONTRACT_CREATED',
    '{"contractId": "c0000000-0000-0000-0000-000000000001", "userId": "d0000000-0000-0000-0000-000000000001", "stakeAmount": 50}'::jsonb,
    'GENESIS',
    'a1b2c3d4e5f6'
  ),
  (
    'e1000000-0000-0000-0000-000000000002',
    'PROOF_SUBMITTED',
    '{"proofId": "b0000000-0000-0000-0000-000000000001", "contractId": "c0000000-0000-0000-0000-000000000001"}'::jsonb,
    'a1b2c3d4e5f6',
    'f6e5d4c3b2a1'
  )
ON CONFLICT (id) DO NOTHING;
