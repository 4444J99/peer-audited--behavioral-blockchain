import { GdprService } from './gdpr.service';
import { Pool } from 'pg';

const mockPool = {
  query: jest.fn(),
} as unknown as Pool;

describe('GdprService', () => {
  let service: GdprService;

  beforeEach(() => {
    service = new GdprService(mockPool);
    (mockPool.query as jest.Mock).mockReset();
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
      // Find pending users
      (mockPool.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [{ id: 'user-to-delete' }] }) // pending users
        // anonymizeUser calls:
        .mockResolvedValueOnce(undefined) // UPDATE users
        .mockResolvedValueOnce(undefined) // DELETE notifications
        .mockResolvedValueOnce(undefined) // UPDATE contracts
        .mockResolvedValueOnce(undefined); // INSERT event_log

      const result = await service.processPendingDeletions();

      expect(result.processed).toBe(1);
      expect(result.skipped).toBe(0);
    });

    it('should report skipped users on anonymization failure', async () => {
      (mockPool.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [{ id: 'user-fail' }] }) // pending users
        .mockRejectedValueOnce(new Error('DB error')); // anonymize fails

      const result = await service.processPendingDeletions();

      expect(result.processed).toBe(0);
      expect(result.skipped).toBe(1);
    });

    it('should return zero counts when no users are pending', async () => {
      (mockPool.query as jest.Mock).mockResolvedValueOnce({ rows: [] });

      const result = await service.processPendingDeletions();

      expect(result.processed).toBe(0);
      expect(result.skipped).toBe(0);
    });
  });

  describe('anonymization (via processPendingDeletions)', () => {
    it('should anonymize email, null password_hash, and set status to DELETED', async () => {
      const userId = 'anon-user';

      (mockPool.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [{ id: userId }] }) // pending users
        .mockResolvedValueOnce(undefined) // UPDATE users
        .mockResolvedValueOnce(undefined) // DELETE notifications
        .mockResolvedValueOnce(undefined) // UPDATE contracts
        .mockResolvedValueOnce(undefined); // INSERT event_log

      await service.processPendingDeletions();

      // Verify the UPDATE users query
      const updateCall = (mockPool.query as jest.Mock).mock.calls[1];
      expect(updateCall[0]).toContain('UPDATE users SET');
      expect(updateCall[0]).toContain('password_hash = NULL');
      expect(updateCall[0]).toContain("status = 'DELETED'");
      expect(updateCall[1][0]).toBe(userId);
      expect(updateCall[1][1]).toBe(`deleted-${userId}@anonymized.styx`);
    });

    it('should delete notifications for the user', async () => {
      const userId = 'notif-user';

      (mockPool.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [{ id: userId }] })
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(undefined);

      await service.processPendingDeletions();

      const deleteCall = (mockPool.query as jest.Mock).mock.calls[2];
      expect(deleteCall[0]).toContain('DELETE FROM notifications');
      expect(deleteCall[1]).toEqual([userId]);
    });

    it('should scrub contract metadata but preserve contract records', async () => {
      const userId = 'contract-user';

      (mockPool.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [{ id: userId }] })
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(undefined);

      await service.processPendingDeletions();

      const contractCall = (mockPool.query as jest.Mock).mock.calls[3];
      expect(contractCall[0]).toContain('UPDATE contracts');
      expect(contractCall[0]).toContain("metadata = '{}'::jsonb");
      expect(contractCall[1]).toEqual([userId]);
    });

    it('should log GDPR_ERASURE_COMPLETED event', async () => {
      const userId = 'event-user';

      (mockPool.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [{ id: userId }] })
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(undefined);

      await service.processPendingDeletions();

      const eventCall = (mockPool.query as jest.Mock).mock.calls[4];
      expect(eventCall[0]).toContain('INSERT INTO event_log');
      expect(eventCall[0]).toContain('GDPR_ERASURE_COMPLETED');
      const payload = JSON.parse(eventCall[1][0]);
      expect(payload.userId).toBe(userId);
      expect(payload.anonymizedAt).toBeDefined();
    });
  });
});
