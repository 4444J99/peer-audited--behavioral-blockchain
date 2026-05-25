/**
 * NativeHealthBridge
 * 
 * Formalizes the interface between the Styx platform and native mobile health oracles.
 * This bridge ensures that biometric data (HealthKit/Google Fit) is ingested
 * with rigorous metadata validation to prevent manual-entry fraud.
 */

export enum HealthOracle {
  APPLE_HEALTHKIT = 'HEALTHKIT',
  GOOGLE_FIT = 'HEALTHCONNECT',
}

export interface HealthSample {
  type: string;
  value: number;
  unit: string;
  startDate: string;
  endDate: string;
  oracle: HealthOracle;
  metadata: {
    sourceName: string;
    sourceBundleId: string;
    wasUserEntered: boolean; // CRITICAL: Used to filter manual entries
  };
}

export class NativeHealthBridge {
  /**
   * Allowlist of trusted hardware source bundle IDs that are permitted to feed
   * health samples into the Truth Blockchain. A blacklist is unsafe here because
   * any bundle not explicitly named would be implicitly trusted; an allowlist
   * fails closed for unknown/spoofed sources.
   *
   * NOTE: This is necessary but NOT sufficient. The bundle ID is still
   * client-supplied and can be spoofed. True anti-spoofing requires device
   * attestation / signed payloads (App Attest, Play Integrity) — see residual
   * risk note in the controller. (residual)
   */
  private static readonly TRUSTED_SOURCE_BUNDLES = new Set<string>([
    'com.apple.health.watchos', // Apple Watch native sensors
    'com.google.android.apps.healthdata', // Health Connect hardware aggregator
  ]);

  /**
   * Validates a health sample's integrity before submission to the Truth Blockchain.
   * Rejects samples that are manually entered, are missing required metadata, or
   * do not originate from an allowlisted trusted hardware source bundle.
   */
  public static validateSample(sample: HealthSample): { valid: boolean; reason?: string } {
    // 1. Required metadata must be present (reject if missing).
    if (!sample.metadata) {
      return { valid: false, reason: 'Missing sample metadata.' };
    }
    if (typeof sample.metadata.wasUserEntered !== 'boolean') {
      return { valid: false, reason: 'Missing required metadata field: wasUserEntered.' };
    }
    const sourceBundleId = String(sample.metadata.sourceBundleId || '').trim();
    if (!sourceBundleId) {
      return { valid: false, reason: 'Missing required metadata field: sourceBundleId.' };
    }

    // 2. Check for manual entry.
    if (sample.metadata.wasUserEntered) {
      return { valid: false, reason: 'Manual entries are not allowed for contract verification.' };
    }

    // 3. Allowlist of trusted hardware source bundles (fail closed for unknown sources).
    if (!NativeHealthBridge.TRUSTED_SOURCE_BUNDLES.has(sourceBundleId)) {
      return { valid: false, reason: 'Samples must originate from a verified hardware device/app.' };
    }

    return { valid: true };
  }
}
