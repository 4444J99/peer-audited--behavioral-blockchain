-- 003_proof_hashes: Perceptual hash table for proof deduplication (Twin Upload gate)
-- Stores pHash for each proof's media to detect near-duplicate submissions.

CREATE TABLE IF NOT EXISTS proof_hashes (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  proof_id    UUID NOT NULL REFERENCES proofs(id) ON DELETE CASCADE,
  phash       VARCHAR(16) NOT NULL,
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT uq_proof_hashes_proof_id UNIQUE (proof_id)
);

-- Index for scanning existing hashes during dedup checks
CREATE INDEX IF NOT EXISTS idx_proof_hashes_phash ON proof_hashes (phash);

