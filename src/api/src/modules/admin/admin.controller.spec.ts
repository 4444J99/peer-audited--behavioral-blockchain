import { AdminController } from './admin.controller';
import { ModerationService } from '../../../services/security/moderation.service';
import { HoneypotService } from '../../../services/intelligence/honeypot.service';
import { AnomalyService } from '../../../services/anomaly/anomaly.service';
import { ContractsService } from '../contracts/contracts.service';
import { Pool } from 'pg';
import { IdentityVerificationService } from '../compliance/identity-verification.service';

describe('AdminController', () => {
  let controller: AdminController;
  let mockPool: { query: jest.Mock };
  let mockAnomaly: { computePHash: jest.Mock; hammingDistance: jest.Mock };

  const mockModeration = {
    banUser: jest.fn(),
  } as unknown as ModerationService;

  const mockHoneypot = {
    injectHoneypot: jest.fn(),
  } as unknown as HoneypotService;

  const mockContracts = {
    resolveContract: jest.fn(),
  } as unknown as ContractsService;

  const mockIdentityVerification = {
    completeMockVerification: jest.fn(),
  } as unknown as IdentityVerificationService;

  beforeEach(() => {
    mockPool = { query: jest.fn() };
    mockAnomaly = {
      computePHash: jest.fn().mockReturnValue('0000000000000000'),
      hammingDistance: jest.fn().mockReturnValue(10),
    };
    controller = new AdminController(
      mockModeration,
      mockHoneypot as any,
      mockContracts,
      {} as any,
      {} as any,
      mockAnomaly as unknown as AnomalyService,
      { verifyChain: jest.fn() } as any,
      mockIdentityVerification,
      mockPool as unknown as Pool,
    );
    jest.clearAllMocks();
  });

  describe('injectHoneypot', () => {
    it('should delegate to HoneypotService and return status', async () => {
      (mockHoneypot.injectHoneypot as jest.Mock).mockResolvedValueOnce(undefined);

      const result = await controller.injectHoneypot();

      expect(result).toEqual({ status: 'honeypot_injected' });
      expect(mockHoneypot.injectHoneypot).toHaveBeenCalledTimes(1);
    });
  });

  describe('banUser', () => {
    it('should delegate to ModerationService with correct params', async () => {
      (mockModeration.banUser as jest.Mock).mockResolvedValueOnce({
        status: 'USER_PERMANENTLY_BANNED',
        eventId: 'evt-1',
      });

      const result = await controller.banUser(
        'target-user-1',
        { id: 'ADMIN_root' },
        { reason: 'Repeated fraud violations' },
      );

      expect(result).toEqual({
        status: 'USER_PERMANENTLY_BANNED',
        eventId: 'evt-1',
      });
      expect(mockModeration.banUser).toHaveBeenCalledWith(
        'ADMIN_root',
        'target-user-1',
        'Repeated fraud violations',
      );
    });

    it('should propagate ForbiddenException from ModerationService for non-admin', async () => {
      (mockModeration.banUser as jest.Mock).mockRejectedValueOnce(
        new Error('User non-admin lacks the required ADMIN role'),
      );

      await expect(
        controller.banUser(
          'target-user-1',
          { id: 'non-admin' },
          { reason: 'test' },
        ),
      ).rejects.toThrow(/ADMIN role/);
    });
  });

  describe('resolveContract', () => {
    it('should delegate to ContractsService and return result', async () => {
      (mockContracts.resolveContract as jest.Mock).mockResolvedValueOnce(undefined);

      const result = await controller.resolveContract('contract-1', { outcome: 'COMPLETED' });

      expect(result).toEqual({ status: 'resolved', contractId: 'contract-1', outcome: 'COMPLETED' });
      expect(mockContracts.resolveContract).toHaveBeenCalledWith('contract-1', 'COMPLETED');
    });
  });

  describe('getStats', () => {
    it('should return system statistics', async () => {
      mockPool.query
        .mockResolvedValueOnce({ rows: [{ count: '42' }] })
        .mockResolvedValueOnce({ rows: [{ count: '10' }] })
        .mockResolvedValueOnce({ rows: [{ count: '5' }] })
        .mockResolvedValueOnce({ rows: [{ avg: '67.5' }] })
        .mockResolvedValueOnce({ rows: [{ count: '3' }] });

      const result = await controller.getStats();

      expect(result).toEqual({
        totalUsers: 42,
        activeContracts: 10,
        pendingProofs: 5,
        avgIntegrity: 67.5,
        pendingDisputes: 3,
      });
    });
  });

  describe('completeIdentityVerificationForUser', () => {
    it('should delegate to IdentityVerificationService mock completion', async () => {
      (mockIdentityVerification.completeMockVerification as jest.Mock).mockResolvedValueOnce({
        userId: 'user-1',
        kycStatus: 'VERIFIED',
        ageVerificationStatus: 'VERIFIED',
      });

      const result = await controller.completeIdentityVerificationForUser('user-1', {
        mode: 'KYC_AND_AGE',
        status: 'VERIFIED',
      });

      expect(result).toEqual(expect.objectContaining({ userId: 'user-1', kycStatus: 'VERIFIED' }));
      expect(mockIdentityVerification.completeMockVerification).toHaveBeenCalledWith({
        userId: 'user-1',
        mode: 'KYC_AND_AGE',
        status: 'VERIFIED',
      });
    });
  });

  describe('scanHashCollisions', () => {
    it('should return empty collisions when no proofs have close hashes', async () => {
      mockPool.query.mockResolvedValueOnce({
        rows: [
          { id: 'p1', user_id: 'u1', contract_id: 'c1', media_uri: 'file://a.mp4', submitted_at: '2026-01-01' },
          { id: 'p2', user_id: 'u2', contract_id: 'c2', media_uri: 'file://b.mp4', submitted_at: '2026-01-02' },
        ],
      });
      mockAnomaly.computePHash.mockReturnValueOnce('aaaa').mockReturnValueOnce('bbbb');
      mockAnomaly.hammingDistance.mockReturnValueOnce(30);

      const result = await controller.scanHashCollisions();

      expect(result.collisions).toHaveLength(0);
    });

    it('should detect collisions when hashes are within threshold', async () => {
      mockPool.query.mockResolvedValueOnce({
        rows: [
          { id: 'p1', user_id: 'u1', contract_id: 'c1', media_uri: 'file://a.mp4', submitted_at: '2026-01-01' },
          { id: 'p2', user_id: 'u2', contract_id: 'c2', media_uri: 'file://a-copy.mp4', submitted_at: '2026-01-02' },
        ],
      });
      mockAnomaly.computePHash.mockReturnValueOnce('aaaa').mockReturnValueOnce('aaaa');
      mockAnomaly.hammingDistance.mockReturnValueOnce(0);

      const result = await controller.scanHashCollisions();

      expect(result.collisions).toHaveLength(1);
      expect(result.collisions[0].origin.id).toBe('p1');
      expect(result.collisions[0].duplicate.id).toBe('p2');
    });
  });

  describe('getReconciliationVisibility', () => {
    it('should return reconciliation contracts, dispute side effects, and summary', async () => {
      mockPool.query
        .mockResolvedValueOnce({ rows: [{ id: 'c1', status: 'RECONCILE_REQUIRED' }] })
        .mockResolvedValueOnce({ rows: [{ id: 'fx1', outcome: 'DISPUTE_UPHELD', effect_type: 'STRIPE_CAPTURE_APPEAL_FEE' }] })
        .mockResolvedValueOnce({ rows: [{ contract_reconcile_required_count: 1, dispute_fee_side_effect_backlog_count: 1 }] });

      const result = await controller.getReconciliationVisibility('25');

      expect(result.summary).toEqual({
        contract_reconcile_required_count: 1,
        dispute_fee_side_effect_backlog_count: 1,
      });
      expect(result.contracts).toHaveLength(1);
      expect(result.disputeFeeSideEffects).toHaveLength(1);
    });
  });
});
