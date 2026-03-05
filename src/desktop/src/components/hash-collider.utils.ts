export interface HashProof {
  id: string;
  pHash: string;
  user: string;
  contractId: string;
  timestamp: string;
  similarity: number;
}

export interface HashCollision {
  origin: HashProof;
  duplicate: HashProof;
}

export type CollisionSeverity = 'critical' | 'high' | 'medium' | 'low';

function clampSimilarity(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, value));
}

export function getCollisionSimilarity(collision: HashCollision): number {
  return clampSimilarity(collision.duplicate?.similarity ?? collision.origin?.similarity ?? 0);
}

export function classifyCollisionSeverity(similarity: number): CollisionSeverity {
  const normalized = clampSimilarity(similarity);
  if (normalized >= 98) return 'critical';
  if (normalized >= 95) return 'high';
  if (normalized >= 90) return 'medium';
  return 'low';
}

export function normalizeCollisionList(collisions: HashCollision[]): HashCollision[] {
  return [...collisions].sort((a, b) => getCollisionSimilarity(b) - getCollisionSimilarity(a));
}

export function filterCollisionsByThreshold(
  collisions: HashCollision[],
  threshold: number,
): HashCollision[] {
  const normalizedThreshold = clampSimilarity(threshold);
  return collisions.filter((collision) => getCollisionSimilarity(collision) >= normalizedThreshold);
}

export function buildCollisionTicketDraft(collision: HashCollision): string {
  const similarity = getCollisionSimilarity(collision).toFixed(2);
  const severity = classifyCollisionSeverity(getCollisionSimilarity(collision)).toUpperCase();

  return [
    '## Hash Collision Investigation',
    '',
    `- Severity: ${severity}`,
    `- Similarity: ${similarity}%`,
    `- Origin proof: ${collision.origin.id} (user ${collision.origin.user})`,
    `- Duplicate proof: ${collision.duplicate.id} (user ${collision.duplicate.user})`,
    `- Origin contract: ${collision.origin.contractId}`,
    `- Duplicate contract: ${collision.duplicate.contractId}`,
    `- Origin timestamp: ${collision.origin.timestamp}`,
    `- Duplicate timestamp: ${collision.duplicate.timestamp}`,
    '',
    '### pHash Comparison',
    `- Origin pHash: ${collision.origin.pHash}`,
    `- Duplicate pHash: ${collision.duplicate.pHash}`,
    '',
    '### Investigation Checklist',
    '- [ ] Verify submission payload signatures and upload metadata.',
    '- [ ] Review Fury routing history for duplicate propagation.',
    '- [ ] Determine if duplicate is malicious replay or false positive.',
  ].join('\n');
}
