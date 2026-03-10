import { JurisdictionTier } from '../../../services/geofencing';

/**
 * JurisdictionDispositionMapper
 * 
 * Determines whether a failed contract's stake should be CAPTURED (as a penalty)
 * or REFUNDED (due to jurisdictional restrictions on financial penalties/gambling).
 */

export type DispositionMode = 'CAPTURE' | 'REFUND';

export class JurisdictionDispositionMapper {
  /**
   * Safety-First: Any unresolved tier or unknown mode fails closed to REFUND.
   * This prevents accidental illegal capture in restrictive jurisdictions.
   */
  public static getDispositionMode(tier: JurisdictionTier | null | undefined): DispositionMode {
    switch (tier) {
      case JurisdictionTier.TIER_1:
        return 'CAPTURE'; // Predominance states — penalty allowed
      
      case JurisdictionTier.TIER_2:
        return 'REFUND';  // Material element states — refund required
      
      case JurisdictionTier.TIER_3:
        return 'REFUND';  // Hard-blocked — refund and exit
      
      default:
        return 'REFUND';  // Fail-closed
    }
  }
}
