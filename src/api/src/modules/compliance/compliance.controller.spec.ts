import { ComplianceController } from './compliance.controller';
import { CompliancePolicyService } from './compliance-policy.service';
import { IdentityVerificationService } from './identity-verification.service';
import { MedicalExemptionService } from './medical-exemption.service';
import { Request } from 'express';

describe('ComplianceController', () => {
  let controller: ComplianceController;

  const mockPolicy = {
    getEligibility: jest.fn(),
  } as unknown as CompliancePolicyService;

  const mockIdentityVerification = {
    completeFromStripeWebhook: jest.fn(),
  } as unknown as IdentityVerificationService;

  const mockMedicalExemption = {
    requestExemption: jest.fn(),
    approveExemption: jest.fn(),
  } as unknown as MedicalExemptionService;

  beforeEach(() => {
    controller = new ComplianceController(mockPolicy, mockIdentityVerification, mockMedicalExemption);
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
  });

  describe('requestMedicalExemption', () => {
    it('should delegate to medicalExemption.requestExemption', async () => {
      const user = { sub: 'user-1' };
      const body = { contractId: 'c-1', reason: 'Injured' };
      
      await controller.requestMedicalExemption(user, body);
      
      expect(mockMedicalExemption.requestExemption).toHaveBeenCalledWith({
        contractId: 'c-1',
        reason: 'Injured',
        userId: 'user-1'
      });
    });
  });

  describe('approveMedicalExemption', () => {
    it('should delegate to medicalExemption.approveExemption for admins', async () => {
      const user = { sub: 'admin-1', role: 'ADMIN' };
      const body = { contractId: 'c-1' };
      
      await controller.approveMedicalExemption(user, body);
      
      expect(mockMedicalExemption.approveExemption).toHaveBeenCalledWith('c-1', 'admin-1');
    });

    it('should throw for non-admins', async () => {
      const user = { sub: 'user-1', role: 'USER' };
      const body = { contractId: 'c-1' };
      
      await expect(controller.approveMedicalExemption(user, body)).rejects.toThrow('Admin access required');
    });
  });
});