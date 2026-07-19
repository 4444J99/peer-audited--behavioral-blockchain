import {
  isLikelyManualHealthEntry,
  validateHealthKitSampleMetadata,
} from './HealthKitMetadataGuard';

describe('HealthKitMetadataGuard', () => {
  it('rejects samples flagged as user-entered via HKMetadataKeyWasUserEntered', () => {
    const result = validateHealthKitSampleMetadata({
      HKMetadataKeyWasUserEntered: true,
      sourceBundleId: 'com.apple.health.watchkit',
    });

    expect(result.accepted).toBe(false);
    expect(result.reason).toMatch(/manual HealthKit entry/i);
  });

  it('rejects samples originating from Apple Health manual source bundle', () => {
    const result = validateHealthKitSampleMetadata({
      sourceBundleId: 'com.apple.Health',
      HKMetadataKeyWasUserEntered: false,
    });

    expect(result.accepted).toBe(false);
  });

  it('accepts likely device-generated samples', () => {
    const result = validateHealthKitSampleMetadata({
      HKMetadataKeyWasUserEntered: false,
      sourceBundleId: 'com.apple.health.watchkit',
    });

    expect(result.accepted).toBe(true);
  });

  it('treats "1"/"true" string values as manual entry flags', () => {
    expect(
      isLikelyManualHealthEntry({
        HKMetadataKeyWasUserEntered: '1',
      }),
    ).toBe(true);

    expect(
      isLikelyManualHealthEntry({
        wasUserEntered: 'true',
      }),
    ).toBe(true);
  });
});
