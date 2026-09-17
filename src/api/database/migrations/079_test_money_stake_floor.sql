-- Relax the contracts stake floor from >0 to >=0 on the test-money rail.
-- The DTO and TierGuard were updated in PR #938 but the DB constraint was
-- not migrated.  $0-escrow contracts are now valid on the test-money rail.
ALTER TABLE contracts DROP CONSTRAINT IF EXISTS contracts_stake_amount_check;
ALTER TABLE contracts ADD CONSTRAINT contracts_stake_amount_check CHECK (stake_amount >= 0);
