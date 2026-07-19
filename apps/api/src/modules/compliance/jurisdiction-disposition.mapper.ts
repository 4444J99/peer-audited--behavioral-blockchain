import { JurisdictionTier } from "../../../services/geofencing";

/**
 * JurisdictionDispositionMapper
 *
 * Determines whether a failed contract's stake should be CAPTURED (as a penalty)
 * or REFUNDED (due to jurisdictional restrictions on financial penalties/gambling).
 */

export type DispositionMode = "CAPTURE" | "REFUND";

export class JurisdictionDispositionMapper {
  /**
   * Kill switch: when REFUND_ONLY_MODE is enabled, ALL settlements are forced to
   * REFUND regardless of jurisdiction. This is an emergency override for compliance
   * incidents or legal requirement changes.
   */
  private static refundOnlyMode = false;

  static setRefundOnlyMode(enabled: boolean): void {
    this.refundOnlyMode = enabled;
  }

  static isRefundOnlyMode(): boolean {
    return this.refundOnlyMode;
  }

  /**
   * Safety-First: Any unresolved tier or unknown mode fails closed to REFUND.
   * This prevents accidental illegal capture in restrictive jurisdictions.
   * When kill switch is active, ALL dispositions are REFUND.
   */
  public static getDispositionMode(
    tier: JurisdictionTier | null | undefined,
  ): DispositionMode {
    if (this.refundOnlyMode) {
      return "REFUND";
    }

    switch (tier) {
      case JurisdictionTier.TIER_1:
        return "CAPTURE"; // Predominance states — penalty allowed

      case JurisdictionTier.TIER_2:
        return "REFUND"; // Material element states — refund required

      case JurisdictionTier.TIER_3:
        return "REFUND"; // Hard-blocked — refund and exit

      default:
        return "REFUND"; // Fail-closed
    }
  }
}
