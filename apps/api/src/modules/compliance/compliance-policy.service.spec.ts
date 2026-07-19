jest.mock('geoip-lite', () => ({ lookup: jest.fn() }));

import { CompliancePolicyService, ComplianceMode, ComplianceAction } from './compliance-policy.service';
import { IdentityVerificationService, UserComplianceStatus } from './identity-verification.service';
import { JurisdictionTier } from '../../../services/geofencing';
import { Request } from 'express';
import * as geoip from 'geoip-lite';

const mockLookup = geoip.lookup as jest.Mock;

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
    // Default pool returns an adult date_of_birth so the unconditional age gate on
    // monetized actions passes unless a test overrides it.
    service = new CompliancePolicyService(
      { query: jest.fn().mockResolvedValue({ rows: [{ date_of_birth: '1990-01-01' }] }) } as any,
      mockIdentityVerification as unknown as IdentityVerificationService,
    );
    jest.clearAllMocks();
    mockLookup.mockReset();
    delete process.env.GEO_MISSING_HEADER_ACTION;
    delete process.env.KYC_ENFORCEMENT_ENABLED;
    delete process.env.GEOFENCE_FAIL_OPEN_ON_MISSING_HEADERS;
    delete process.env.NODE_ENV;
    // Trust proxy/CDN geo headers in tests that simulate a Cloudflare-fronted request
    // (cf-ipstate). Hardened default is OFF in production.
    process.env.TRUST_PROXY_HEADERS = 'true';
  });

  afterEach(() => {
    delete process.env.TRUST_PROXY_HEADERS;
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

    // PRV16: fail closed in production — enforced by default, disabled only explicitly.
    it('should return true by default in production (fail closed)', () => {
      process.env.NODE_ENV = 'production';
      delete process.env.KYC_ENFORCEMENT_ENABLED;
      expect(service.isKycEnforcementEnabled()).toBe(true);
    });

    it('should return false in production only when explicitly set to "false"', () => {
      process.env.NODE_ENV = 'production';
      process.env.KYC_ENFORCEMENT_ENABLED = 'false';
      expect(service.isKycEnforcementEnabled()).toBe(false);
    });

    it('should return true in production when explicitly enabled', () => {
      process.env.NODE_ENV = 'production';
      process.env.KYC_ENFORCEMENT_ENABLED = 'true';
      expect(service.isKycEnforcementEnabled()).toBe(true);
    });
  });

  describe('onModuleInit (PRV16 startup warning)', () => {
    it('should warn loudly on startup when KYC enforcement is disabled', () => {
      const warnSpy = jest
        .spyOn((service as any).logger, 'warn')
        .mockImplementation(() => undefined);
      service.onModuleInit();
      expect(warnSpy).toHaveBeenCalledWith(expect.stringMatching(/KYC enforcement is DISABLED/i));
    });

    it('should not warn when KYC enforcement is enabled', () => {
      process.env.KYC_ENFORCEMENT_ENABLED = 'true';
      const warnSpy = jest
        .spyOn((service as any).logger, 'warn')
        .mockImplementation(() => undefined);
      service.onModuleInit();
      expect(warnSpy).not.toHaveBeenCalled();
    });

    it('should NOT warn in production by default (KYC is enforced there)', () => {
      process.env.NODE_ENV = 'production';
      delete process.env.KYC_ENFORCEMENT_ENABLED;
      const warnSpy = jest.spyOn((service as any).logger, 'warn').mockImplementation(() => undefined);
      const errorSpy = jest.spyOn((service as any).logger, 'error').mockImplementation(() => undefined);
      service.onModuleInit();
      expect(warnSpy).not.toHaveBeenCalled();
      expect(errorSpy).not.toHaveBeenCalled();
    });

    it('should log an ERROR when KYC is explicitly disabled in production', () => {
      process.env.NODE_ENV = 'production';
      process.env.KYC_ENFORCEMENT_ENABLED = 'false';
      const errorSpy = jest
        .spyOn((service as any).logger, 'error')
        .mockImplementation(() => undefined);
      service.onModuleInit();
      expect(errorSpy).toHaveBeenCalledWith(expect.stringMatching(/PRODUCTION has KYC_ENFORCEMENT_ENABLED=false/i));
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

    it('should fail closed in production when no explicit setting is present', () => {
      process.env.NODE_ENV = 'production';
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

    it('should honor GEO_MISSING_HEADER_ACTION=allow in production', () => {
      process.env.NODE_ENV = 'production';
      process.env.GEO_MISSING_HEADER_ACTION = 'allow';
      expect(service.shouldFailOpenOnMissingLocation()).toBe(true);
    });

    it('should honor GEO_MISSING_HEADER_ACTION=block in production', () => {
      process.env.NODE_ENV = 'production';
      process.env.GEO_MISSING_HEADER_ACTION = 'block';
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

    it('should ignore x-styx-state in production (and fail closed when no real geo signal)', () => {
      process.env.NODE_ENV = 'production';
      const req = makeRequest({ headers: { 'x-styx-state': 'UT' } });
      const result = service.getEligibility(req);
      expect(result.jurisdiction.state).toBe(null);
      expect(result.jurisdiction.source).toBe('none');
      // No trustworthy location -> fail closed (most-restrictive).
      expect(result.requiredMode).toBe('BLOCKED');
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

    it('should fail closed (BLOCKED) in production when location is missing and no explicit action is set', () => {
      process.env.NODE_ENV = 'production';
      const req = makeRequest();
      const result = service.getEligibility(req);
      expect(result.requiredMode).toBe('BLOCKED');
      expect(result.actions.canCreateContract).toBe(false);
      expect(result.actions.canSubmitProof).toBe(false);
      expect(result.actions.canPurchaseTicket).toBe(false);
    });

    it('should default unknown states to TIER_3', () => {
      const req = makeRequest({ headers: { 'cf-ipstate': 'ZZ' } });
      const result = service.getEligibility(req);
      expect(result.requiredMode).toBe('BLOCKED');
      expect(result.jurisdiction.tier).toBe(JurisdictionTier.TIER_3);
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

    it('should allow in production when GEO_MISSING_HEADER_ACTION=allow and no location headers', () => {
      process.env.NODE_ENV = 'production';
      process.env.GEO_MISSING_HEADER_ACTION = 'allow';
      const req = makeRequest({ method: 'POST', originalUrl: '/contracts' });
      const result = service.evaluateRequestPolicy(req);
      expect(result.allowed).toBe(true);
      expect(result.missingLocation).toBe(true);
    });

    it('should resolve state from request IP when location headers are missing', () => {
      mockLookup.mockReturnValue({ country: 'US', region: 'CA' });
      const req = makeRequest({
        method: 'GET',
        originalUrl: '/contracts',
        headers: { 'x-forwarded-for': '8.8.8.8' },
      });
      const result = service.evaluateRequestPolicy(req);
      expect(result.allowed).toBe(true);
      expect(result.state).toBe('CA');
      expect(result.stateSource).toBe('ip-lookup');
      expect(result.missingLocation).toBe(false);
    });

    it('should use IP lookup in production even when x-styx-state override is ignored', () => {
      process.env.NODE_ENV = 'production';
      mockLookup.mockReturnValue({ country: 'US', region: 'NY' });
      const req = makeRequest({
        method: 'GET',
        originalUrl: '/contracts',
        headers: {
          'x-styx-state': 'WA',
          'x-forwarded-for': '8.8.4.4',
        },
      });
      const result = service.evaluateRequestPolicy(req);
      expect(result.allowed).toBe(true);
      expect(result.state).toBe('NY');
      expect(result.stateSource).toBe('ip-lookup');
      expect(result.overrideIgnoredInProduction).toBe(true);
      expect(result.missingLocation).toBe(false);
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
      const serviceNoVerification = new CompliancePolicyService({ query: jest.fn().mockResolvedValue({ rows: [] }) } as any);
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

    it('should block a monetized action when DOB is missing (age gate fails closed)', async () => {
      const serviceNoDob = new CompliancePolicyService(
        { query: jest.fn().mockResolvedValue({ rows: [] }) } as any,
        mockIdentityVerification as unknown as IdentityVerificationService,
      );
      const req = makeRequest({
        method: 'POST',
        originalUrl: '/contracts',
        headers: { 'cf-ipstate': 'CA' },
      });
      const result = await serviceNoDob.evaluateUserComplianceForRequest(req, 'user-1');
      expect(result.allowed).toBe(false);
      expect(result.code).toBe('AGE_VERIFICATION_REQUIRED');
    });

    it('should block a monetized action for an under-18 user', async () => {
      const thisYear = new Date().getFullYear();
      const serviceUnderage = new CompliancePolicyService(
        { query: jest.fn().mockResolvedValue({ rows: [{ date_of_birth: `${thisYear - 16}-01-01` }] }) } as any,
        mockIdentityVerification as unknown as IdentityVerificationService,
      );
      const req = makeRequest({
        method: 'POST',
        originalUrl: '/contracts',
        headers: { 'cf-ipstate': 'CA' },
      });
      const result = await serviceUnderage.evaluateUserComplianceForRequest(req, 'user-1');
      expect(result.allowed).toBe(false);
      expect(result.code).toBe('AGE_VERIFICATION_REQUIRED');
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
      // Adult DOB so the age gate passes and we reach the KYC check.
      const serviceNoVerification = new CompliancePolicyService(
        { query: jest.fn().mockResolvedValue({ rows: [{ date_of_birth: '1990-01-01' }] }) } as any,
      );
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
