export interface HealthKitSampleMetadata {
  HKMetadataKeyWasUserEntered?: boolean | string | number | null;
  wasUserEntered?: boolean | string | number | null;
  sourceBundleId?: string | null;
  sourceName?: string | null;
}

export interface HealthKitValidationResult {
  accepted: boolean;
  reason?: string;
}

const MANUAL_ENTRY_SOURCE_BUNDLES = new Set([
  'com.apple.Health',
]);

function normalizeBoolean(value: unknown): boolean {
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'number') {
    return value === 1;
  }
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    return normalized === 'true' || normalized === '1' || normalized === 'yes';
  }
  return false;
}

export function isLikelyManualHealthEntry(metadata: HealthKitSampleMetadata): boolean {
  if (!metadata) {
    return false;
  }
  const wasUserEntered =
    normalizeBoolean(metadata.HKMetadataKeyWasUserEntered) ||
    normalizeBoolean(metadata.wasUserEntered);

  if (wasUserEntered) {
    return true;
  }

  const sourceBundleId = String(metadata.sourceBundleId || '').trim();
  if (!sourceBundleId) {
    return false;
  }

  return MANUAL_ENTRY_SOURCE_BUNDLES.has(sourceBundleId);
}

export function validateHealthKitSampleMetadata(
  metadata: HealthKitSampleMetadata,
): HealthKitValidationResult {
  if (isLikelyManualHealthEntry(metadata)) {
    return {
      accepted: false,
      reason: 'Rejected manual HealthKit entry (WasUserEntered/source policy)',
    };
  }
  return { accepted: true };
}
