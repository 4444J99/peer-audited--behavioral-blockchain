import { ForbiddenException } from '@nestjs/common';
import { GeofenceGuard } from './geofence.guard';
import { CompliancePolicyService } from '../../modules/compliance/compliance-policy.service';

describe('GeofenceGuard', () => {
  let guard: GeofenceGuard;
  let compliancePolicy: CompliancePolicyService;
  const envSnapshot = { ...process.env };

  beforeEach(() => {
    process.env = { ...envSnapshot };
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

  it('should allow TIER_2 safe read/proof actions', () => {
    const context = createContext({
      headers: { 'cf-ipstate': 'NY' },
      originalUrl: '/contracts/abc/proofs',
      method: 'GET',
    });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should ignore x-styx-state override in production', () => {
    process.env.NODE_ENV = 'production';
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

  it('should log missing geolocation and follow configured fail-closed policy', () => {
    process.env.GEOFENCE_FAIL_OPEN_ON_MISSING_HEADERS = 'false';
    // Recreate service+guard so the latest env is read during evaluation.
    compliancePolicy = new CompliancePolicyService();
    guard = new GeofenceGuard(compliancePolicy);
    const warnSpy = jest.spyOn((guard as any).logger, 'warn').mockImplementation(() => undefined);

    const context = createContext({
      headers: {},
      originalUrl: '/contracts',
      method: 'GET',
    });

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    expect(warnSpy).toHaveBeenCalled();
  });
});

interface RequestLike {
  method: string;
  url: string;
  originalUrl: string;
  headers: Record<string, string | string[] | undefined>;
}
