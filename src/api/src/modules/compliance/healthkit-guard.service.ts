import { Injectable } from '@nestjs/common';

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

@Injectable()
export class HealthKitGuardService {
  private static readonly MANUAL_ENTRY_SOURCE_BUNDLES = new Set([
    'com.apple.Health',
  ]);

  validateMetadata(metadata: HealthKitSampleMetadata): HealthKitValidationResult {
    if (this.isLikelyManualEntry(metadata)) {
      return {
        accepted: false,
        reason: 'Rejected manual HealthKit entry (WasUserEntered/source policy)',
      };
    }
    return { accepted: true };
  }

  private isLikelyManualEntry(metadata: HealthKitSampleMetadata): boolean {
    if (!metadata) {
      return false;
    }

    const wasUserEntered =
      this.normalizeBoolean(metadata.HKMetadataKeyWasUserEntered) ||
      this.normalizeBoolean(metadata.wasUserEntered);

    if (wasUserEntered) {
      return true;
    }

    const sourceBundleId = String(metadata.sourceBundleId || '').trim();
    if (!sourceBundleId) {
      return false;
    }

    return HealthKitGuardService.MANUAL_ENTRY_SOURCE_BUNDLES.has(sourceBundleId);
  }

  private normalizeBoolean(value: unknown): boolean {
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
}
