-- Migration 036: Cohort Waitlist / Fill Queue
-- Holds users in queue until cohort reaches minimum enrollment threshold.

CREATE TABLE IF NOT EXISTS waitlist_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  cohort_id TEXT NOT NULL,
  pod_id TEXT,
  display_alias TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  enrolled BOOLEAN NOT NULL DEFAULT FALSE,
  enrolled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT one_entry_per_user_per_cohort UNIQUE (user_id, cohort_id)
);

CREATE INDEX IF NOT EXISTS idx_waitlist_entries_cohort ON waitlist_entries(cohort_id, position);
CREATE INDEX IF NOT EXISTS idx_waitlist_entries_user ON waitlist_entries(user_id);
