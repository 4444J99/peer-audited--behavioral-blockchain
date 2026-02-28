import { Injectable, ForbiddenException } from '@nestjs/common';
import * as geoip from 'geoip-lite';
import { STATE_TIERS, JurisdictionTier } from '../geofencing';

@Injectable()
export class GeofenceService {

  /**
   * Resolves an IP address to a US state using the GeoLite2 database (via geoip-lite).
   * Returns null for non-US or unresolvable IPs.
   */
  lookupState(ip: string): string | null {
    const geo = geoip.lookup(ip);
    if (!geo || geo.country !== 'US') return null;
    return geo.region || null;
  }

  /**
   * Checks if an incoming request is legally permitted to transact based on IP location.
   */
  checkJurisdiction(ip: string): boolean {
    const state = this.lookupState(ip);
    const tier = state
      ? (STATE_TIERS[state] || JurisdictionTier.TIER_1)
      : JurisdictionTier.TIER_1;

    if (tier === JurisdictionTier.TIER_3) {
      throw new ForbiddenException(
        `Jurisdiction Violation: IP address originates from a restricted 'Any Chance' region (${state}). Transactions are strictly prohibited.`
      );
    }

    // TIER_1 and TIER_2 are allowed to pass through the router (handling for TIER_2 happens at the staking level)
    return true;
  }
}
