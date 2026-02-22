import { Injectable, ForbiddenException } from '@nestjs/common';
import { STATE_TIERS, JurisdictionTier } from '../geofencing';

@Injectable()
export class GeofenceService {
  
  /**
   * Mocks a physical MaxMind / IP lookup database to map an IP to a US State.
   * In production, this would use MaxMind GeoLite2 or a similar service.
   */
  private lookupStateMOCK(ip: string): string {
    // Simulated deterministic mapping for testing purposes
    if (ip.startsWith('192.168.1.')) return 'WA'; // Map to Washington (which is TIER_3)
    if (ip.startsWith('10.0.0.')) return 'AR';    // Map to Arkansas (which is TIER_3)
    if (ip.startsWith('172.16.')) return 'NY';    // Map to New York (TIER_2)
    return 'CA'; // Map to California (TIER_1 - default safe)
  }

  /**
   * Checks if an incoming request is legally permitted to transact based on IP location.
   */
  checkJurisdiction(ip: string): boolean {
    const state = this.lookupStateMOCK(ip);
    const tier = STATE_TIERS[state] || JurisdictionTier.TIER_1; // Default to permissive if unknown, or strict depending on risk profile

    if (tier === JurisdictionTier.TIER_3) {
      throw new ForbiddenException(
        `Jurisdiction Violation: IP address originates from a restricted 'Any Chance' region (${state}). Transactions are strictly prohibited.`
      );
    }

    // TIER_1 and TIER_2 are allowed to pass through the router (handling for TIER_2 happens at the staking level)
    return true;
  }
}
