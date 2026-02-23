import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Request } from 'express';
import { STATE_TIERS, JurisdictionTier } from '../../../services/geofencing';

@Injectable()
export class GeofenceGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();

    // Prefer CDN-provided headers (Cloudflare, AWS CloudFront) over raw IP geolocation.
    // CF-IPState is set by Cloudflare Managed Transform "Add visitor location headers".
    const stateCode = (
      request.headers['cf-ipstate'] ||
      request.headers['x-styx-state'] // test override header for validation gates
    ) as string | undefined;

    if (!stateCode) {
      // No geolocation data available — allow through (fail-open for dev/non-CDN environments)
      return true;
    }

    const tier = STATE_TIERS[stateCode.toUpperCase()];

    if (tier === JurisdictionTier.TIER_3) {
      throw new ForbiddenException(
        'Styx Protocol is legally restricted in your jurisdiction. Geofencing enforcement active.',
      );
    }

    return true;
  }
}
