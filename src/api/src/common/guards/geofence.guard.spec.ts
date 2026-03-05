import { ForbiddenException } from '@nestjs/common';
import { GeofenceGuard } from './geofence.guard';
import { CompliancePolicyService } from '../../modules/compliance/compliance-policy.service';

describe('GeofenceGuard', () => {
  let guard: GeofenceGuard;
  let compliancePolicy: CompliancePolicyService;
  const envSnapshot = { ...process.env };

  beforeEach(() => {
    process.env = { ...envSnapshot };
    delete process.env.GEOFENCE_FAIL_OPEN_ON_MISSING_HEADERS;
    delete process.env.NODE_ENV;
    compliancePolicy = new CompliancePolicyService();
    guard = new GeofenceGuard(compliancePolicy);
  });

  afterAll(() => {
    process.env = envSnapshot;
  });

  function createContext(req: Partial<RequestLike>) {
    const request = {
      method: 'GET',
      url: '/contracts',
      originalUrl: '/contracts',
      headers: {},
      ...req,
    };

    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as any;
  }

  it('should block TIER_3 jurisdictions with machine-readable code', () => {
    const context = createContext({
      headers: { 'cf-ipstate': 'WA' },
      originalUrl: '/contracts',
      method: 'GET',
    });

    try {
      guard.canActivate(context);
      fail('Expected guard to throw');
    } catch (err) {
      expect(err).toBeInstanceOf(ForbiddenException);
      const response = (err as ForbiddenException).getResponse() as any;
      expect(response.code).toBe('JURISDICTION_BLOCKED');
      expect(response.jurisdiction.state).toBe('WA');
    }
  });

  it('should block TIER_2 stake-creating actions in refund-only mode', () => {
    const context = createContext({
      headers: { 'cf-ipstate': 'NY' },
      originalUrl: '/contracts',
      method: 'POST',
    });

    try {
      guard.canActivate(context);
      fail('Expected guard to throw');
    } catch (err) {
      const response = (err as ForbiddenException).getResponse() as any;
      expect(response.code).toBe('JURISDICTION_REFUND_ONLY_RESTRICTED');
      expect(response.requiredMode).toBe('REFUND_ONLY');
      expect(response.jurisdiction.tier).toBe('REFUND_ONLY');
    }
  });

  it('should allow TIER_1 requests with valid state', () => {
    const context = createContext({
      headers: { 'cf-ipstate': 'CA' },
      originalUrl: '/contracts',
      method: 'GET',
    });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow TIER_2 safe read/proof actions', () => {
    const context = createContext({
      headers: { 'cf-ipstate': 'NY' },
      originalUrl: '/contracts/abc/proofs',
      method: 'GET',
    });

    expect(guard.canActivate(context)).toBe(true);
  });

  // Phase Beta P0-004: Fail-closed geofencing

  it('should block when no geo headers and fail-closed (default)', () => {
    const warnSpy = jest.spyOn((guard as any).logger, 'warn').mockImplementation(() => undefined);

    const context = createContext({
      headers: {},
      originalUrl: '/contracts',
      method: 'GET',
    });

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    expect(warnSpy).toHaveBeenCalled();
  });

  it('should return 403 with JURISDICTION_BLOCKED code on fail-closed', () => {
    jest.spyOn((guard as any).logger, 'warn').mockImplementation(() => undefined);

    const context = createContext({
      headers: {},
      originalUrl: '/contracts',
      method: 'POST',
    });

    try {
      guard.canActivate(context);
      fail('Expected guard to throw');
    } catch (err) {
      expect(err).toBeInstanceOf(ForbiddenException);
      const response = (err as ForbiddenException).getResponse() as any;
      expect(response.code).toBe('JURISDICTION_BLOCKED');
      expect(response.message).toContain('Location verification');
    }
  });

  it('should allow when fail-open is explicitly enabled and no headers', () => {
    process.env.GEOFENCE_FAIL_OPEN_ON_MISSING_HEADERS = 'true';
    compliancePolicy = new CompliancePolicyService();
    guard = new GeofenceGuard(compliancePolicy);

    const context = createContext({
      headers: {},
      originalUrl: '/contracts',
      method: 'GET',
    });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should ignore x-styx-state override in production', () => {
    process.env.NODE_ENV = 'production';
    compliancePolicy = new CompliancePolicyService();
    guard = new GeofenceGuard(compliancePolicy);
    const warnSpy = jest.spyOn((guard as any).logger, 'warn').mockImplementation(() => undefined);

    const context = createContext({
      headers: { 'x-styx-state': 'WA' },
      originalUrl: '/contracts',
      method: 'GET',
    });

    // In production with no real location headers (x-styx-state ignored),
    // shouldFailOpenOnMissingLocation() returns false → guard blocks.
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    expect(warnSpy).toHaveBeenCalled();
  });

  it('should allow x-styx-state override in non-production when fail-open enabled', () => {
    process.env.NODE_ENV = 'development';
    process.env.GEOFENCE_FAIL_OPEN_ON_MISSING_HEADERS = 'true';
    compliancePolicy = new CompliancePolicyService();
    guard = new GeofenceGuard(compliancePolicy);

    const context = createContext({
      headers: { 'x-styx-state': 'CA' },
      originalUrl: '/contracts',
      method: 'GET',
    });

    expect(guard.canActivate(context)).toBe(true);
  });
});

interface RequestLike {
  method: string;
  url: string;
  originalUrl: string;
  headers: Record<string, string | string[] | undefined>;
}
