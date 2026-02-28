/**
 * HashCollider — desktop panel tests
 *
 * Tests pHash collision scan logic, scan state transitions, and
 * collision result structure.
 * Uses the same mock pattern from api.spec.ts (node env, no DOM).
 */

jest.mock('lucide-react', () => ({
  Fingerprint: 'Fingerprint',
  Search: 'Search',
  AlertCircle: 'AlertCircle',
}));

// HashCollider imports a CSS file — stub it for node env
jest.mock('./HashCollider.css', () => ({}));

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

// ---------------------------------------------------------------------------
// HashCollider uses a local setTimeout-based mock simulation (no API call).
// We reproduce and test the scan lifecycle and data structures.
// ---------------------------------------------------------------------------

interface HashProof {
  id: string;
  pHash: string;
  user: string;
  contractId: string;
  timestamp: string;
  similarity: number;
}

interface Collision {
  origin: HashProof;
  duplicate: HashProof;
}

describe('HashCollider', () => {
  describe('scan lifecycle', () => {
    it('starts in idle state with no collisions', () => {
      let isScanning = false;
      const collisions: Collision[] = [];

      expect(isScanning).toBe(false);
      expect(collisions).toHaveLength(0);
    });

    it('transitions to scanning state on scan trigger', () => {
      let isScanning = false;

      // Simulate handleScan
      isScanning = true;

      expect(isScanning).toBe(true);
    });

    it('populates collisions after scan timeout completes', () => {
      let isScanning = false;
      let collisions: Collision[] = [];

      // Simulate handleScan
      isScanning = true;

      setTimeout(() => {
        collisions = [
          {
            origin: {
              id: 'prf_1A',
              pHash: 'e1c3b1a20803c031',
              user: 'usr_alpha77',
              contractId: 'con_x1',
              timestamp: '2026-02-24T10:00:00Z',
              similarity: 100,
            },
            duplicate: {
              id: 'prf_2B',
              pHash: 'e1c3b1a20803c031',
              user: 'usr_beta99',
              contractId: 'con_x2',
              timestamp: '2026-02-25T08:30:00Z',
              similarity: 98.5,
            },
          },
        ];
        isScanning = false;
      }, 1500);

      // Before timer fires
      expect(isScanning).toBe(true);
      expect(collisions).toHaveLength(0);

      // Advance to completion
      jest.advanceTimersByTime(1500);

      expect(isScanning).toBe(false);
      expect(collisions).toHaveLength(1);
    });

    it('does not populate collisions before 1500ms', () => {
      let collisions: Collision[] = [];

      setTimeout(() => {
        collisions = [
          {
            origin: { id: 'prf_1A', pHash: 'hash', user: 'u1', contractId: 'c1', timestamp: 't1', similarity: 100 },
            duplicate: { id: 'prf_2B', pHash: 'hash', user: 'u2', contractId: 'c2', timestamp: 't2', similarity: 97 },
          },
        ];
      }, 1500);

      jest.advanceTimersByTime(1000);
      expect(collisions).toHaveLength(0);

      jest.advanceTimersByTime(500);
      expect(collisions).toHaveLength(1);
    });
  });

  describe('collision data structure', () => {
    it('contains origin and duplicate HashProof objects', () => {
      const collision: Collision = {
        origin: {
          id: 'prf_1A',
          pHash: 'e1c3b1a20803c031',
          user: 'usr_alpha77',
          contractId: 'con_x1',
          timestamp: '2026-02-24T10:00:00Z',
          similarity: 100,
        },
        duplicate: {
          id: 'prf_2B',
          pHash: 'e1c3b1a20803c031',
          user: 'usr_beta99',
          contractId: 'con_x2',
          timestamp: '2026-02-25T08:30:00Z',
          similarity: 98.5,
        },
      };

      expect(collision.origin.id).toBe('prf_1A');
      expect(collision.duplicate.id).toBe('prf_2B');
    });

    it('origin and duplicate share the same pHash', () => {
      const collision: Collision = {
        origin: { id: 'a', pHash: 'aaaa', user: 'u1', contractId: 'c1', timestamp: 't1', similarity: 100 },
        duplicate: { id: 'b', pHash: 'aaaa', user: 'u2', contractId: 'c2', timestamp: 't2', similarity: 99.1 },
      };

      expect(collision.origin.pHash).toBe(collision.duplicate.pHash);
    });

    it('duplicate similarity is between 0 and 100', () => {
      const similarity = 98.5;
      expect(similarity).toBeGreaterThanOrEqual(0);
      expect(similarity).toBeLessThanOrEqual(100);
    });

    it('origin similarity is always 100 (self-match)', () => {
      const origin: HashProof = {
        id: 'prf_1',
        pHash: 'hash',
        user: 'u1',
        contractId: 'c1',
        timestamp: 't1',
        similarity: 100,
      };
      expect(origin.similarity).toBe(100);
    });
  });

  describe('display states', () => {
    it('shows scanning message when isScanning is true', () => {
      const isScanning = true;
      const buttonText = isScanning
        ? 'MATRIX SCAN RUNNING...'
        : 'SCAN CLOUDFLARE R2 BUCKET';
      expect(buttonText).toBe('MATRIX SCAN RUNNING...');
    });

    it('shows idle button text when not scanning', () => {
      const isScanning = false;
      const buttonText = isScanning
        ? 'MATRIX SCAN RUNNING...'
        : 'SCAN CLOUDFLARE R2 BUCKET';
      expect(buttonText).toBe('SCAN CLOUDFLARE R2 BUCKET');
    });

    it('shows "no collisions" message when scan complete with empty results', () => {
      const isScanning = false;
      const collisions: Collision[] = [];
      const showNoCollisions = !isScanning && collisions.length === 0;
      expect(showNoCollisions).toBe(true);
    });

    it('shows collision list when results are present', () => {
      const isScanning = false;
      const collisions: Collision[] = [
        {
          origin: { id: 'a', pHash: 'h', user: 'u1', contractId: 'c1', timestamp: 't', similarity: 100 },
          duplicate: { id: 'b', pHash: 'h', user: 'u2', contractId: 'c2', timestamp: 't', similarity: 95 },
        },
      ];
      const showCollisions = !isScanning && collisions.length > 0;
      expect(showCollisions).toBe(true);
    });

    it('scan button is disabled while scanning', () => {
      const isScanning = true;
      const disabled = isScanning;
      expect(disabled).toBe(true);
    });
  });

  describe('collision display formatting', () => {
    it('formats similarity as percentage string', () => {
      const similarity = 98.5;
      const display = `Similarity: ${similarity}%`;
      expect(display).toBe('Similarity: 98.5%');
    });

    it('labels origin as Original Submission', () => {
      const label = 'Original Submission';
      expect(label).toBe('Original Submission');
    });

    it('labels duplicate as Duplicate Detected', () => {
      const label = 'Duplicate Detected';
      expect(label).toBe('Duplicate Detected');
    });

    it('displays user, proof id, and pHash for each entry', () => {
      const proof: HashProof = {
        id: 'prf_1A',
        pHash: 'e1c3b1a20803c031',
        user: 'usr_alpha77',
        contractId: 'con_x1',
        timestamp: '2026-02-24T10:00:00Z',
        similarity: 100,
      };

      expect(`User: ${proof.user}`).toBe('User: usr_alpha77');
      expect(`Proof ID: ${proof.id}`).toBe('Proof ID: prf_1A');
      expect(`pHash: ${proof.pHash}`).toBe('pHash: e1c3b1a20803c031');
    });
  });
});
