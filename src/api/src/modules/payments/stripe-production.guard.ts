import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { geofenceFailsOpenOnMissingLocation } from '../compliance/compliance-policy.service';

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

    // Past this point a live key is configured, so the next charge moves real
    // money. The two controls a processor asks about first must therefore be on.
    //
    // Both currently ship OFF in render.yaml, which is correct for the
    // test-money pilot (KYC is explicitly out of Phase 1 scope) and wrong the
    // moment real money is switched on. Nothing connected those facts, so the
    // upgrade path ran through a config nobody would re-read. This makes the
    // coupling structural: you cannot take real money with the pilot's settings.

    if (geofenceFailsOpenOnMissingLocation()) {
      throw new ForbiddenException(
        'Refusing to move real money while the geofence fails open: an unresolvable ' +
          'location would be granted FULL_ACCESS, defeating the US-only boundary (DR-003). ' +
          'Unset GEO_MISSING_HEADER_ACTION or set it to "block".',
      );
    }

    if (String(process.env.KYC_ENFORCEMENT_ENABLED).toLowerCase() !== 'true') {
      throw new ForbiddenException(
        'Refusing to move real money with KYC enforcement disabled. ' +
          'KYC_ENFORCEMENT_ENABLED must be "true" once STRIPE_SECRET_KEY is a live key.',
      );
    }

    return true;
  }
}
