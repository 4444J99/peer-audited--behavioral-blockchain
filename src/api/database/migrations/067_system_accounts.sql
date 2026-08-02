-- Migration 067: Ledger system accounts in the migration chain
-- SYSTEM_ESCROW / SYSTEM_REVENUE previously existed only in seed.sql, which the
-- dev:migrate path never runs — so a fresh `createdb + npm run dev:migrate` had
-- no escrow account and the ledger escrow rail could not take custody. These are
-- ledger schema, not demo data, so make the canonical system accounts part of the
-- chain. Fixed ids match seed.sql so both provisioning paths agree; accounts.name
-- is the canonical lookup key (UNIQUE from 001) and stays authoritative.

INSERT INTO accounts (id, name, type) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'SYSTEM_ESCROW', 'LIABILITY'),
  ('a0000000-0000-0000-0000-000000000002', 'SYSTEM_REVENUE', 'REVENUE')
ON CONFLICT (name) DO NOTHING;
