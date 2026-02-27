import { NotFoundException } from '@nestjs/common';
import { Pool } from 'pg';
import { IdentityVerificationService, VerificationStatus } from './identity-verification.service';
import {
  IdentityProviderService,
  IdentityProviderCompletionResult,
} from './identity-provider.service';

describe('IdentityVerificationService', () => {
  let service: IdentityVerificationService;
  let mockPool: { query: jest.Mock };
  let mockProvider: jest.Mocked<Pick<IdentityProviderService, 'startVerification' | 'parseStripeIdentityWebhook'>>;

  beforeEach(() => {
    mockPool = { query: jest.fn() };
    mockProvider = {
      startVerification: jest.fn(),
      parseStripeIdentityWebhook: jest.fn(),
    };
    service = new IdentityVerificationService(
      mockPool as any,
      mockProvider as unknown as IdentityProviderService,
    );
    jest.clearAllMocks();
  });

  // ─── getUserComplianceStatus ───

  describe('getUserComplianceStatus', () => {
    it('should return NOT_STARTED defaults when user not found', async () => {
      mockPool.query.mockResolvedValue({ rows: [], rowCount: 0 } as any);

      const result = await service.getUserComplianceStatus('user-missing');
      expect(result.userId).toBe('user-missing');
      expect(result.kycStatus).toBe('NOT_STARTED');
      expect(result.ageVerificationStatus).toBe('NOT_STARTED');
      expect(result.isKycVerified).toBe(false);
      expect(result.isAgeVerified).toBe(false);
      expect(result.identityProvider).toBe(null);
    });

    it('should return VERIFIED status when user has kyc_status = VERIFIED', async () => {
      mockPool.query.mockResolvedValue({
        rows: [{
          id: 'user-1',
          kyc_status: 'VERIFIED',
          age_verification_status: 'NOT_STARTED',
          identity_provider: 'STRIPE_IDENTITY',
          identity_verification_id: 'ivs_abc',
          identity_verified_at: new Date('2026-01-15T12:00:00Z'),
        }],
      } as any);

      const result = await service.getUserComplianceStatus('user-1');
      expect(result.isKycVerified).toBe(true);
      expect(result.kycStatus).toBe('VERIFIED');
      expect(result.identityProvider).toBe('STRIPE_IDENTITY');
      expect(result.identityVerifiedAt).toBe('2026-01-15T12:00:00.000Z');
    });

    it('should handle null kyc_status and default to NOT_STARTED', async () => {
      mockPool.query.mockResolvedValue({
        rows: [{
          id: 'user-2',
          kyc_status: null,
          age_verification_status: null,
          identity_provider: null,
          identity_verification_id: null,
          identity_verified_at: null,
        }],
      } as any);

      const result = await service.getUserComplianceStatus('user-2');
      expect(result.kycStatus).toBe('NOT_STARTED');
      expect(result.ageVerificationStatus).toBe('NOT_STARTED');
      expect(result.identityVerifiedAt).toBe(null);
    });

    it('should return PENDING status correctly', async () => {
      mockPool.query.mockResolvedValue({
        rows: [{
          id: 'user-3',
          kyc_status: 'PENDING',
          age_verification_status: 'PENDING',
          identity_provider: 'MOCK',
          identity_verification_id: 'ivs_mock_123',
          identity_verified_at: null,
        }],
      } as any);

      const result = await service.getUserComplianceStatus('user-3');
      expect(result.kycStatus).toBe('PENDING');
      expect(result.isKycVerified).toBe(false);
    });

    it('should normalize lowercase status to uppercase', async () => {
      mockPool.query.mockResolvedValue({
        rows: [{
          id: 'user-4',
          kyc_status: 'verified',
          age_verification_status: 'rejected',
          identity_provider: 'STRIPE_IDENTITY',
          identity_verification_id: 'ivs_456',
          identity_verified_at: new Date('2026-01-20'),
        }],
      } as any);

      const result = await service.getUserComplianceStatus('user-4');
      expect(result.kycStatus).toBe('VERIFIED');
      expect(result.ageVerificationStatus).toBe('REJECTED');
      expect(result.isKycVerified).toBe(true);
    });
  });

  // ─── recordVerificationStatus ───

  describe('recordVerificationStatus', () => {
    it('should update kyc_status and identity fields', async () => {
      mockPool.query.mockResolvedValue({ rowCount: 1 } as any);

      await service.recordVerificationStatus({
        userId: 'user-1',
        kycStatus: 'VERIFIED',
        identityProvider: 'STRIPE_IDENTITY',
        identityVerificationId: 'ivs_abc',
        verifiedAt: new Date('2026-01-15'),
      });

      expect(mockPool.query).toHaveBeenCalledTimes(1);
      const [sql, params] = mockPool.query.mock.calls[0];
      expect(sql).toContain('UPDATE users');
      expect(sql).toContain('kyc_status');
      expect(sql).toContain('identity_provider');
      expect(params[0]).toBe('user-1');
      expect(params).toContain('VERIFIED');
      expect(params).toContain('STRIPE_IDENTITY');
    });

    it('should not execute query when no fields to update', async () => {
      await service.recordVerificationStatus({ userId: 'user-1' });
      expect(mockPool.query).not.toHaveBeenCalled();
    });

    it('should update age_verification_status independently', async () => {
      mockPool.query.mockResolvedValue({ rowCount: 1 } as any);

      await service.recordVerificationStatus({
        userId: 'user-1',
        ageVerificationStatus: 'VERIFIED',
      });

      const [sql] = mockPool.query.mock.calls[0];
      expect(sql).toContain('age_verification_status');
    });

    it('should handle null verifiedAt', async () => {
      mockPool.query.mockResolvedValue({ rowCount: 1 } as any);

      await service.recordVerificationStatus({
        userId: 'user-1',
        kycStatus: 'PENDING',
        verifiedAt: null,
      });

      const params = mockPool.query.mock.calls[0][1];
      expect(params).toContain(null);
    });
  });

  // ─── startVerificationFlow ───

  describe('startVerificationFlow', () => {
    it('should throw NotFoundException when user does not exist', async () => {
      mockPool.query.mockResolvedValue({ rows: [] } as any);

      await expect(
        service.startVerificationFlow({ userId: 'missing', mode: 'KYC_ONLY' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should initiate verification and record PENDING status (KYC_ONLY)', async () => {
      mockPool.query
        .mockResolvedValueOnce({ rows: [{ id: 'user-1', email: 'test@styx.io' }] } as any)
        .mockResolvedValueOnce({ rowCount: 1 } as any);

      mockProvider.startVerification.mockResolvedValue({
        provider: 'MOCK',
        verificationId: 'ivs_mock_abc123',
        status: 'PENDING',
        hostedUrl: 'http://localhost:3001/settings?mockIdentity=1',
        clientSecret: null,
      });

      const result = await service.startVerificationFlow({
        userId: 'user-1',
        mode: 'KYC_ONLY',
        returnUrl: 'http://localhost:3001',
      });

      expect(result.provider).toBe('MOCK');
      expect(result.userId).toBe('user-1');
      expect(mockProvider.startVerification).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'user-1', email: 'test@styx.io', mode: 'KYC_ONLY' }),
      );
      // Should record PENDING kyc_status
      const recordCall = mockPool.query.mock.calls[1];
      expect(recordCall[0]).toContain('kyc_status');
    });

    it('should set both kyc and age status for KYC_AND_AGE mode', async () => {
      mockPool.query
        .mockResolvedValueOnce({ rows: [{ id: 'user-1', email: null }] } as any)
        .mockResolvedValueOnce({ rowCount: 1 } as any);

      mockProvider.startVerification.mockResolvedValue({
        provider: 'MOCK',
        verificationId: 'ivs_mock_xyz',
        status: 'PENDING',
        hostedUrl: null,
        clientSecret: null,
      });

      await service.startVerificationFlow({ userId: 'user-1', mode: 'KYC_AND_AGE' });

      const recordCall = mockPool.query.mock.calls[1];
      const sql = recordCall[0] as string;
      expect(sql).toContain('kyc_status');
      expect(sql).toContain('age_verification_status');
    });

    it('should set only age status for AGE_ONLY mode', async () => {
      mockPool.query
        .mockResolvedValueOnce({ rows: [{ id: 'user-1', email: 'a@b.com' }] } as any)
        .mockResolvedValueOnce({ rowCount: 1 } as any);

      mockProvider.startVerification.mockResolvedValue({
        provider: 'MOCK',
        verificationId: 'ivs_mock_age',
        status: 'PENDING',
        hostedUrl: null,
        clientSecret: null,
      });

      await service.startVerificationFlow({ userId: 'user-1', mode: 'AGE_ONLY' });

      const recordCall = mockPool.query.mock.calls[1];
      const sql = recordCall[0] as string;
      expect(sql).toContain('age_verification_status');
      expect(sql).not.toContain('kyc_status');
    });
  });

  // ─── completeMockVerification ───

  describe('completeMockVerification', () => {
    it('should apply completion and return updated compliance status', async () => {
      // applyProviderCompletion will call recordVerificationStatus
      mockPool.query
        .mockResolvedValueOnce({ rowCount: 1 } as any) // recordVerificationStatus UPDATE
        .mockResolvedValueOnce({ // getUserComplianceStatus SELECT
          rows: [{
            id: 'user-1',
            kyc_status: 'VERIFIED',
            age_verification_status: 'NOT_STARTED',
            identity_provider: 'MOCK',
            identity_verification_id: 'mock_manual_user-1',
            identity_verified_at: new Date(),
          }],
        } as any);

      const result = await service.completeMockVerification({
        userId: 'user-1',
        mode: 'KYC_ONLY',
        status: 'VERIFIED',
      });

      expect(result.isKycVerified).toBe(true);
      expect(result.userId).toBe('user-1');
    });

    it('should handle REJECTED status', async () => {
      mockPool.query
        .mockResolvedValueOnce({ rowCount: 1 } as any)
        .mockResolvedValueOnce({
          rows: [{
            id: 'user-1',
            kyc_status: 'REJECTED',
            age_verification_status: 'NOT_STARTED',
            identity_provider: 'MOCK',
            identity_verification_id: 'mock_manual_user-1',
            identity_verified_at: null,
          }],
        } as any);

      const result = await service.completeMockVerification({
        userId: 'user-1',
        mode: 'KYC_ONLY',
        status: 'REJECTED',
      });

      expect(result.isKycVerified).toBe(false);
      expect(result.kycStatus).toBe('REJECTED');
    });
  });

  // ─── completeFromStripeWebhook ───

  describe('completeFromStripeWebhook', () => {
    it('should return applied=false for unsupported event', async () => {
      mockProvider.parseStripeIdentityWebhook.mockReturnValue(null);

      const result = await service.completeFromStripeWebhook({ type: 'unrelated.event' });
      expect(result.applied).toBe(false);
      expect(result.reason).toBe('unsupported_or_invalid_event');
    });

    it('should apply verified webhook and return applied=true', async () => {
      const parsed: IdentityProviderCompletionResult = {
        provider: 'STRIPE_IDENTITY',
        verificationId: 'vs_abc',
        mode: 'KYC_ONLY',
        status: 'VERIFIED',
        userId: 'user-1',
        raw: {},
      };
      mockProvider.parseStripeIdentityWebhook.mockReturnValue(parsed);
      mockPool.query.mockResolvedValue({ rowCount: 1 } as any);

      const result = await service.completeFromStripeWebhook({
        type: 'identity.verification_session.verified',
        data: { object: { id: 'vs_abc', metadata: { styxUserId: 'user-1' } } },
      });

      expect(result.applied).toBe(true);
      expect(result.userId).toBe('user-1');
    });
  });

  // ─── applyProviderCompletion ───

  describe('applyProviderCompletion', () => {
    it('should look up user by verificationId when userId is not provided', async () => {
      mockPool.query
        .mockResolvedValueOnce({ rows: [{ id: 'user-found' }] } as any) // lookup
        .mockResolvedValueOnce({ rowCount: 1 } as any); // recordVerificationStatus

      await service.applyProviderCompletion({
        provider: 'STRIPE_IDENTITY',
        verificationId: 'vs_xyz',
        mode: 'KYC_ONLY',
        status: 'VERIFIED',
        userId: null,
      });

      expect(mockPool.query).toHaveBeenCalledTimes(2);
      const lookupCall = mockPool.query.mock.calls[0];
      expect(lookupCall[0]).toContain('identity_verification_id');
      expect(lookupCall[1]).toEqual(['vs_xyz']);
    });

    it('should throw NotFoundException when user lookup fails', async () => {
      mockPool.query.mockResolvedValue({ rows: [] } as any);

      await expect(
        service.applyProviderCompletion({
          provider: 'STRIPE_IDENTITY',
          verificationId: 'vs_missing',
          mode: 'KYC_ONLY',
          status: 'VERIFIED',
          userId: null,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should set verifiedAt to null for non-VERIFIED status', async () => {
      mockPool.query.mockResolvedValue({ rowCount: 1 } as any);

      await service.applyProviderCompletion({
        provider: 'MOCK',
        verificationId: 'mock_abc',
        mode: 'KYC_ONLY',
        status: 'FAILED',
        userId: 'user-1',
      });

      const recordCall = mockPool.query.mock.calls[0];
      const params = recordCall[1] as any[];
      // verifiedAt should be null for FAILED status
      expect(params).toContain(null);
    });
  });
});
