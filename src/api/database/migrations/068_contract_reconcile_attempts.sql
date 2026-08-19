-- 068: Track reconciliation attempts on stuck contracts.
--
-- The admin sweep (`reconcileStuckContracts`) reclaims contracts left in
-- RECONCILE_REQUIRED by transient failures (dead-lettered holds, phase-B
-- finalize failures, compensation hiccups). It must not retry forever, so each
-- contract counts its attempts here and stops at a ceiling (5). Once a contract
-- is moved to a terminal state (STAKE_FAILED / RECONCILED) it falls out of the
-- sweep's target set regardless of the count.

ALTER TABLE contracts
    ADD COLUMN IF NOT EXISTS reconcile_attempts INTEGER NOT NULL DEFAULT 0;
