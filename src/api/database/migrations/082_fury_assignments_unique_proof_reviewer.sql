-- 082: Enforce one Fury assignment per (proof_id, fury_user_id)
-- Lock fury_assignments to prevent concurrent routing writers from inserting duplicates
-- between cleanup and constraint installation. Fail closed on opposite non-null duplicate
-- verdicts by routing affected unresolved proofs to SPLIT and clearing the conflicting
-- verdicts before deduplicating.
DO $$
BEGIN
  LOCK TABLE fury_assignments IN SHARE ROW EXCLUSIVE MODE;

  DELETE FROM fury_assignments
  WHERE proof_id IS NULL
     OR fury_user_id IS NULL;

  WITH conflicting_pairs AS (
    SELECT proof_id, fury_user_id
    FROM fury_assignments
    WHERE verdict IS NOT NULL
    GROUP BY proof_id, fury_user_id
    HAVING COUNT(DISTINCT verdict) > 1
  ),
  mark_split_proofs AS (
    UPDATE proofs p
    SET status = 'SPLIT'
    FROM conflicting_pairs cp
    WHERE p.id = cp.proof_id
      AND p.status IN ('PENDING_REVIEW', 'IN_REVIEW', 'UNDER_REVIEW', 'RESOLVING')
  )
  UPDATE fury_assignments fa
  SET verdict = NULL,
      reviewed_at = NULL
  FROM conflicting_pairs cp
  WHERE fa.proof_id = cp.proof_id
    AND fa.fury_user_id = cp.fury_user_id;

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
  )
  DELETE FROM fury_assignments fa
  USING ranked_assignments ra
  WHERE fa.id = ra.id
    AND ra.duplicate_rank > 1;

  ALTER TABLE fury_assignments
    ALTER COLUMN proof_id SET NOT NULL,
    ALTER COLUMN fury_user_id SET NOT NULL;

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
