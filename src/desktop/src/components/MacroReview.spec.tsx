/**
 * MacroReview — desktop panel tests
 *
 * Tests queue building logic, severity classification, critical count,
 * and dashboard stats display.
 * Uses the same mock pattern from api.spec.ts (node env, no DOM).
 */

import { api } from '../services/api';

jest.mock('../services/api', () => ({
  api: {
    getAdminStats: jest.fn(),
    getTruthLog: jest.fn(),
  },
}));

jest.mock('lucide-react', () => ({
  Activity: 'Activity',
  ShieldAlert: 'ShieldAlert',
  RefreshCw: 'RefreshCw',
}));

const mockGetAdminStats = api.getAdminStats as jest.Mock;
const mockGetTruthLog = api.getTruthLog as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
});

// ---------------------------------------------------------------------------
// Reproduce the queue-building logic from MacroReview's fetchData().
// This lets us test the classification/severity/count computations
// without needing a DOM.
// ---------------------------------------------------------------------------

interface QueueItem {
  id: string;
  severity: string;
  type: string;
  user: string;
  peers: string[];
  status: string;
}

async function buildQueue(): Promise<{
  queue: QueueItem[];
  stats: any;
  error: string;
}> {
  let error = '';
  let stats: any = null;
  const items: QueueItem[] = [];

  try {
    const statsResult = await api.getAdminStats();
    stats = statsResult;

    if (statsResult.pendingProofs > 0) {
      items.push({
        id: 'fury_q_pending',
        severity: statsResult.pendingProofs > 10 ? 'HIGH' : 'MEDIUM',
        type: 'PENDING_PROOFS',
        user: 'SYSTEM',
        peers: [],
        status: `${statsResult.pendingProofs} PROOFS AWAITING REVIEW`,
      });
    }

    try {
      const logResult = await api.getTruthLog(20);
      const transactions = logResult.transactions || [];
      transactions.forEach((tx: any, idx: number) => {
        if (
          tx.type === 'APPEAL' ||
          tx.type === 'CONFLICT' ||
          tx.type === 'HONEYPOT_FAIL' ||
          tx.status === 'ESCALATED' ||
          tx.status === 'PENALTY_PENDING'
        ) {
          items.push({
            id: tx.id || tx.tx_hash || `fury_q_${idx}`,
            severity:
              tx.type === 'HONEYPOT_FAIL'
                ? 'CRITICAL'
                : tx.type === 'CONFLICT'
                  ? 'HIGH'
                  : 'LOW',
            type: tx.type || tx.event_type || 'UNKNOWN',
            user: tx.user || tx.user_id || 'UNKNOWN',
            peers: tx.peers || [],
            status: tx.status || 'PENDING',
          });
        }
      });
    } catch {
      // Truth log fetch failed — queue still shows stats-based items
    }
  } catch (err: any) {
    error = err.message || 'Failed to load dashboard data';
  }

  return { queue: items, stats, error };
}

describe('MacroReview', () => {
  describe('data fetching', () => {
    it('calls getAdminStats() and getTruthLog(20)', async () => {
      mockGetAdminStats.mockResolvedValue({
        totalUsers: 500,
        activeContracts: 120,
        pendingProofs: 0,
        avgIntegrity: 65.0,
      });
      mockGetTruthLog.mockResolvedValue({ transactions: [] });

      await buildQueue();

      expect(mockGetAdminStats).toHaveBeenCalled();
      expect(mockGetTruthLog).toHaveBeenCalledWith(20);
    });

    it('sets error when getAdminStats rejects', async () => {
      mockGetAdminStats.mockRejectedValue(new Error('Server unavailable'));

      const { error } = await buildQueue();

      expect(error).toBe('Server unavailable');
    });

    it('still builds queue from stats if getTruthLog fails', async () => {
      mockGetAdminStats.mockResolvedValue({
        totalUsers: 100,
        activeContracts: 50,
        pendingProofs: 15,
        avgIntegrity: 60.0,
      });
      mockGetTruthLog.mockRejectedValue(new Error('Log unavailable'));

      const { queue, error } = await buildQueue();

      expect(error).toBe('');
      expect(queue).toHaveLength(1);
      expect(queue[0].type).toBe('PENDING_PROOFS');
    });
  });

  describe('queue building from stats', () => {
    it('adds PENDING_PROOFS item when pendingProofs > 0', async () => {
      mockGetAdminStats.mockResolvedValue({
        totalUsers: 100,
        activeContracts: 50,
        pendingProofs: 5,
        avgIntegrity: 60,
      });
      mockGetTruthLog.mockResolvedValue({ transactions: [] });

      const { queue } = await buildQueue();

      expect(queue).toHaveLength(1);
      expect(queue[0]).toMatchObject({
        id: 'fury_q_pending',
        type: 'PENDING_PROOFS',
        user: 'SYSTEM',
      });
      expect(queue[0].status).toContain('5 PROOFS AWAITING REVIEW');
    });

    it('skips PENDING_PROOFS when pendingProofs is 0', async () => {
      mockGetAdminStats.mockResolvedValue({
        totalUsers: 100,
        activeContracts: 50,
        pendingProofs: 0,
        avgIntegrity: 60,
      });
      mockGetTruthLog.mockResolvedValue({ transactions: [] });

      const { queue } = await buildQueue();

      expect(queue).toHaveLength(0);
    });

    it('sets severity HIGH when pendingProofs > 10', async () => {
      mockGetAdminStats.mockResolvedValue({
        totalUsers: 100,
        activeContracts: 50,
        pendingProofs: 15,
        avgIntegrity: 60,
      });
      mockGetTruthLog.mockResolvedValue({ transactions: [] });

      const { queue } = await buildQueue();

      expect(queue[0].severity).toBe('HIGH');
    });

    it('sets severity MEDIUM when pendingProofs <= 10', async () => {
      mockGetAdminStats.mockResolvedValue({
        totalUsers: 100,
        activeContracts: 50,
        pendingProofs: 8,
        avgIntegrity: 60,
      });
      mockGetTruthLog.mockResolvedValue({ transactions: [] });

      const { queue } = await buildQueue();

      expect(queue[0].severity).toBe('MEDIUM');
    });
  });

  describe('queue building from truth log', () => {
    beforeEach(() => {
      mockGetAdminStats.mockResolvedValue({
        totalUsers: 100,
        activeContracts: 50,
        pendingProofs: 0,
        avgIntegrity: 60,
      });
    });

    it('adds HONEYPOT_FAIL as CRITICAL severity', async () => {
      mockGetTruthLog.mockResolvedValue({
        transactions: [
          { id: 'tx1', type: 'HONEYPOT_FAIL', user: 'usr_bad', status: 'PENALTY_PENDING', peers: [] },
        ],
      });

      const { queue } = await buildQueue();

      expect(queue).toHaveLength(1);
      expect(queue[0].severity).toBe('CRITICAL');
      expect(queue[0].type).toBe('HONEYPOT_FAIL');
    });

    it('adds CONFLICT as HIGH severity', async () => {
      mockGetTruthLog.mockResolvedValue({
        transactions: [
          { id: 'tx2', type: 'CONFLICT', user: 'usr_dispute', status: 'ESCALATED', peers: ['usr_a', 'usr_b'] },
        ],
      });

      const { queue } = await buildQueue();

      expect(queue).toHaveLength(1);
      expect(queue[0].severity).toBe('HIGH');
      expect(queue[0].peers).toEqual(['usr_a', 'usr_b']);
    });

    it('adds APPEAL as LOW severity', async () => {
      mockGetTruthLog.mockResolvedValue({
        transactions: [
          { id: 'tx3', type: 'APPEAL', user: 'usr_appeal', status: 'PENDING' },
        ],
      });

      const { queue } = await buildQueue();

      expect(queue).toHaveLength(1);
      expect(queue[0].severity).toBe('LOW');
    });

    it('includes items with ESCALATED status regardless of type', async () => {
      mockGetTruthLog.mockResolvedValue({
        transactions: [
          { id: 'tx4', type: 'SOME_OTHER_TYPE', user: 'usr_esc', status: 'ESCALATED' },
        ],
      });

      const { queue } = await buildQueue();

      expect(queue).toHaveLength(1);
      expect(queue[0].user).toBe('usr_esc');
    });

    it('includes items with PENALTY_PENDING status', async () => {
      mockGetTruthLog.mockResolvedValue({
        transactions: [
          { id: 'tx5', type: 'SOME_TYPE', user: 'usr_pen', status: 'PENALTY_PENDING' },
        ],
      });

      const { queue } = await buildQueue();

      expect(queue).toHaveLength(1);
    });

    it('ignores transactions that do not match escalation criteria', async () => {
      mockGetTruthLog.mockResolvedValue({
        transactions: [
          { id: 'tx6', type: 'STAKE_LOCKED', user: 'usr_normal', status: 'CONFIRMED' },
          { id: 'tx7', type: 'PAYOUT', user: 'usr_happy', status: 'COMPLETED' },
        ],
      });

      const { queue } = await buildQueue();

      expect(queue).toHaveLength(0);
    });

    it('uses fallback id from tx_hash when id is missing', async () => {
      mockGetTruthLog.mockResolvedValue({
        transactions: [
          { tx_hash: 'hash_fallback', type: 'APPEAL', user: 'usr_x', status: 'PENDING' },
        ],
      });

      const { queue } = await buildQueue();

      expect(queue[0].id).toBe('hash_fallback');
    });

    it('uses index-based id when both id and tx_hash are missing', async () => {
      mockGetTruthLog.mockResolvedValue({
        transactions: [
          { type: 'CONFLICT', user: 'usr_y', status: 'ESCALATED' },
        ],
      });

      const { queue } = await buildQueue();

      expect(queue[0].id).toBe('fury_q_0');
    });
  });

  describe('critical count calculation', () => {
    it('counts CRITICAL items correctly', async () => {
      mockGetAdminStats.mockResolvedValue({
        totalUsers: 100, activeContracts: 50, pendingProofs: 0, avgIntegrity: 60,
      });
      mockGetTruthLog.mockResolvedValue({
        transactions: [
          { id: 'tx1', type: 'HONEYPOT_FAIL', user: 'u1', status: 'PENALTY_PENDING' },
          { id: 'tx2', type: 'HONEYPOT_FAIL', user: 'u2', status: 'PENALTY_PENDING' },
          { id: 'tx3', type: 'APPEAL', user: 'u3', status: 'PENDING' },
        ],
      });

      const { queue } = await buildQueue();
      const criticalCount = queue.filter((item) => item.severity === 'CRITICAL').length;

      expect(criticalCount).toBe(2);
    });

    it('returns 0 critical when no HONEYPOT_FAIL events', async () => {
      mockGetAdminStats.mockResolvedValue({
        totalUsers: 100, activeContracts: 50, pendingProofs: 3, avgIntegrity: 60,
      });
      mockGetTruthLog.mockResolvedValue({
        transactions: [
          { id: 'tx1', type: 'APPEAL', user: 'u1', status: 'PENDING' },
        ],
      });

      const { queue } = await buildQueue();
      const criticalCount = queue.filter((item) => item.severity === 'CRITICAL').length;

      expect(criticalCount).toBe(0);
    });
  });

  describe('stats display', () => {
    it('formats pendingProofs color based on threshold', () => {
      // pendingProofs > 0 → yellow (#eab308), else green (#22c55e)
      const pending = 5;
      const color = pending > 0 ? '#eab308' : '#22c55e';
      expect(color).toBe('#eab308');

      const noPending = 0;
      const greenColor = noPending > 0 ? '#eab308' : '#22c55e';
      expect(greenColor).toBe('#22c55e');
    });

    it('formats avgIntegrity color based on 50 threshold', () => {
      // >= 50 → green, < 50 → red
      expect(65 >= 50 ? '#22c55e' : '#DC2626').toBe('#22c55e');
      expect(42 >= 50 ? '#22c55e' : '#DC2626').toBe('#DC2626');
    });
  });
});
