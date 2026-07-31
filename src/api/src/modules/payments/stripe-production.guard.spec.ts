import { StripeProductionGuard } from './stripe-production.guard';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';

describe('StripeProductionGuard', () => {
  let guard: StripeProductionGuard;
  const originalEnv = process.env;

  beforeEach(() => {
    guard = new StripeProductionGuard();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  const mockContext = {} as ExecutionContext;

  it('should allow in non-production', () => {
    process.env.NODE_ENV = 'development';
    expect(guard.canActivate(mockContext)).toBe(true);
  });

  /** A production config that satisfies every real-money precondition. */
  const setLiveProductionEnv = () => {
    process.env.NODE_ENV = 'production';
    process.env.STRIPE_SECRET_KEY = 'sk_live_test_key';
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_secret';
    process.env.STRIPE_PUBLISHABLE_KEY = 'pk_live_test_key';
    process.env.KYC_ENFORCEMENT_ENABLED = 'true';
    process.env.STYX_TEST_MONEY_MODE = 'false';
    delete process.env.GEO_MISSING_HEADER_ACTION;
    delete process.env.GEOFENCE_FAIL_OPEN_ON_MISSING_HEADERS;
  };

  it('should allow in production with valid live keys', () => {
    setLiveProductionEnv();

    expect(guard.canActivate(mockContext)).toBe(true);
  });

  // render.yaml shipped GEO_MISSING_HEADER_ACTION=allow and
  // KYC_ENFORCEMENT_ENABLED=false. Both are right for the test-money pilot and
  // wrong the instant a live key is configured, and nothing connected those
  // facts. These two cases make the coupling structural.
  it('should refuse real money while the geofence fails open', () => {
    setLiveProductionEnv();
    process.env.GEO_MISSING_HEADER_ACTION = 'allow';

    expect(() => guard.canActivate(mockContext)).toThrow(/geofence fails open/i);
  });

  it('should refuse real money when KYC enforcement is disabled', () => {
    setLiveProductionEnv();
    process.env.KYC_ENFORCEMENT_ENABLED = 'false';

    expect(() => guard.canActivate(mockContext)).toThrow(/KYC enforcement disabled/i);
  });

  it('should refuse real money when KYC enforcement is simply unset', () => {
    setLiveProductionEnv();
    delete process.env.KYC_ENFORCEMENT_ENABLED;

    expect(() => guard.canActivate(mockContext)).toThrow(ForbiddenException);
  });

  // STYX_TEST_MONEY_MODE gated nothing before — it only picked banner text, so
  // every surface could say "test-money pilot" while a live key moved real money.
  it('should refuse real money while test-money mode is on', () => {
    setLiveProductionEnv();
    process.env.STYX_TEST_MONEY_MODE = 'true';

    expect(() => guard.canActivate(mockContext)).toThrow(/test-money pilot/i);
  });

  it('should refuse real money when test-money mode is unset, since it defaults on', () => {
    setLiveProductionEnv();
    delete process.env.STYX_TEST_MONEY_MODE;

    expect(() => guard.canActivate(mockContext)).toThrow(ForbiddenException);
  });

  it('should still allow the pilot config outside production', () => {
    // The test-money pilot legitimately runs with both controls off.
    process.env.NODE_ENV = 'development';
    process.env.GEO_MISSING_HEADER_ACTION = 'allow';
    process.env.KYC_ENFORCEMENT_ENABLED = 'false';

    expect(guard.canActivate(mockContext)).toBe(true);
  });

  it('should throw when STRIPE_SECRET_KEY is missing in production', () => {
    process.env.NODE_ENV = 'production';
    delete process.env.STRIPE_SECRET_KEY;
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test';
    process.env.STRIPE_PUBLISHABLE_KEY = 'pk_live_test';

    expect(() => guard.canActivate(mockContext)).toThrow(ForbiddenException);
  });

  it('should throw when STRIPE_SECRET_KEY is the mock key in production', () => {
    process.env.NODE_ENV = 'production';
    process.env.STRIPE_SECRET_KEY = 'sk_test_mock_key';
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test';
    process.env.STRIPE_PUBLISHABLE_KEY = 'pk_live_test';

    expect(() => guard.canActivate(mockContext)).toThrow(ForbiddenException);
  });

  it('should throw when STRIPE_SECRET_KEY does not start with sk_live_ in production', () => {
    process.env.NODE_ENV = 'production';
    process.env.STRIPE_SECRET_KEY = 'sk_test_12345';
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test';
    process.env.STRIPE_PUBLISHABLE_KEY = 'pk_live_test';

    expect(() => guard.canActivate(mockContext)).toThrow(ForbiddenException);
  });

  it('should throw when STRIPE_WEBHOOK_SECRET is missing in production', () => {
    process.env.NODE_ENV = 'production';
    process.env.STRIPE_SECRET_KEY = 'sk_live_test';
    delete process.env.STRIPE_WEBHOOK_SECRET;
    process.env.STRIPE_PUBLISHABLE_KEY = 'pk_live_test';

    expect(() => guard.canActivate(mockContext)).toThrow(ForbiddenException);
  });

  it('should throw when STRIPE_PUBLISHABLE_KEY is missing in production', () => {
    process.env.NODE_ENV = 'production';
    process.env.STRIPE_SECRET_KEY = 'sk_live_test';
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test';
    delete process.env.STRIPE_PUBLISHABLE_KEY;

    expect(() => guard.canActivate(mockContext)).toThrow(ForbiddenException);
  });

  it('should throw when STRIPE_PUBLISHABLE_KEY does not start with pk_live_ in production', () => {
    process.env.NODE_ENV = 'production';
    process.env.STRIPE_SECRET_KEY = 'sk_live_test';
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test';
    process.env.STRIPE_PUBLISHABLE_KEY = 'pk_test_12345';

    expect(() => guard.canActivate(mockContext)).toThrow(ForbiddenException);
  });
});
