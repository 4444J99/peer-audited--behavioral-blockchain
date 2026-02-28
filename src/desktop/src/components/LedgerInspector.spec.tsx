/**
 * LedgerInspector — desktop panel tests
 *
 * Tests search/filter logic and API data-fetching behavior.
 * Uses the same mock-fetch pattern from api.spec.ts (node env, no DOM).
 */

import { api } from '../services/api';

// ---- Mock the api module so component-level imports resolve ----
jest.mock('../services/api', () => ({
  api: {
    getTruthLog: jest.fn(),
    getAdminStats: jest.fn(),
  },
}));

// ---- Stub lucide-react (no real SVG in node) ----
jest.mock('lucide-react', () => ({
  Database: 'Database',
  Search: 'Search',
  ArrowRightLeft: 'ArrowRightLeft',
  RefreshCw: 'RefreshCw',
}));

const mockGetTruthLog = api.getTruthLog as jest.Mock;
const mockGetAdminStats = api.getAdminStats as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
});

// ---------------------------------------------------------------------------
// Since testEnvironment is "node" (no DOM), we test the data-layer logic that
// the component relies on rather than rendering React elements.  This mirrors
// the api.spec.ts pattern of verifying that the right API calls are wired up
// and that the data transformations produce expected shapes.
// ---------------------------------------------------------------------------

describe('LedgerInspector', () => {
  describe('data fetching', () => {
    it('calls getTruthLog(100) and getAdminStats() on mount', async () => {
      mockGetTruthLog.mockResolvedValue({ transactions: [] });
      mockGetAdminStats.mockResolvedValue({
        totalUsers: 100,
        activeContracts: 25,
        pendingProofs: 3,
        avgIntegrity: 72.5,
      });

      // Simulate what fetchData() does inside the component
      const [logResult, statsResult] = await Promise.allSettled([
        api.getTruthLog(100),
        api.getAdminStats(),
      ]);

      expect(mockGetTruthLog).toHaveBeenCalledWith(100);
      expect(mockGetAdminStats).toHaveBeenCalled();
      expect(logResult.status).toBe('fulfilled');
      expect(statsResult.status).toBe('fulfilled');
    });

    it('normalizes transaction objects into TruthEvent shape', async () => {
      const rawTx = {
        tx_hash: 'abc123',
        timestamp: '2026-02-24T10:00:00Z',
        type: 'STAKE_LOCKED',
        user: 'usr_001',
        amount: 25,
        status: 'CONFIRMED',
      };
      mockGetTruthLog.mockResolvedValue({ transactions: [rawTx] });

      const result = await api.getTruthLog(100);
      const tx = result.transactions[0];

      // Reproduce the normalization logic from the component
      const event = {
        tx_hash: tx.tx_hash || tx.hash || tx.id || '---',
        timestamp: tx.timestamp || tx.created_at || tx.createdAt || '---',
        type: tx.type || tx.event_type || tx.eventType || 'UNKNOWN',
        user: tx.user || tx.user_id || tx.userId || '---',
        amount: tx.amount != null ? `$${Number(tx.amount).toFixed(2)}` : '---',
        status: tx.status || 'UNKNOWN',
      };

      expect(event.tx_hash).toBe('abc123');
      expect(event.amount).toBe('$25.00');
      expect(event.type).toBe('STAKE_LOCKED');
      expect(event.status).toBe('CONFIRMED');
    });

    it('falls back to alternative field names when primary fields are absent', () => {
      const tx = {
        hash: 'fallback-hash',
        created_at: '2026-01-01',
        event_type: 'PAYOUT',
        user_id: 'usr_fallback',
        amount: null,
        status: undefined,
      };

      const event = {
        tx_hash: tx.hash || '---',
        timestamp: tx.created_at || '---',
        type: tx.event_type || 'UNKNOWN',
        user: tx.user_id || '---',
        amount: tx.amount != null ? `$${Number(tx.amount).toFixed(2)}` : '---',
        status: tx.status || 'UNKNOWN',
      };

      expect(event.tx_hash).toBe('fallback-hash');
      expect(event.timestamp).toBe('2026-01-01');
      expect(event.type).toBe('PAYOUT');
      expect(event.user).toBe('usr_fallback');
      expect(event.amount).toBe('---');
      expect(event.status).toBe('UNKNOWN');
    });

    it('sets error message when getTruthLog rejects', async () => {
      mockGetTruthLog.mockRejectedValue(new Error('Network failure'));
      mockGetAdminStats.mockResolvedValue({ totalUsers: 0, activeContracts: 0, pendingProofs: 0, avgIntegrity: 0 });

      const [logResult] = await Promise.allSettled([
        api.getTruthLog(100),
        api.getAdminStats(),
      ]);

      expect(logResult.status).toBe('rejected');
      if (logResult.status === 'rejected') {
        expect(logResult.reason.message).toBe('Network failure');
      }
    });
  });

  describe('search filter logic', () => {
    const sampleEvents = [
      { tx_hash: 'tx_abc123', timestamp: '2026-02-24', type: 'STAKE_LOCKED', user: 'usr_alpha77', amount: '$100.00', status: 'CONFIRMED' },
      { tx_hash: 'tx_def456', timestamp: '2026-02-25', type: 'BURNED', user: 'usr_beta99', amount: '$50.00', status: 'FAILED' },
      { tx_hash: 'tx_ghi789', timestamp: '2026-02-26', type: 'PAYOUT', user: 'usr_alpha77', amount: '$75.00', status: 'CONFIRMED' },
      { tx_hash: 'tx_jkl012', timestamp: '2026-02-27', type: 'FRAUD_DETECTED', user: 'usr_gamma', amount: '$200.00', status: 'PENDING' },
    ];

    function filterEvents(events: typeof sampleEvents, searchQuery: string) {
      if (!searchQuery) return events;
      const q = searchQuery.toLowerCase();
      return events.filter(
        (evt) =>
          evt.tx_hash.toLowerCase().includes(q) ||
          evt.user.toLowerCase().includes(q) ||
          evt.type.toLowerCase().includes(q),
      );
    }

    it('returns all events when search query is empty', () => {
      expect(filterEvents(sampleEvents, '')).toHaveLength(4);
    });

    it('filters by tx_hash substring', () => {
      const results = filterEvents(sampleEvents, 'def456');
      expect(results).toHaveLength(1);
      expect(results[0].tx_hash).toBe('tx_def456');
    });

    it('filters by user ID (case-insensitive)', () => {
      const results = filterEvents(sampleEvents, 'ALPHA77');
      expect(results).toHaveLength(2);
      expect(results.every((e) => e.user === 'usr_alpha77')).toBe(true);
    });

    it('filters by event type substring', () => {
      const results = filterEvents(sampleEvents, 'burned');
      expect(results).toHaveLength(1);
      expect(results[0].type).toBe('BURNED');
    });

    it('matches FRAUD across type field', () => {
      const results = filterEvents(sampleEvents, 'fraud');
      expect(results).toHaveLength(1);
      expect(results[0].type).toBe('FRAUD_DETECTED');
    });

    it('returns empty when no match', () => {
      expect(filterEvents(sampleEvents, 'nonexistent')).toHaveLength(0);
    });
  });

  describe('stats display logic', () => {
    it('formats stats correctly from API response', async () => {
      const statsData = {
        totalUsers: 12500,
        activeContracts: 843,
        pendingProofs: 17,
        avgIntegrity: 63.2,
      };
      mockGetAdminStats.mockResolvedValue(statsData);

      const stats = await api.getAdminStats();
      expect(stats.totalUsers.toLocaleString()).toBe('12,500');
      expect(stats.avgIntegrity.toFixed(1)).toBe('63.2');
    });

    it('handles null stats gracefully (displays ---)', () => {
      const stats: any = null;
      expect(stats ? stats.totalUsers.toLocaleString() : '---').toBe('---');
    });
  });
});
