-- DECO commitments must not store the plaintext they commit to: a row holding
-- url + selector + expected_value next to the hash reveals exactly the value
-- the commitment is meant to conceal, and survives user deletion (the FK only
-- nulls user_id). Keep the hash, the timestamp it was computed over (so a claim
-- can be re-hashed and checked), and the domain for operational triage.

ALTER TABLE deco_commitments ADD COLUMN IF NOT EXISTS domain TEXT;
ALTER TABLE deco_commitments ADD COLUMN IF NOT EXISTS committed_at TEXT;

-- Backfill the domain from any existing plaintext before dropping it.
UPDATE deco_commitments
   SET domain = NULLIF(SPLIT_PART(SPLIT_PART(url, '://', 2), '/', 1), '')
 WHERE domain IS NULL
   AND EXISTS (
     SELECT 1 FROM information_schema.columns
      WHERE table_name = 'deco_commitments' AND column_name = 'url'
   );

ALTER TABLE deco_commitments DROP COLUMN IF EXISTS url;
ALTER TABLE deco_commitments DROP COLUMN IF EXISTS selector;
ALTER TABLE deco_commitments DROP COLUMN IF EXISTS expected_value;
