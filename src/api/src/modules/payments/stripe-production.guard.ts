import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

@Injectable()
export class StripeProductionGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    if (process.env.NODE_ENV !== 'production') return true;

    const secretKey = process.env.STRIPE_SECRET_KEY;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    const publishableKey = process.env.STRIPE_PUBLISHABLE_KEY;

    if (!secretKey || secretKey === 'sk_test_mock_key') {
      throw new ForbiddenException(
        'STRIPE_SECRET_KEY must be a valid live key (sk_live_*) in production',
      );
    }

    if (!secretKey.startsWith('sk_live_')) {
      throw new ForbiddenException(
        'STRIPE_SECRET_KEY must start with sk_live_ in production',
      );
    }

    if (!webhookSecret) {
      throw new ForbiddenException('STRIPE_WEBHOOK_SECRET is required in production');
    }

    if (!publishableKey || !publishableKey.startsWith('pk_live_')) {
      throw new ForbiddenException(
        'STRIPE_PUBLISHABLE_KEY must start with pk_live_ in production',
      );
    }

    return true;
  }
}
