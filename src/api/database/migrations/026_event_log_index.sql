-- TKT-P1-026: Add sequence index to event_log for Theorem 2 implementation.
-- Ensures strict sequential integrity and simplifies hash preimage construction.

ALTER TABLE event_log ADD COLUMN IF NOT EXISTS sequence_index BIGSERIAL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_event_log_sequence ON event_log(sequence_index);

-- Update the immutability trigger to include the new column
DROP TRIGGER IF EXISTS trg_event_log_immutable ON event_log;

CREATE OR REPLACE FUNCTION prevent_event_log_mutation()
RETURNS TRIGGER AS $$
BEGIN
  -- We allow the initial sequence_index generation but prohibit any subsequent changes.
  IF (TG_OP = 'UPDATE') THEN
    RAISE EXCEPTION 'event_log is immutable: UPDATE is prohibited';
  END IF;
  IF (TG_OP = 'DELETE') THEN
    RAISE EXCEPTION 'event_log is immutable: DELETE is prohibited';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_event_log_immutable
  BEFORE UPDATE OR DELETE ON event_log
  FOR EACH ROW EXECUTE FUNCTION prevent_event_log_mutation();
