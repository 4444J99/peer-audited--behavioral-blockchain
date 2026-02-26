-- 005_contract_resolution_outbox: transactional side-effect queue for contract settlements
-- Ensures external/internal side effects (Stripe, ledger, truth log, notifications)
-- are enqueued atomically with contract status updates and retried idempotently.

CREATE TABLE IF NOT EXISTS contract_resolution_side_effects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  outcome TEXT NOT NULL,
  effect_type TEXT NOT NULL,
  dedupe_key TEXT NOT NULL UNIQUE,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'PENDING',
  attempts INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  locked_at TIMESTAMPTZ,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_contract_resolution_effect_status
    CHECK (status IN ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'))
);

CREATE INDEX IF NOT EXISTS idx_contract_resolution_effects_contract
  ON contract_resolution_side_effects (contract_id, created_at);

CREATE INDEX IF NOT EXISTS idx_contract_resolution_effects_status
  ON contract_resolution_side_effects (status, created_at);
