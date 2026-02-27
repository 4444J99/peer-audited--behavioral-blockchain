import { ComplianceController } from './compliance.controller';
import { CompliancePolicyService } from './compliance-policy.service';
import { IdentityVerificationService } from './identity-verification.service';
import { Request } from 'express';

describe('ComplianceController', () => {
  let controller: ComplianceController;

  const mockPolicy = {
    getEligibility: jest.fn(),
  } as unknown as CompliancePolicyService;

  const mockIdentityVerification = {
    completeFromStripeWebhook: jest.fn(),
  } as unknown as IdentityVerificationService;

  beforeEach(() => {
    controller = new ComplianceController(mockPolicy, mockIdentityVerification);
    jest.clearAllMocks();
  });

  describe('eligibility', () => {
    it('should delegate to compliancePolicy.getEligibility', () => {
      const req = { headers: { 'cf-ipstate': 'CA' } } as unknown as Request;
      const expected = { requiredMode: 'FULL_ACCESS', jurisdiction: { state: 'CA' } };
      (mockPolicy.getEligibility as jest.Mock).mockReturnValue(expected);

      const result = controller.eligibility(req);
      expect(result).toEqual(expected);
      expect(mockPolicy.getEligibility).toHaveBeenCalledWith(req);
    });
  });

  describe('stripeIdentityWebhook', () => {
    it('should delegate to identityVerification.completeFromStripeWebhook', async () => {
      const body = { type: 'identity.verification_session.verified' };
      const expected = { applied: true, userId: 'user-1' };
      (mockIdentityVerification.completeFromStripeWebhook as jest.Mock).mockResolvedValue(expected);

      const result = await controller.stripeIdentityWebhook(body);
      expect(result).toEqual(expected);
      expect(mockIdentityVerification.completeFromStripeWebhook).toHaveBeenCalledWith(body);
    });

    it('should return applied=false for unsupported events', async () => {
      const body = { type: 'unsupported.event' };
      const expected = { applied: false, reason: 'unsupported_or_invalid_event' };
      (mockIdentityVerification.completeFromStripeWebhook as jest.Mock).mockResolvedValue(expected);

      const result = await controller.stripeIdentityWebhook(body);
      expect(result.applied).toBe(false);
    });
  });
});
