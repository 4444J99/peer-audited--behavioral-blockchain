-- Migration 072: provider-independent evidence records for consequential agent actions.
--
-- This table is intentionally append-only. It records proposals, policy and
-- approval decisions, externally-executed mutation receipts, verification,
-- rollback, disputes, and peer review. It does not grant authority or execute
-- any mutation itself.

CREATE TABLE IF NOT EXISTS agent_action_evidence_events (
  id UUID PRIMARY KEY,
  schema_version TEXT NOT NULL DEFAULT 'organvm.execution/v1'
    CHECK (schema_version = 'organvm.execution/v1'),
  execution_id TEXT NOT NULL
    CHECK (char_length(execution_id) BETWEEN 1 AND 200),
  sequence_index BIGINT NOT NULL
    CHECK (sequence_index > 0),
  event_type TEXT NOT NULL CHECK (event_type IN (
    'PROPOSED',
    'APPROVAL_RECORDED',
    'MUTATION_RECORDED',
    'VERIFICATION_RECORDED',
    'ROLLBACK_RECORDED',
    'DISPUTE_OPENED',
    'PEER_REVIEW_RECORDED'
  )),
  producer TEXT NOT NULL
    CHECK (char_length(producer) BETWEEN 1 AND 100),
  recorded_by TEXT NOT NULL
    CHECK (char_length(recorded_by) BETWEEN 1 AND 200),
  payload JSONB NOT NULL,
  previous_event_hash CHAR(64) NOT NULL,
  event_hash CHAR(64) NOT NULL UNIQUE,
  truth_log_event_id UUID NOT NULL REFERENCES event_log(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL,
  UNIQUE (execution_id, sequence_index)
);

CREATE INDEX IF NOT EXISTS idx_agent_action_evidence_execution
  ON agent_action_evidence_events (execution_id, sequence_index);
CREATE INDEX IF NOT EXISTS idx_agent_action_evidence_type_created
  ON agent_action_evidence_events (event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_action_evidence_recorded_by
  ON agent_action_evidence_events (recorded_by, created_at DESC);

CREATE OR REPLACE FUNCTION prevent_agent_action_evidence_mutation()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'agent_action_evidence_events is immutable: UPDATE and DELETE are prohibited';
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'trg_agent_action_evidence_immutable'
      AND tgrelid = 'agent_action_evidence_events'::regclass
  ) THEN
    CREATE TRIGGER trg_agent_action_evidence_immutable
      BEFORE UPDATE OR DELETE ON agent_action_evidence_events
      FOR EACH ROW EXECUTE FUNCTION prevent_agent_action_evidence_mutation();
  END IF;
END;
$$;

COMMENT ON TABLE agent_action_evidence_events IS
  'Append-only, provider-independent evidence for agent action proposals, approvals, mutation receipts, verification, rollback, disputes, and peer review. Recording never executes the action.';
COMMENT ON COLUMN agent_action_evidence_events.payload IS
  'Versioned event payload. Raw credentials, tokens, authorization headers, cookies, and private keys are prohibited by the service boundary.';
COMMENT ON COLUMN agent_action_evidence_events.truth_log_event_id IS
  'Tamper-evident anchor in event_log; only identifiers and digests are copied into the global truth log.';
