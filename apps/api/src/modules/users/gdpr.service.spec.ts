import { GdprService } from './gdpr.service';
import { Pool } from 'pg';

const mockClient = {
  query: jest.fn(),
  release: jest.fn(),
};

const mockPool = {
  query: jest.fn(),
  connect: jest.fn(),
} as unknown as Pool;

describe('GdprService', () => {
  let service: GdprService;

  beforeEach(() => {
    service = new GdprService(mockPool);
    (mockPool.query as jest.Mock).mockReset();
    (mockPool.connect as jest.Mock).mockReset().mockResolvedValue(mockClient);
    // appendTruthLogEvent runs on a connected client; default every client query
    // (BEGIN, advisory lock, SELECT latest, INSERT, COMMIT) to an empty result.
    mockClient.query.mockReset().mockResolvedValue({ rows: [] });
    mockClient.release.mockReset();
  });

  describe('exportUserData', () => {
    it('should export all user data in machine-readable format', async () => {
      const userId = 'user-123';

      (mockPool.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [{ id: userId, email: 'test@styx.protocol', integrity_score: 50, role: 'USER', status: 'ACTIVE', created_at: '2025-01-01' }] }) // users
        .mockResolvedValueOnce({ rows: [{ id: 'c1', oath_category: 'BIOLOGICAL_WEIGHT', status: 'ACTIVE' }] }) // contracts
        .mockResolvedValueOnce({ rows: [{ id: 'p1', contract_id: 'c1', status: 'PENDING' }] }) // proofs
        .mockResolvedValueOnce({ rows: [{ id: 'e1', amount: '5000' }] }) // entries
        .mockResolvedValueOnce({ rows: [{ id: 'n1', type: 'CONTRACT_UPDATE', title: 'Test' }] }) // notifications
        .mockResolvedValueOnce({ rows: [{ id: 'a1' }] }); // attestations

      const result = await service.exportUserData(userId);

      expect(result.exportedAt).toBeDefined();
      expect(result.user).toEqual(expect.objectContaining({ id: userId, email: 'test@styx.protocol' }));
      expect(result.contracts).toHaveLength(1);
      expect(result.proofs).toHaveLength(1);
      expect(result.ledgerEntries).toHaveLength(1);
      expect(result.notifications).toHaveLength(1);
      expect(result.attestations).toHaveLength(1);
    });

    it('should return null user when user not found', async () => {
      (mockPool.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [] }) // users
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] });

      const result = await service.exportUserData('nonexistent');

      expect(result.user).toBeNull();
      expect(result.contracts).toEqual([]);
    });

    it('should issue all 6 queries in parallel', async () => {
      (mockPool.query as jest.Mock).mockResolvedValue({ rows: [] });

      await service.exportUserData('user-123');

      expect(mockPool.query).toHaveBeenCalledTimes(6);
    });
  });

  describe('processPendingDeletions', () => {
    it('should process users pending deletion after 30-day cooling period', async () => {
      // Find pending users (pool.query). The erasure itself now runs entirely on a
      // connected client inside a single transaction (PRV4).
      (mockPool.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [{ id: 'user-to-delete' }] }); // pending users

      const result = await service.processPendingDeletions();

      expect(result.processed).toBe(1);
      expect(result.skipped).toBe(0);
      expect((mockPool.query as jest.Mock).mock.calls[0][0]).toContain('deletion_requested_at');
      // The transaction was opened and committed on a single client.
      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
    });

    it('should report skipped users on anonymization failure and roll back', async () => {
      (mockPool.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [{ id: 'user-fail' }] }); // pending users
      // Fail the first erasure statement (after BEGIN) so the transaction aborts.
      mockClient.query.mockReset();
      mockClient.query
        .mockResolvedValueOnce({ rows: [] }) // BEGIN
        .mockRejectedValueOnce(new Error('DB error')) // UPDATE users fails
        .mockResolvedValue({ rows: [] }); // ROLLBACK

      const result = await service.processPendingDeletions();

      expect(result.processed).toBe(0);
      expect(result.skipped).toBe(1);
      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
    });

    it('should return zero counts when no users are pending', async () => {
      (mockPool.query as jest.Mock).mockResolvedValueOnce({ rows: [] });

      const result = await service.processPendingDeletions();

      expect(result.processed).toBe(0);
      expect(result.skipped).toBe(0);
    });
  });

  describe('anonymization (via processPendingDeletions)', () => {
    // PRV4: the whole erasure now runs on a connected client inside one transaction,
    // so the scrub statements appear on mockClient.query (not mockPool.query). Find
    // statements by content rather than fixed index since order may evolve.
    const findClientCall = (needle: string) =>
      mockClient.query.mock.calls.find(
        (call) => typeof call[0] === 'string' && call[0].includes(needle),
      );

    it('should anonymize email, null password_hash, and set status to DELETED', async () => {
      const userId = 'anon-user';

      (mockPool.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [{ id: userId }] }); // pending users

      await service.processPendingDeletions();

      const updateCall = findClientCall('UPDATE users SET');
      expect(updateCall).toBeDefined();
      expect(updateCall![0]).toContain('password_hash = NULL');
      expect(updateCall![0]).toContain("status = 'DELETED'");
      expect(updateCall![1][0]).toBe(userId);
      expect(updateCall![1][1]).toBe(`deleted-${userId}@anonymized.styx`);
    });

    it('should scrub remaining identity/compliance PII columns on the user (PRV3)', async () => {
      const userId = 'pii-user';

      (mockPool.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [{ id: userId }] });

      await service.processPendingDeletions();

      const updateCall = findClientCall('UPDATE users SET');
      expect(updateCall).toBeDefined();
      expect(updateCall![0]).toContain('date_of_birth = NULL');
      expect(updateCall![0]).toContain('stripe_customer_id = NULL');
      expect(updateCall![0]).toContain("compliance_metadata = '{}'::jsonb");
      expect(updateCall![0]).toContain('identity_verification_id = NULL');
      expect(updateCall![0]).toContain('identity_provider = NULL');
      expect(updateCall![0]).toContain('terms_accepted_at = NULL');
      expect(updateCall![0]).toContain('terms_version = NULL');
    });

    it('should scrub partner email, fury subject alias, and dashboard snapshots (PRV3)', async () => {
      const userId = 'rel-user';

      (mockPool.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [{ id: userId }] });

      await service.processPendingDeletions();

      expect(findClientCall('accountability_partners')).toBeDefined();
      expect(findClientCall('partner_email = NULL')).toBeDefined();
      expect(findClientCall('subject_alias = NULL')).toBeDefined();
      expect(findClientCall('DELETE FROM dashboard_progress_snapshots')).toBeDefined();
    });

    it('should delete notifications for the user', async () => {
      const userId = 'notif-user';

      (mockPool.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [{ id: userId }] });

      await service.processPendingDeletions();

      const deleteCall = findClientCall('DELETE FROM notifications');
      expect(deleteCall).toBeDefined();
      expect(deleteCall![1]).toEqual([userId]);
    });

    it('should scrub contract metadata but preserve contract records', async () => {
      const userId = 'contract-user';

      (mockPool.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [{ id: userId }] });

      await service.processPendingDeletions();

      const contractCall = findClientCall('UPDATE contracts');
      expect(contractCall).toBeDefined();
      expect(contractCall![0]).toContain("metadata = '{}'::jsonb");
      expect(contractCall![1]).toEqual([userId]);
    });

    it('should log GDPR_ERASURE_COMPLETED event in the same transaction', async () => {
      const userId = 'event-user';

      (mockPool.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [{ id: userId }] });

      await service.processPendingDeletions();

      // The erasure event is a properly-chained append on the SAME connected client
      // (parameterized INSERT), committed atomically with the scrub statements.
      const eventCall = findClientCall('INSERT INTO event_log');
      expect(eventCall).toBeDefined();
      // Params: [sequence_index, event_type, payload, previous_hash, current_hash, created_at]
      expect(eventCall![1][1]).toBe('GDPR_ERASURE_COMPLETED');
      const payload = eventCall![1][2] as { userId: string; anonymizedAt: string };
      expect(payload.userId).toBe(userId);
      expect(payload.anonymizedAt).toBeDefined();
    });
  });
});
