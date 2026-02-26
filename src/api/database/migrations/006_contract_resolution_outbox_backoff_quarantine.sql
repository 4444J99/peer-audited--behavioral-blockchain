-- 006_contract_resolution_outbox_backoff_quarantine:
-- Adds retry scheduling + quarantine metadata so permanently failing settlement
-- side effects are retried with exponential backoff and eventually surfaced.

ALTER TABLE contract_resolution_side_effects
  ADD COLUMN IF NOT EXISTS next_retry_at TIMESTAMPTZ;

ALTER TABLE contract_resolution_side_effects
  ADD COLUMN IF NOT EXISTS quarantined_at TIMESTAMPTZ;

ALTER TABLE contract_resolution_side_effects
  ADD COLUMN IF NOT EXISTS quarantine_reason TEXT;

-- Existing failed rows should be eligible for retry immediately after migration.
UPDATE contract_resolution_side_effects
SET next_retry_at = NOW()
WHERE status = 'FAILED' AND next_retry_at IS NULL;

ALTER TABLE contract_resolution_side_effects
  DROP CONSTRAINT IF EXISTS chk_contract_resolution_effect_status;

ALTER TABLE contract_resolution_side_effects
  ADD CONSTRAINT chk_contract_resolution_effect_status
  CHECK (status IN ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'QUARANTINED'));

CREATE INDEX IF NOT EXISTS idx_contract_resolution_effects_retry_due
  ON contract_resolution_side_effects (status, next_retry_at)
  WHERE status = 'FAILED';

CREATE INDEX IF NOT EXISTS idx_contract_resolution_effects_quarantined
  ON contract_resolution_side_effects (status, quarantined_at)
  WHERE status = 'QUARANTINED';
