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
   * Validates a health sample's integrity before submission to the Truth Blockchain.
   * Rejects samples that are manually entered or originate from untrusted bundles.
   */
  public static validateSample(sample: HealthSample): { valid: boolean; reason?: string } {
    // 1. Check for manual entry
    if (sample.metadata.wasUserEntered) {
      return { valid: false, reason: 'Manual entries are not allowed for contract verification.' };
    }

    // 2. Blacklist of known manual-entry source bundles
    const untrustedBundles = ['com.apple.Health', 'com.google.android.apps.fitness'];
    if (untrustedBundles.includes(sample.metadata.sourceBundleId)) {
      return { valid: false, reason: 'Samples must originate from a verified hardware device/app.' };
    }

    return { valid: true };
  }
}
