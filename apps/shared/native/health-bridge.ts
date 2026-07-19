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
   * SH5: Trusted first-party HealthKit / Health Connect bundle FAMILIES.
   *
   * The exact-match allowlist above is too narrow: legitimate hardware samples are
   * frequently attributed to device-/version-specific child bundles (e.g.
   * `com.apple.health.<UUID>` minted per paired device, or vendor Health Connect
   * aggregator packages). Prefix-matching these known first-party families lets
   * honest hardware through while still excluding unknown / user-entered sources
   * (a failed biological oath liquidates real stake, so over-rejection is harmful).
   *
   * These remain first-party platform namespaces — we deliberately do NOT prefix
   * on third-party vendor roots, since that would re-open the spoofing surface.
   */
  private static readonly TRUSTED_SOURCE_BUNDLE_PREFIXES: readonly string[] = [
    'com.apple.health', // HealthKit family (incl. per-device com.apple.health.<id>)
    'com.google.android.apps.healthdata', // Health Connect family
    'com.google.android.apps.fitness', // Google Fit aggregator family
  ];

  /**
   * SH4: Server-side plausibility bounds per sample type. The client-supplied
   * `value` cannot be trusted blindly (see residual-risk note above), but we can
   * cheaply reject values that are physiologically impossible. These are generous
   * outer bounds — they catch fabricated/garbage numbers, not subtle spoofs.
   */
  private static readonly VALUE_BOUNDS: Record<string, { min: number; max: number }> = {
    HEART_RATE: { min: 20, max: 250 }, // bpm
    STEPS: { min: 0, max: 200_000 }, // steps in a sampling window
    DISTANCE: { min: 0, max: 500_000 }, // meters
    ACTIVE_ENERGY: { min: 0, max: 30_000 }, // kcal
    BODY_MASS: { min: 1, max: 700 }, // kg
    SLEEP: { min: 0, max: 1_440 }, // minutes
  };

  private static isTrustedBundle(sourceBundleId: string): boolean {
    if (NativeHealthBridge.TRUSTED_SOURCE_BUNDLES.has(sourceBundleId)) {
      return true;
    }
    return NativeHealthBridge.TRUSTED_SOURCE_BUNDLE_PREFIXES.some(
      (prefix) => sourceBundleId === prefix || sourceBundleId.startsWith(prefix + '.'),
    );
  }

  /**
   * Validates a health sample's integrity before submission to the Truth Blockchain.
   * Rejects samples that are manually entered, are missing required metadata, do not
   * originate from a trusted first-party hardware source family, or carry
   * physiologically impossible values.
   *
   * RESIDUAL RISK (SH4): `metadata.sourceBundleId` and `wasUserEntered` are still
   * CLIENT-supplied and therefore spoofable by a modified app. These checks RAISE
   * the bar (no manual entries, first-party source family only, sane value range)
   * but do NOT constitute a hardware-attestation guarantee. True anti-spoofing
   * requires signed device attestation (App Attest / Play Integrity) verified
   * server-side; until that exists, treat a passing sample as "plausibly hardware"
   * rather than "proven hardware".
   */
  public static validateSample(sample: HealthSample): { valid: boolean; reason?: string } {
    // 1. Required metadata must be present (reject if missing).
    if (!sample.metadata) {
      return { valid: false, reason: 'Missing sample metadata.' };
    }
    // SH4: require an EXPLICIT non-user-entered assertion from a trusted source.
    // `wasUserEntered` must be present and strictly false (not merely falsy/absent).
    if (sample.metadata.wasUserEntered !== false) {
      return { valid: false, reason: 'Missing or non-false metadata field: wasUserEntered.' };
    }
    const sourceBundleId = String(sample.metadata.sourceBundleId || '').trim();
    if (!sourceBundleId) {
      return { valid: false, reason: 'Missing required metadata field: sourceBundleId.' };
    }

    // 2. Trusted first-party hardware source family (fail closed for unknown sources).
    if (!NativeHealthBridge.isTrustedBundle(sourceBundleId)) {
      return { valid: false, reason: 'Samples must originate from a verified hardware device/app.' };
    }

    // 3. SH4: cheap server-side plausibility check — reject obviously-impossible values.
    if (typeof sample.value !== 'number' || !Number.isFinite(sample.value)) {
      return { valid: false, reason: 'Sample value must be a finite number.' };
    }
    const bounds = NativeHealthBridge.VALUE_BOUNDS[String(sample.type).toUpperCase()];
    if (bounds && (sample.value < bounds.min || sample.value > bounds.max)) {
      return {
        valid: false,
        reason: `Sample value ${sample.value} for ${sample.type} is outside the plausible range.`,
      };
    }

    return { valid: true };
  }
}
