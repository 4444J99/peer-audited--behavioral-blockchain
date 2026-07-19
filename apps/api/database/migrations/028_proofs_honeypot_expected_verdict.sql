-- Migration 028: Honeypot Expected Verdict on proofs
-- The HoneypotService persists each synthetic proof's known-correct verdict
-- (honeypot.service.ts INSERTs 'FAIL' for a known-fail/BREACH honeypot), and the
-- FuryWorker reads it back during consensus resolution to grade reviewers against
-- the honeypot's expected result. The column was never declared in the schema, so
-- on a schema-accurate DB the finalization SELECT threw "column does not exist",
-- killing all consensus resolution. Add the column so both writer and reader agree.
--
-- NULL for real (non-honeypot) proofs; only meaningful when is_honeypot = TRUE.

ALTER TABLE proofs ADD COLUMN IF NOT EXISTS honeypot_expected_verdict TEXT;
