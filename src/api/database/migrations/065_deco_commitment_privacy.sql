-- DECO commitments must not store the plaintext they commit to: a row holding
-- url + selector + expected_value next to the hash reveals exactly the value
-- the commitment is meant to conceal, and survives user deletion (the FK only
-- nulls user_id). Keep the hash, the timestamp it was computed over (so a claim
-- can be re-hashed and checked), and the domain for operational triage.

ALTER TABLE deco_commitments ADD COLUMN IF NOT EXISTS domain TEXT;
ALTER TABLE deco_commitments ADD COLUMN IF NOT EXISTS committed_at TEXT;

-- Backfill the domain from any existing plaintext before dropping it.
-- Dynamic SQL on purpose: a plain UPDATE referencing url fails at PARSE time
-- once the column is dropped — the runtime EXISTS guard never gets a say — so
-- an idempotent replay of this file (baseline-drift repair) would error. The
-- EXECUTE defers parsing until the guard has confirmed the column exists.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
     WHERE table_name = 'deco_commitments' AND column_name = 'url'
  ) THEN
    EXECUTE $q$
      UPDATE deco_commitments
         SET domain = NULLIF(SPLIT_PART(SPLIT_PART(url, '://', 2), '/', 1), '')
       WHERE domain IS NULL
    $q$;
  END IF;
END $$;

ALTER TABLE deco_commitments DROP COLUMN IF EXISTS url;
ALTER TABLE deco_commitments DROP COLUMN IF EXISTS selector;
ALTER TABLE deco_commitments DROP COLUMN IF EXISTS expected_value;
