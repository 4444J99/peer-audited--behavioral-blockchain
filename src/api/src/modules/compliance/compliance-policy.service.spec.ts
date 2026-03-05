import { CompliancePolicyService, ComplianceMode, ComplianceAction } from './compliance-policy.service';
import { IdentityVerificationService, UserComplianceStatus } from './identity-verification.service';
import { JurisdictionTier } from '../../../services/geofencing';
import { Request } from 'express';

describe('CompliancePolicyService', () => {
  let service: CompliancePolicyService;
  let mockIdentityVerification: jest.Mocked<Pick<IdentityVerificationService, 'getUserComplianceStatus'>>;

  const makeRequest = (overrides: Partial<Request> = {}): Request =>
    ({
      headers: {},
      method: 'GET',
      originalUrl: '/',
      url: '/',
      ...overrides,
    } as unknown as Request);

  beforeEach(() => {
    mockIdentityVerification = {
      getUserComplianceStatus: jest.fn(),
    };
    service = new CompliancePolicyService(
      {} as any, // pool (not used in policy evaluation tests)
      mockIdentityVerification as unknown as IdentityVerificationService,
    );
    jest.clearAllMocks();
    delete process.env.KYC_ENFORCEMENT_ENABLED;
    delete process.env.GEOFENCE_FAIL_OPEN_ON_MISSING_HEADERS;
    delete process.env.NODE_ENV;
  });

  // ─── Configuration flags ───

  describe('isKycEnforcementEnabled', () => {
    it('should return false by default', () => {
      expect(service.isKycEnforcementEnabled()).toBe(false);
    });

    it('should return true when env var is "true"', () => {
      process.env.KYC_ENFORCEMENT_ENABLED = 'true';
      expect(service.isKycEnforcementEnabled()).toBe(true);
    });

    it('should return true when env var is "TRUE" (case-insensitive)', () => {
      process.env.KYC_ENFORCEMENT_ENABLED = 'TRUE';
      expect(service.isKycEnforcementEnabled()).toBe(true);
    });

    it('should return false for any other value', () => {
      process.env.KYC_ENFORCEMENT_ENABLED = 'yes';
      expect(service.isKycEnforcementEnabled()).toBe(false);
    });
  });

  describe('isAgeEnforcementImplemented', () => {
    it('should return true (implemented via registration age gate)', () => {
      expect(service.isAgeEnforcementImplemented()).toBe(true);
    });
  });

  describe('shouldFailOpenOnMissingLocation', () => {
    it('should return false by default (fail-closed, Phase Beta P0-004)', () => {
      expect(service.shouldFailOpenOnMissingLocation()).toBe(false);
    });

    it('should return false when env var is "false"', () => {
      process.env.GEOFENCE_FAIL_OPEN_ON_MISSING_HEADERS = 'false';
      expect(service.shouldFailOpenOnMissingLocation()).toBe(false);
    });

    it('should return true only when explicitly set to "true"', () => {
      process.env.GEOFENCE_FAIL_OPEN_ON_MISSING_HEADERS = 'true';
      expect(service.shouldFailOpenOnMissingLocation()).toBe(true);
    });

    it('should return false for non-"true" values', () => {
      process.env.GEOFENCE_FAIL_OPEN_ON_MISSING_HEADERS = 'yes';
      expect(service.shouldFailOpenOnMissingLocation()).toBe(false);
    });
  });

  // ─── Action policy evaluation (canCreate / canSubmit / canPurchase) ───

  describe('canCreateContract', () => {
    it('should allow in TIER_1 jurisdiction', () => {
      const result = service.canCreateContract({ tier: JurisdictionTier.TIER_1, state: 'CA' });
      expect(result.allowed).toBe(true);
      expect(result.requiredMode).toBe('FULL_ACCESS');
    });

    it('should deny in TIER_2 jurisdiction (restricted refund-only action)', () => {
      const result = service.canCreateContract({ tier: JurisdictionTier.TIER_2, state: 'NY' });
      expect(result.allowed).toBe(false);
      expect(result.code).toBe('JURISDICTION_REFUND_ONLY_RESTRICTED');
      expect(result.requiredMode).toBe('REFUND_ONLY');
    });

    it('should deny in TIER_3 jurisdiction (hard block)', () => {
      const result = service.canCreateContract({ tier: JurisdictionTier.TIER_3, state: 'WA' });
      expect(result.allowed).toBe(false);
      expect(result.code).toBe('JURISDICTION_BLOCKED');
      expect(result.requiredMode).toBe('BLOCKED');
    });

    it('should include state name in TIER_2 restriction message', () => {
      const result = service.canCreateContract({ tier: JurisdictionTier.TIER_2, state: 'NY' });
      expect(result.message).toContain('NY');
    });

    it('should handle null state in TIER_2 message', () => {
      const result = service.canCreateContract({ tier: JurisdictionTier.TIER_2, state: null });
      expect(result.allowed).toBe(false);
      expect(result.message).not.toContain('null');
    });
  });

  describe('canSubmitProof', () => {
    it('should allow in TIER_1 jurisdiction', () => {
      const result = service.canSubmitProof({ tier: JurisdictionTier.TIER_1, state: 'TX' });
      expect(result.allowed).toBe(true);
    });

    it('should allow in TIER_2 jurisdiction (not a restricted action)', () => {
      const result = service.canSubmitProof({ tier: JurisdictionTier.TIER_2, state: 'NY' });
      expect(result.allowed).toBe(true);
      expect(result.requiredMode).toBe('REFUND_ONLY');
    });

    it('should deny in TIER_3 jurisdiction', () => {
      const result = service.canSubmitProof({ tier: JurisdictionTier.TIER_3, state: 'UT' });
      expect(result.allowed).toBe(false);
      expect(result.code).toBe('JURISDICTION_BLOCKED');
    });
  });

  describe('canPurchaseTicket', () => {
    it('should allow in TIER_1 jurisdiction', () => {
      const result = service.canPurchaseTicket({ tier: JurisdictionTier.TIER_1, state: 'FL' });
      expect(result.allowed).toBe(true);
    });

    it('should deny in TIER_2 jurisdiction (restricted refund-only action)', () => {
      const result = service.canPurchaseTicket({ tier: JurisdictionTier.TIER_2, state: 'PA' });
      expect(result.allowed).toBe(false);
      expect(result.code).toBe('JURISDICTION_REFUND_ONLY_RESTRICTED');
    });

    it('should deny in TIER_3 jurisdiction', () => {
      const result = service.canPurchaseTicket({ tier: JurisdictionTier.TIER_3, state: 'HI' });
      expect(result.allowed).toBe(false);
    });
  });

  // ─── getEligibility ───

  describe('getEligibility', () => {
    it('should return FULL_ACCESS for TIER_1 state (CA)', () => {
      const req = makeRequest({ headers: { 'cf-ipstate': 'CA' } });
      const result = service.getEligibility(req);
      expect(result.requiredMode).toBe('FULL_ACCESS');
      expect(result.jurisdiction.tier).toBe(JurisdictionTier.TIER_1);
      expect(result.jurisdiction.state).toBe('CA');
      expect(result.jurisdiction.source).toBe('cf-ipstate');
      expect(result.jurisdiction.missing).toBe(false);
      expect(result.actions.canCreateContract).toBe(true);
      expect(result.actions.canSubmitProof).toBe(true);
    });

    it('should return REFUND_ONLY for TIER_2 state (NY)', () => {
      const req = makeRequest({ headers: { 'cf-ipstate': 'NY' } });
      const result = service.getEligibility(req);
      expect(result.requiredMode).toBe('REFUND_ONLY');
      expect(result.actions.canCreateContract).toBe(false);
      expect(result.actions.canSubmitProof).toBe(true);
    });

    it('should return BLOCKED for TIER_3 state (WA)', () => {
      const req = makeRequest({ headers: { 'cf-ipstate': 'WA' } });
      const result = service.getEligibility(req);
      expect(result.requiredMode).toBe('BLOCKED');
      expect(result.actions.canCreateContract).toBe(false);
      expect(result.actions.canSubmitProof).toBe(false);
      expect(result.actions.canPurchaseTicket).toBe(false);
    });

    it('should use x-styx-state override in non-production', () => {
      process.env.NODE_ENV = 'development';
      const req = makeRequest({ headers: { 'x-styx-state': 'UT' } });
      const result = service.getEligibility(req);
      expect(result.jurisdiction.state).toBe('UT');
      expect(result.jurisdiction.source).toBe('x-styx-state');
      expect(result.requiredMode).toBe('BLOCKED');
    });

    it('should ignore x-styx-state in production', () => {
      process.env.NODE_ENV = 'production';
      const req = makeRequest({ headers: { 'x-styx-state': 'UT' } });
      const result = service.getEligibility(req);
      expect(result.jurisdiction.state).toBe(null);
      expect(result.jurisdiction.source).toBe('none');
    });

    it('should prefer cf-ipstate over x-styx-state', () => {
      const req = makeRequest({
        headers: { 'cf-ipstate': 'CA', 'x-styx-state': 'WA' },
      });
      const result = service.getEligibility(req);
      expect(result.jurisdiction.state).toBe('CA');
      expect(result.jurisdiction.source).toBe('cf-ipstate');
    });

    it('should return missing=true when no location headers present', () => {
      const req = makeRequest();
      const result = service.getEligibility(req);
      expect(result.jurisdiction.missing).toBe(true);
      expect(result.jurisdiction.source).toBe('none');
    });

    it('should default unknown states to TIER_1', () => {
      const req = makeRequest({ headers: { 'cf-ipstate': 'ZZ' } });
      const result = service.getEligibility(req);
      expect(result.requiredMode).toBe('FULL_ACCESS');
      expect(result.jurisdiction.tier).toBe(JurisdictionTier.TIER_1);
    });

    it('should normalize state header to uppercase', () => {
      const req = makeRequest({ headers: { 'cf-ipstate': 'ca' } });
      const result = service.getEligibility(req);
      expect(result.jurisdiction.state).toBe('CA');
    });

    it('should return KYC enforcement status in controls', () => {
      process.env.KYC_ENFORCEMENT_ENABLED = 'true';
      const req = makeRequest({ headers: { 'cf-ipstate': 'CA' } });
      const result = service.getEligibility(req);
      expect(result.controls.kycEnforcementEnabled).toBe(true);
      expect(result.controls.ageEnforcementImplemented).toBe(true);
    });
  });

  // ─── evaluateRequestPolicy ───

  describe('evaluateRequestPolicy', () => {
    it('should resolve action from POST /contracts to CREATE_CONTRACT', () => {
      const req = makeRequest({
        method: 'POST',
        originalUrl: '/contracts',
        headers: { 'cf-ipstate': 'CA' },
      });
      const result = service.evaluateRequestPolicy(req);
      expect(result.action).toBe('CREATE_CONTRACT');
      expect(result.allowed).toBe(true);
    });

    it('should resolve POST /contracts/:id/dispute to FILE_DISPUTE', () => {
      const req = makeRequest({
        method: 'POST',
        originalUrl: '/contracts/abc-123/dispute',
        headers: { 'cf-ipstate': 'CA' },
      });
      const result = service.evaluateRequestPolicy(req);
      expect(result.action).toBe('FILE_DISPUTE');
    });

    it('should resolve POST /contracts/:id/ticket to PURCHASE_TICKET', () => {
      const req = makeRequest({
        method: 'POST',
        originalUrl: '/contracts/abc-123/ticket',
        headers: { 'cf-ipstate': 'CA' },
      });
      const result = service.evaluateRequestPolicy(req);
      expect(result.action).toBe('PURCHASE_TICKET');
    });

    it('should resolve POST /contracts/:id/proof to SUBMIT_PROOF', () => {
      const req = makeRequest({
        method: 'POST',
        originalUrl: '/contracts/abc-123/proof',
        headers: { 'cf-ipstate': 'CA' },
      });
      const result = service.evaluateRequestPolicy(req);
      expect(result.action).toBe('SUBMIT_PROOF');
    });

    it('should resolve POST /proofs/upload-url to REQUEST_PROOF_UPLOAD_URL', () => {
      const req = makeRequest({
        method: 'POST',
        originalUrl: '/proofs/upload-url',
        headers: { 'cf-ipstate': 'CA' },
      });
      const result = service.evaluateRequestPolicy(req);
      expect(result.action).toBe('REQUEST_PROOF_UPLOAD_URL');
    });

    it('should resolve POST /proofs/:id/confirm-upload to CONFIRM_PROOF_UPLOAD', () => {
      const req = makeRequest({
        method: 'POST',
        originalUrl: '/proofs/abc-123/confirm-upload',
        headers: { 'cf-ipstate': 'CA' },
      });
      const result = service.evaluateRequestPolicy(req);
      expect(result.action).toBe('CONFIRM_PROOF_UPLOAD');
    });

    it('should resolve GET requests to READ_ONLY', () => {
      const req = makeRequest({
        method: 'GET',
        originalUrl: '/anything',
        headers: { 'cf-ipstate': 'CA' },
      });
      const result = service.evaluateRequestPolicy(req);
      expect(result.action).toBe('READ_ONLY');
    });

    it('should resolve unmatched POST to UNKNOWN', () => {
      const req = makeRequest({
        method: 'POST',
        originalUrl: '/unknown-path',
        headers: { 'cf-ipstate': 'CA' },
      });
      const result = service.evaluateRequestPolicy(req);
      expect(result.action).toBe('UNKNOWN');
    });

    it('should block when fail-closed (default) and no location headers', () => {
      const req = makeRequest({ method: 'POST', originalUrl: '/contracts' });
      const result = service.evaluateRequestPolicy(req);
      expect(result.allowed).toBe(false);
      expect(result.code).toBe('JURISDICTION_BLOCKED');
      expect(result.missingLocation).toBe(true);
    });

    it('should allow when fail-open is explicitly enabled and no location headers', () => {
      process.env.GEOFENCE_FAIL_OPEN_ON_MISSING_HEADERS = 'true';
      const req = makeRequest({ method: 'POST', originalUrl: '/contracts' });
      const result = service.evaluateRequestPolicy(req);
      expect(result.allowed).toBe(true);
      expect(result.missingLocation).toBe(true);
    });

    it('should set overrideIgnoredInProduction when override header present in production', () => {
      process.env.NODE_ENV = 'production';
      const req = makeRequest({
        method: 'GET',
        originalUrl: '/',
        headers: { 'x-styx-state': 'CA' },
      });
      const result = service.evaluateRequestPolicy(req);
      expect(result.overrideIgnoredInProduction).toBe(true);
      expect(result.state).toBe(null);
    });
  });

  // ─── evaluateKycRequirement (Phase Beta P0-003) ───

  describe('evaluateKycRequirement', () => {
    it('should always allow when KYC enforcement is disabled', async () => {
      const result = await service.evaluateKycRequirement('user-1', 500);
      expect(result.allowed).toBe(true);
    });

    it('should allow TIER_1 stakes ($20 or less) without KYC even when enforcement enabled', async () => {
      process.env.KYC_ENFORCEMENT_ENABLED = 'true';
      const result = await service.evaluateKycRequirement('user-1', 20);
      expect(result.allowed).toBe(true);
      expect(mockIdentityVerification.getUserComplianceStatus).not.toHaveBeenCalled();
    });

    it('should block stakes above $20 when KYC enabled and user unverified', async () => {
      process.env.KYC_ENFORCEMENT_ENABLED = 'true';
      mockIdentityVerification.getUserComplianceStatus.mockResolvedValue({
        userId: 'user-1',
        kycStatus: 'NOT_STARTED',
        ageVerificationStatus: 'NOT_STARTED',
        identityProvider: null,
        identityVerificationId: null,
        identityVerifiedAt: null,
        isKycVerified: false,
        isAgeVerified: false,
      });

      const result = await service.evaluateKycRequirement('user-1', 25);
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Identity verification required');
      expect(result.reason).toContain('$20');
    });

    it('should allow stakes above $20 when KYC enabled and user is verified', async () => {
      process.env.KYC_ENFORCEMENT_ENABLED = 'true';
      mockIdentityVerification.getUserComplianceStatus.mockResolvedValue({
        userId: 'user-1',
        kycStatus: 'VERIFIED',
        ageVerificationStatus: 'NOT_STARTED',
        identityProvider: 'STRIPE_IDENTITY',
        identityVerificationId: 'ivs_123',
        identityVerifiedAt: '2026-01-01T00:00:00Z',
        isKycVerified: true,
        isAgeVerified: false,
      });

      const result = await service.evaluateKycRequirement('user-1', 100);
      expect(result.allowed).toBe(true);
    });

    it('should block when identity verification service is missing', async () => {
      process.env.KYC_ENFORCEMENT_ENABLED = 'true';
      const serviceNoVerification = new CompliancePolicyService({} as any);
      const result = await serviceNoVerification.evaluateKycRequirement('user-1', 50);
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Identity verification required');
    });

    it('should allow exactly $20 without KYC (boundary)', async () => {
      process.env.KYC_ENFORCEMENT_ENABLED = 'true';
      const result = await service.evaluateKycRequirement('user-1', 20);
      expect(result.allowed).toBe(true);
    });

    it('should block $20.01 without KYC (boundary)', async () => {
      process.env.KYC_ENFORCEMENT_ENABLED = 'true';
      mockIdentityVerification.getUserComplianceStatus.mockResolvedValue({
        userId: 'user-1',
        kycStatus: 'NOT_STARTED',
        ageVerificationStatus: 'NOT_STARTED',
        identityProvider: null,
        identityVerificationId: null,
        identityVerifiedAt: null,
        isKycVerified: false,
        isAgeVerified: false,
      });

      const result = await service.evaluateKycRequirement('user-1', 20.01);
      expect(result.allowed).toBe(false);
    });
  });

  // ─── evaluateUserComplianceForRequest ───

  describe('evaluateUserComplianceForRequest', () => {
    it('should return base policy denial if jurisdiction blocks', async () => {
      const req = makeRequest({
        method: 'POST',
        originalUrl: '/contracts',
        headers: { 'cf-ipstate': 'WA' },
      });
      const result = await service.evaluateUserComplianceForRequest(req, 'user-1');
      expect(result.allowed).toBe(false);
      expect(result.code).toBe('JURISDICTION_BLOCKED');
    });

    it('should allow without KYC check when enforcement is disabled', async () => {
      const req = makeRequest({
        method: 'POST',
        originalUrl: '/contracts',
        headers: { 'cf-ipstate': 'CA' },
      });
      const result = await service.evaluateUserComplianceForRequest(req, 'user-1');
      expect(result.allowed).toBe(true);
      expect(mockIdentityVerification.getUserComplianceStatus).not.toHaveBeenCalled();
    });

    it('should require KYC for gated action when enforcement is enabled and user is not verified', async () => {
      process.env.KYC_ENFORCEMENT_ENABLED = 'true';
      mockIdentityVerification.getUserComplianceStatus.mockResolvedValue({
        userId: 'user-1',
        kycStatus: 'NOT_STARTED',
        ageVerificationStatus: 'NOT_STARTED',
        identityProvider: null,
        identityVerificationId: null,
        identityVerifiedAt: null,
        isKycVerified: false,
        isAgeVerified: false,
      });

      const req = makeRequest({
        method: 'POST',
        originalUrl: '/contracts',
        headers: { 'cf-ipstate': 'CA' },
      });
      const result = await service.evaluateUserComplianceForRequest(req, 'user-1');
      expect(result.allowed).toBe(false);
      expect(result.code).toBe('KYC_REQUIRED');
    });

    it('should allow gated action when KYC enforcement is enabled and user is verified', async () => {
      process.env.KYC_ENFORCEMENT_ENABLED = 'true';
      mockIdentityVerification.getUserComplianceStatus.mockResolvedValue({
        userId: 'user-1',
        kycStatus: 'VERIFIED',
        ageVerificationStatus: 'NOT_STARTED',
        identityProvider: 'STRIPE_IDENTITY',
        identityVerificationId: 'ivs_123',
        identityVerifiedAt: '2026-01-01T00:00:00Z',
        isKycVerified: true,
        isAgeVerified: false,
      });

      const req = makeRequest({
        method: 'POST',
        originalUrl: '/contracts',
        headers: { 'cf-ipstate': 'CA' },
      });
      const result = await service.evaluateUserComplianceForRequest(req, 'user-1');
      expect(result.allowed).toBe(true);
    });

    it('should skip KYC check for non-gated actions even when enforcement is enabled', async () => {
      process.env.KYC_ENFORCEMENT_ENABLED = 'true';
      const req = makeRequest({
        method: 'POST',
        originalUrl: '/contracts/abc/proof',
        headers: { 'cf-ipstate': 'CA' },
      });
      const result = await service.evaluateUserComplianceForRequest(req, 'user-1');
      expect(result.allowed).toBe(true);
      expect(mockIdentityVerification.getUserComplianceStatus).not.toHaveBeenCalled();
    });

    it('should handle missing identityVerification service gracefully', async () => {
      process.env.KYC_ENFORCEMENT_ENABLED = 'true';
      const serviceNoVerification = new CompliancePolicyService({} as any);
      const req = makeRequest({
        method: 'POST',
        originalUrl: '/contracts',
        headers: { 'cf-ipstate': 'CA' },
      });
      const result = await serviceNoVerification.evaluateUserComplianceForRequest(req, 'user-1');
      expect(result.allowed).toBe(false);
      expect(result.code).toBe('KYC_REQUIRED');
    });
  });
});
