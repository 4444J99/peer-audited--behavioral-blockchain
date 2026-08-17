import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { IdentityVerificationService } from '../compliance/identity-verification.service';

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: { getProfile: jest.Mock };
  let identityVerification: any;
  let pushTokens: { registerToken: jest.Mock };
  let ccpaService: {
    verifyCaliforniaResident: jest.Mock;
    requestDataDeletion: jest.Mock;
    getDeletionRequestStatus: jest.Mock;
    optOutSale: jest.Mock;
  };

  beforeEach(() => {
    usersService = {
      getProfile: jest.fn(),
    };
    identityVerification = {
      getUserComplianceStatus: jest.fn(),
      startVerificationFlow: jest.fn(),
      completeMockVerification: jest.fn(),
    };
    pushTokens = {
      registerToken: jest.fn(),
    };
    ccpaService = {
      verifyCaliforniaResident: jest.fn(),
      requestDataDeletion: jest.fn(),
      getDeletionRequestStatus: jest.fn(),
      optOutSale: jest.fn(),
    };

    controller = new UsersController(
      usersService as unknown as UsersService,
      { exportUserData: jest.fn() } as any,
      identityVerification as unknown as IdentityVerificationService,
      pushTokens as any,
      {
        createContract: jest.fn(),
        suspendPregnancyExcludedContracts: jest.fn(),
      } as any,  // ContractsService mock
      ccpaService as any,  // CcpaService mock
    );
  });

  describe('getMe', () => {
    it('should return profile including compliance fields from UsersService', async () => {
      usersService.getProfile.mockResolvedValueOnce({
        id: 'user-1',
        email: 'demo@styx.protocol',
        integrity_score: 75,
        role: 'USER',
        status: 'ACTIVE',
        created_at: '2026-01-01T00:00:00.000Z',
        compliance: {
          kyc_status: 'VERIFIED',
          age_verification_status: 'VERIFIED',
          identity_provider: 'STRIPE_IDENTITY',
          identity_verification_id: 'vs_123',
          identity_verified_at: '2026-01-01T01:00:00.000Z',
          is_kyc_verified: true,
          is_age_verified: true,
        },
      });

      const result = await controller.getMe({ id: 'user-1' });

      expect(result.compliance).toEqual(expect.objectContaining({
        kyc_status: 'VERIFIED',
        age_verification_status: 'VERIFIED',
        is_kyc_verified: true,
        is_age_verified: true,
      }));
      expect(usersService.getProfile).toHaveBeenCalledWith('user-1');
    });
  });

  describe('registerPushToken', () => {
    it('should register a valid push token', async () => {
      const result = await controller.registerPushToken(
        { id: 'user-1' },
        { token: 'ExponentPushToken[xxx]', platform: 'ios' },
      );

      expect(result).toEqual({ success: true });
      expect(pushTokens.registerToken).toHaveBeenCalledWith(
        'user-1', 'ExponentPushToken[xxx]', 'ios', undefined,
      );
    });

    it('should throw for missing token', async () => {
      await expect(
        controller.registerPushToken(
          { id: 'user-1' },
          { token: '' },
        ),
      ).rejects.toThrow('token is required');
    });
  });

  describe('createCcpaDeletionRequest', () => {
    it('should create a deletion request for a California resident', async () => {
      ccpaService.verifyCaliforniaResident.mockResolvedValueOnce(true);
      const request = {
        userId: 'user-1',
        requestType: 'DELETE',
        status: 'PENDING',
        requestedAt: new Date('2026-07-30T00:00:00.000Z'),
      };
      ccpaService.requestDataDeletion.mockResolvedValueOnce(request);

      const result = await controller.createCcpaDeletionRequest({ id: 'user-1' });

      expect(result).toEqual(request);
      expect(ccpaService.verifyCaliforniaResident).toHaveBeenCalledWith('user-1');
      expect(ccpaService.requestDataDeletion).toHaveBeenCalledWith('user-1');
    });

    it('should reject non-California residents without creating a request', async () => {
      ccpaService.verifyCaliforniaResident.mockResolvedValueOnce(false);

      await expect(
        controller.createCcpaDeletionRequest({ id: 'user-2' }),
      ).rejects.toThrow(
        'CCPA deletion requests are available to California residents only',
      );
      expect(ccpaService.requestDataDeletion).not.toHaveBeenCalled();
    });
  });

  describe('getCcpaDeletionRequestStatus', () => {
    it('should return the latest deletion request for the user', async () => {
      const request = {
        userId: 'user-1',
        requestType: 'DELETE',
        status: 'COMPLETED',
        requestedAt: new Date('2026-07-01T00:00:00.000Z'),
        completedAt: new Date('2026-07-15T00:00:00.000Z'),
      };
      ccpaService.getDeletionRequestStatus.mockResolvedValueOnce(request);

      const result = await controller.getCcpaDeletionRequestStatus({ id: 'user-1' });

      expect(result).toEqual(request);
      expect(ccpaService.getDeletionRequestStatus).toHaveBeenCalledWith('user-1');
    });

    it('should throw NotFound when the user has no deletion request', async () => {
      ccpaService.getDeletionRequestStatus.mockResolvedValueOnce(null);

      await expect(
        controller.getCcpaDeletionRequestStatus({ id: 'user-1' }),
      ).rejects.toThrow('No CCPA deletion request found');
    });
  });

  describe('ccpaOptOutSale', () => {
    it('should record a do-not-sell opt-out for the authenticated user', async () => {
      const optOut = {
        userId: 'user-1',
        optedOut: true,
        requestedAt: new Date('2026-07-30T00:00:00.000Z'),
      };
      ccpaService.optOutSale.mockResolvedValueOnce(optOut);

      const result = await controller.ccpaOptOutSale({ id: 'user-1' });

      expect(result).toEqual(optOut);
      expect(ccpaService.optOutSale).toHaveBeenCalledWith('user-1');
    });
  });

  describe('startIdentityVerification', () => {
    it('should default mode to KYC_AND_AGE', async () => {
      identityVerification.startVerificationFlow.mockResolvedValueOnce({
        userId: 'user-1',
        provider: 'MOCK',
        verificationId: 'ivs_mock_1',
        status: 'PENDING',
      });

      const result = await controller.startIdentityVerification(
        { id: 'user-1' },
        {},
      );

      expect(result.provider).toBe('MOCK');
      expect(identityVerification.startVerificationFlow).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-1',
          mode: 'KYC_AND_AGE',
        }),
      );
    });
  });
});
