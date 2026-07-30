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

  it('should allow in production with valid live keys', () => {
    process.env.NODE_ENV = 'production';
    process.env.STRIPE_SECRET_KEY = 'sk_live_test_key';
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_secret';
    process.env.STRIPE_PUBLISHABLE_KEY = 'pk_live_test_key';

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
