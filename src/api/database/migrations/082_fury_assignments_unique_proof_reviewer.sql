-- 082: Enforce one Fury assignment per (proof_id, fury_user_id)
-- Deduplicate any pre-existing duplicate (proof_id, fury_user_id) rows before adding
-- the uniqueness constraint, preserving rows that already carry a verdict first,
-- then the earliest assigned row, without deleting unrelated proof/reviewer history.
DO $$
BEGIN
  WITH ranked_assignments AS (
    SELECT
      id,
      ROW_NUMBER() OVER (
        PARTITION BY proof_id, fury_user_id
        ORDER BY
          (verdict IS NOT NULL) DESC,
          reviewed_at ASC NULLS LAST,
          assigned_at ASC NULLS LAST,
          id ASC
      ) AS duplicate_rank
    FROM fury_assignments
    WHERE proof_id IS NOT NULL
      AND fury_user_id IS NOT NULL
  )
  DELETE FROM fury_assignments fa
  USING ranked_assignments ra
  WHERE fa.id = ra.id
    AND ra.duplicate_rank > 1;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'uq_fury_assignments_proof_reviewer'
      AND conrelid = 'fury_assignments'::regclass
  ) THEN
    ALTER TABLE fury_assignments
      ADD CONSTRAINT uq_fury_assignments_proof_reviewer
      UNIQUE (proof_id, fury_user_id);
  END IF;
END
$$;
