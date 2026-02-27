-- 008_age_gate_terms_acceptance:
-- Add fields for age verification gate and Terms of Service acceptance.
-- Both are P0 legal requirements for public beta.

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS date_of_birth DATE;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMPTZ;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS terms_version TEXT;
