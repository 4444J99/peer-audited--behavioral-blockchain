import { JurisdictionTier } from "../../../services/geofencing";

/**
 * JurisdictionDispositionMapper
 *
 * Determines whether a failed contract's stake should be CAPTURED (as a penalty)
 * or REFUNDED (due to jurisdictional restrictions on financial penalties/gambling).
 */

export type DispositionMode = "CAPTURE" | "REFUND";

/**
 * Minimal read surface over the durable system_flags store. Structural rather
 * than the concrete SystemFlagsService so this mapper stays a plain class with
 * no NestJS/provider imports.
 */
export interface SystemFlagsReader {
  get<T>(key: string): Promise<T | null>;
}

/** system_flags key backing the REFUND_ONLY kill switch. */
export const REFUND_ONLY_FLAG_KEY = "compliance.refund_only_mode";

export class JurisdictionDispositionMapper {
  /**
   * Kill switch: when REFUND_ONLY_MODE is enabled, ALL settlements are forced to
   * REFUND regardless of jurisdiction. This is an emergency override for compliance
   * incidents or legal requirement changes.
   *
   * This static is only an in-process cache. The source of truth is the
   * system_flags row (REFUND_ONLY_FLAG_KEY): settlement paths call
   * refreshFromStore() before reading it, so the switch survives deploys and
   * is shared across replicas.
   */
  private static refundOnlyMode = false;

  static setRefundOnlyMode(enabled: boolean): void {
    this.refundOnlyMode = enabled;
  }

  static isRefundOnlyMode(): boolean {
    return this.refundOnlyMode;
  }

  /**
   * Re-reads the durable kill-switch state into the in-process cache and
   * returns it. If the store is unreachable the switch fails CLOSED to
   * refund-only: refunding is always legal, capturing while the kill-switch
   * state is unknowable is not.
   */
  static async refreshFromStore(flags: SystemFlagsReader): Promise<boolean> {
    try {
      this.refundOnlyMode =
        (await flags.get<boolean>(REFUND_ONLY_FLAG_KEY)) === true;
    } catch {
      this.refundOnlyMode = true;
    }
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
