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

    // NOTE: the real-money interlocks (geofence fail-open, KYC enforcement,
    // STYX_TEST_MONEY_MODE) deliberately do NOT live here. This guard decorates
    // the whole PaymentsController, so enforcing them here would also reject
    // POST /payments/webhook and stop Stripe from settling transactions created
    // before a control was switched off — while still missing POST /contracts,
    // which calls StripeFboService.holdStake directly and never passes through
    // this guard. They are enforced in StripeFboService.assertRealMoneyAllowed(),
    // on the charge itself, which covers every path and no reporting path.
    return true;
  }
}
