-- Styx Development Seed Data
-- Populates a fresh database with demo users, accounts, contracts, and fury assignments.

-- System accounts (double-entry ledger requires these)
INSERT INTO accounts (id, name, type) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'SYSTEM_ESCROW', 'LIABILITY'),
  ('a0000000-0000-0000-0000-000000000002', 'SYSTEM_REVENUE', 'REVENUE')
ON CONFLICT (name) DO NOTHING;

-- User accounts (personal ledger accounts)
INSERT INTO accounts (id, name, type) VALUES
  ('a0000000-0000-0000-0000-000000000010', 'USER_demo-user-001', 'ASSET'),
  ('a0000000-0000-0000-0000-000000000011', 'USER_fury-user-001', 'ASSET'),
  ('a0000000-0000-0000-0000-000000000012', 'USER_admin-001', 'ASSET')
ON CONFLICT (name) DO NOTHING;

-- Demo users
INSERT INTO users (id, email, stripe_customer_id, integrity_score, account_id, status) VALUES
  ('demo-user-001', 'demo@styx.protocol', 'cus_demo_001', 75, 'a0000000-0000-0000-0000-000000000010', 'ACTIVE'),
  ('fury-user-001', 'fury@styx.protocol', 'cus_fury_001', 90, 'a0000000-0000-0000-0000-000000000011', 'ACTIVE'),
  ('admin-001', 'admin@styx.protocol', 'cus_admin_001', 200, 'a0000000-0000-0000-0000-000000000012', 'ACTIVE')
ON CONFLICT (id) DO NOTHING;

-- Contracts in different states
INSERT INTO contracts (id, user_id, oath_category, verification_method, stake_amount, payment_intent_id, duration_days, status, started_at, ends_at) VALUES
  (
    'c0000000-0000-0000-0000-000000000001',
    'demo-user-001',
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
    'demo-user-001',
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
    'p0000000-0000-0000-0000-000000000001',
    'c0000000-0000-0000-0000-000000000001',
    'demo-user-001',
    'https://styx-fury-proofs.r2.dev/demo/proof-001.mp4',
    'PENDING_REVIEW'
  )
ON CONFLICT (id) DO NOTHING;

-- Fury assignments for the proof
INSERT INTO fury_assignments (id, proof_id, fury_user_id) VALUES
  ('f0000000-0000-0000-0000-000000000001', 'p0000000-0000-0000-0000-000000000001', 'fury-user-001'),
  ('f0000000-0000-0000-0000-000000000002', 'p0000000-0000-0000-0000-000000000001', 'admin-001')
ON CONFLICT (id) DO NOTHING;

-- Seed ledger entries for the active contract stake
INSERT INTO entries (id, debit_account_id, credit_account_id, amount, contract_id, metadata) VALUES
  (
    'e0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000010',
    'a0000000-0000-0000-0000-000000000001',
    50.00,
    'c0000000-0000-0000-0000-000000000001',
    '{"type": "STAKE_HOLD", "userId": "demo-user-001"}'::jsonb
  ),
  (
    'e0000000-0000-0000-0000-000000000002',
    'a0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000010',
    25.00,
    'c0000000-0000-0000-0000-000000000002',
    '{"type": "STAKE_RETURN", "outcome": "COMPLETED"}'::jsonb
  )
ON CONFLICT (id) DO NOTHING;

-- Seed truth log entries
INSERT INTO event_log (id, event_type, payload, previous_hash, current_hash) VALUES
  (
    'l0000000-0000-0000-0000-000000000001',
    'CONTRACT_CREATED',
    '{"contractId": "c0000000-0000-0000-0000-000000000001", "userId": "demo-user-001", "stakeAmount": 50}'::jsonb,
    'GENESIS',
    'a1b2c3d4e5f6'
  ),
  (
    'l0000000-0000-0000-0000-000000000002',
    'PROOF_SUBMITTED',
    '{"proofId": "p0000000-0000-0000-0000-000000000001", "contractId": "c0000000-0000-0000-0000-000000000001"}'::jsonb,
    'a1b2c3d4e5f6',
    'f6e5d4c3b2a1'
  )
ON CONFLICT (id) DO NOTHING;
