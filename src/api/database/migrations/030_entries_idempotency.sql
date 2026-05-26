-- Migration 030: Ledger entry idempotency key
-- PM4: the previous finalize path relied on a TOCTOU check (entryExists() then
-- recordTransaction()) with no DB-level uniqueness, so two concurrent settlement
-- workers (concurrency 2 / stale-PROCESSING reclaim) could both pass the existence
-- check and both INSERT, double-posting ledger entries (phantom money).
--
-- We add a nullable idempotency_key so callers that supply one get a single-posting
-- guarantee enforced by the database (INSERT ... ON CONFLICT (idempotency_key) DO
-- NOTHING). The column is nullable and the unique index is partial (WHERE
-- idempotency_key IS NOT NULL) so existing/legacy postings that omit a key are
-- unaffected and multiple NULL keys remain allowed.

ALTER TABLE entries
  ADD COLUMN IF NOT EXISTS idempotency_key TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_entries_idempotency_key
  ON entries (idempotency_key)
  WHERE idempotency_key IS NOT NULL;
