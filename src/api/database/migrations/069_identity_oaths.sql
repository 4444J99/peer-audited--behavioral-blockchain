-- 069: Identity-based oath onboarding (TKT-P1-016).
--
-- Onboarding asks who the user is becoming, not what they will do, and that
-- declaration is what the contract is bound to. It is stored per user per oath
-- category so a resumed onboarding session reads back the same identity, and
-- the unique constraint makes re-declaring an update rather than a second row.
--
-- `copy_variant` is the activation-copy arm the pledge was composed under. It is
-- persisted rather than re-derived at read time so a later change to the
-- assignment function can never rewrite the sentence a user already agreed to.

CREATE TABLE IF NOT EXISTS user_identity_oaths (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  oath_category TEXT NOT NULL,
  archetype_id TEXT NOT NULL,
  identity_label TEXT NOT NULL,
  pledge_copy TEXT NOT NULL,
  copy_variant TEXT NOT NULL,
  -- NULL while the identity step is still open; stamped once, on completion.
  activated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_user_identity_oaths_user_category UNIQUE (user_id, oath_category)
);

CREATE INDEX IF NOT EXISTS idx_user_identity_oaths_user
  ON user_identity_oaths(user_id);

-- The binding itself. Nullable because contracts created before this migration
-- (and any category without a declared identity journey) have no oath to point
-- at; ON DELETE SET NULL keeps a contract readable if its oath row is ever
-- removed with the user's account data.
ALTER TABLE contracts
  ADD COLUMN IF NOT EXISTS identity_oath_id UUID
  REFERENCES user_identity_oaths(id) ON DELETE SET NULL;
