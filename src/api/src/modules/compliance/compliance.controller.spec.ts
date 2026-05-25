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

  const makeRes = () => {
    const res: any = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
  };

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
    it('should verify and delegate, returning the service result as JSON', async () => {
      const req: any = { headers: { 'stripe-signature': 't=1,v1=abc' }, rawBody: Buffer.from('{}') };
      const res = makeRes();
      const expected = { applied: true, userId: 'user-1' };
      (mockIdentityVerification.completeFromStripeWebhook as jest.Mock).mockResolvedValue(expected);

      await controller.stripeIdentityWebhook(req, res);

      expect(mockIdentityVerification.completeFromStripeWebhook).toHaveBeenCalledWith({
        rawBody: req.rawBody,
        signature: 't=1,v1=abc',
      });
      expect(res.json).toHaveBeenCalledWith(expected);
    });

    it('should respond 400 for an invalid signature (forged event)', async () => {
      const req: any = { headers: {}, rawBody: Buffer.from('{}') };
      const res = makeRes();
      (mockIdentityVerification.completeFromStripeWebhook as jest.Mock).mockResolvedValue({
        applied: false,
        reason: 'invalid_signature',
      });

      await controller.stripeIdentityWebhook(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid signature' });
    });
  });

  describe('requestMedicalExemption', () => {
    it('should delegate to medicalExemption.requestExemption using user.id', async () => {
      const user = { id: 'user-1' };
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
    it('should delegate to medicalExemption.approveExemption using user.id', async () => {
      // Role enforcement is handled by RoleGuard/@Roles(ADMIN) at the route level.
      const user = { id: 'admin-1', role: 'ADMIN' };
      const body = { contractId: 'c-1' };

      await controller.approveMedicalExemption(user, body);

      expect(mockMedicalExemption.approveExemption).toHaveBeenCalledWith('c-1', 'admin-1');
    });
  });
});