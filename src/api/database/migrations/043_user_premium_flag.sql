-- Migration 043: Consumer premium membership flag

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS is_premium BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN users.is_premium IS
  'Consumer premium membership flag exposed on the authenticated user profile.';
