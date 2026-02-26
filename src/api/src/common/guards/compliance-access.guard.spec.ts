import { ForbiddenException } from '@nestjs/common';
import { ComplianceAccessGuard } from './compliance-access.guard';
import { CompliancePolicyService } from '../../modules/compliance/compliance-policy.service';

describe('ComplianceAccessGuard', () => {
  let guard: ComplianceAccessGuard;
  let compliancePolicy: { evaluateUserComplianceForRequest: jest.Mock };

  beforeEach(() => {
    compliancePolicy = {
      evaluateUserComplianceForRequest: jest.fn(),
    };
    guard = new ComplianceAccessGuard(compliancePolicy as unknown as CompliancePolicyService);
  });

  function createContext(input?: { user?: { id?: string }; method?: string; url?: string }) {
    const hasUserKey = !!input && Object.prototype.hasOwnProperty.call(input, 'user');
    const req = {
      method: input?.method || 'POST',
      url: input?.url || '/contracts',
      originalUrl: input?.url || '/contracts',
      user: hasUserKey ? input?.user : { id: 'user-1' },
      headers: {},
    };

    return {
      switchToHttp: () => ({
        getRequest: () => req,
      }),
    } as any;
  }

  it('should allow when no authenticated user is attached yet', async () => {
    const result = await guard.canActivate(createContext({ user: undefined }));
    expect(result).toBe(true);
    expect(compliancePolicy.evaluateUserComplianceForRequest).not.toHaveBeenCalled();
  });

  it('should allow when compliance policy permits the request', async () => {
    compliancePolicy.evaluateUserComplianceForRequest.mockResolvedValueOnce({
      allowed: true,
      requiredMode: 'FULL_ACCESS',
    });

    await expect(guard.canActivate(createContext())).resolves.toBe(true);
    expect(compliancePolicy.evaluateUserComplianceForRequest).toHaveBeenCalled();
  });

  it('should throw ForbiddenException with KYC_REQUIRED payload when policy denies', async () => {
    compliancePolicy.evaluateUserComplianceForRequest.mockResolvedValueOnce({
      allowed: false,
      code: 'KYC_REQUIRED',
      message: 'Identity verification is required before performing this monetized action.',
      requiredMode: 'FULL_ACCESS',
    });

    try {
      await guard.canActivate(createContext());
      fail('Expected guard to throw');
    } catch (err) {
      expect(err).toBeInstanceOf(ForbiddenException);
      const response = (err as ForbiddenException).getResponse() as any;
      expect(response.code).toBe('KYC_REQUIRED');
      expect(response.requiredMode).toBe('FULL_ACCESS');
    }
  });
});
