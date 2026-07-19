import { renderToStaticMarkup } from 'react-dom/server';
import HashCollider from './HashCollider';
import {
  buildCollisionTicketDraft,
  classifyCollisionSeverity,
  filterCollisionsByThreshold,
  getCollisionSimilarity,
  normalizeCollisionList,
  type HashCollision,
} from './hash-collider.utils';

jest.mock('./HashCollider.css', () => ({}));

jest.mock('lucide-react', () => ({
  Fingerprint: () => null,
  Search: () => null,
  AlertCircle: () => null,
  Copy: () => null,
  SlidersHorizontal: () => null,
}));

jest.mock('../services/api', () => ({
  api: {
    scanHashCollisions: jest.fn(),
  },
}));

const collisionA: HashCollision = {
  origin: {
    id: 'proof-origin-a',
    pHash: 'abcd1234',
    user: 'usr-a',
    contractId: 'contract-a',
    timestamp: '2026-03-05T10:00:00.000Z',
    similarity: 100,
  },
  duplicate: {
    id: 'proof-dup-a',
    pHash: 'abcd1234',
    user: 'usr-b',
    contractId: 'contract-b',
    timestamp: '2026-03-05T11:00:00.000Z',
    similarity: 98.4,
  },
};

const collisionB: HashCollision = {
  origin: {
    id: 'proof-origin-b',
    pHash: 'ffff0000',
    user: 'usr-c',
    contractId: 'contract-c',
    timestamp: '2026-03-05T12:00:00.000Z',
    similarity: 100,
  },
  duplicate: {
    id: 'proof-dup-b',
    pHash: 'ffff0000',
    user: 'usr-d',
    contractId: 'contract-d',
    timestamp: '2026-03-05T13:00:00.000Z',
    similarity: 91.2,
  },
};

describe('hash-collider utils', () => {
  it('returns duplicate similarity as the sortable score', () => {
    expect(getCollisionSimilarity(collisionA)).toBeCloseTo(98.4, 5);
  });

  it('clamps similarity below zero to zero', () => {
    const negative: HashCollision = {
      ...collisionA,
      duplicate: { ...collisionA.duplicate, similarity: -10 },
    };
    expect(getCollisionSimilarity(negative)).toBe(0);
  });

  it('clamps similarity above one hundred to one hundred', () => {
    const over: HashCollision = {
      ...collisionA,
      duplicate: { ...collisionA.duplicate, similarity: 250 },
    };
    expect(getCollisionSimilarity(over)).toBe(100);
  });

  it('sorts collisions by highest similarity first', () => {
    const sorted = normalizeCollisionList([collisionB, collisionA]);
    expect(sorted[0].duplicate.id).toBe('proof-dup-a');
    expect(sorted[1].duplicate.id).toBe('proof-dup-b');
  });

  it('does not mutate original collision ordering while normalizing', () => {
    const original = [collisionB, collisionA];
    const copy = [...original];
    normalizeCollisionList(original);
    expect(original).toEqual(copy);
  });

  it('filters collisions by threshold', () => {
    const filtered = filterCollisionsByThreshold([collisionA, collisionB], 95);
    expect(filtered).toHaveLength(1);
    expect(filtered[0].duplicate.id).toBe('proof-dup-a');
  });

  it('keeps all collisions when threshold is low', () => {
    const filtered = filterCollisionsByThreshold([collisionA, collisionB], 80);
    expect(filtered).toHaveLength(2);
  });

  it('returns empty list when threshold is stricter than all collisions', () => {
    const filtered = filterCollisionsByThreshold([collisionA, collisionB], 99);
    expect(filtered).toHaveLength(0);
  });

  it('classifies severity buckets correctly', () => {
    expect(classifyCollisionSeverity(99.1)).toBe('critical');
    expect(classifyCollisionSeverity(96.5)).toBe('high');
    expect(classifyCollisionSeverity(90.0)).toBe('medium');
    expect(classifyCollisionSeverity(88.7)).toBe('low');
  });

  it('classifies threshold boundary values consistently', () => {
    expect(classifyCollisionSeverity(98)).toBe('critical');
    expect(classifyCollisionSeverity(95)).toBe('high');
    expect(classifyCollisionSeverity(90)).toBe('medium');
    expect(classifyCollisionSeverity(89.999)).toBe('low');
  });

  it('builds a markdown ticket draft with required investigation context', () => {
    const draft = buildCollisionTicketDraft(collisionA);
    expect(draft).toContain('Hash Collision Investigation');
    expect(draft).toContain('proof-origin-a');
    expect(draft).toContain('proof-dup-a');
    expect(draft).toContain('Severity: CRITICAL');
    expect(draft).toContain('Investigation Checklist');
  });

  it('includes pHash payload details in ticket draft', () => {
    const draft = buildCollisionTicketDraft(collisionA);
    expect(draft).toContain(`Origin pHash: ${collisionA.origin.pHash}`);
    expect(draft).toContain(`Duplicate pHash: ${collisionA.duplicate.pHash}`);
  });

  it('includes both origin and duplicate contract IDs in ticket draft', () => {
    const draft = buildCollisionTicketDraft(collisionA);
    expect(draft).toContain(`Origin contract: ${collisionA.origin.contractId}`);
    expect(draft).toContain(`Duplicate contract: ${collisionA.duplicate.contractId}`);
  });
});

describe('HashCollider component', () => {
  it('renders control surface with threshold controls and scan trigger', () => {
    const html = renderToStaticMarkup(<HashCollider />);

    expect(html).toContain('Hash Collider (pHash Duplicate Detection)');
    expect(html).toContain('Similarity Threshold');
    expect(html).toContain('SCAN CLOUDFLARE R2 BUCKET');
    expect(html).toContain('No visual collisions detected in the current epoch.');
  });

  it('renders default threshold value in initial view', () => {
    const html = renderToStaticMarkup(<HashCollider />);
    expect(html).toContain('95%');
  });

  it('renders explanatory copy for pHash scanning scope', () => {
    const html = renderToStaticMarkup(<HashCollider />);
    expect(html).toContain('perceptual hashes (pHash)');
    expect(html).toContain('Cloudflare R2');
  });
});
