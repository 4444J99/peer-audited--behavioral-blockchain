import { Test, TestingModule } from '@nestjs/testing';
import { HealthKitGuardService } from './healthkit-guard.service';

describe('HealthKitGuardService', () => {
  let service: HealthKitGuardService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [HealthKitGuardService],
    }).compile();

    service = module.get<HealthKitGuardService>(HealthKitGuardService);
  });

  it('should accept valid automated samples', () => {
    const result = service.validateMetadata({
      sourceBundleId: 'com.apple.Health.Walking',
      wasUserEntered: false,
    });
    expect(result.accepted).toBe(true);
  });

  it('should reject manual entries with wasUserEntered true', () => {
    const result = service.validateMetadata({
      wasUserEntered: true,
    });
    expect(result.accepted).toBe(false);
    expect(result.reason).toContain('manual');
  });

  it('should reject manual entries with HKMetadataKeyWasUserEntered true', () => {
    const result = service.validateMetadata({
      HKMetadataKeyWasUserEntered: 'YES',
    });
    expect(result.accepted).toBe(false);
  });

  it('should reject samples from com.apple.Health bundle (the Health app itself)', () => {
    const result = service.validateMetadata({
      sourceBundleId: 'com.apple.Health',
    });
    expect(result.accepted).toBe(false);
  });

  it('should handle missing metadata gracefully', () => {
    const result = service.validateMetadata({} as any);
    expect(result.accepted).toBe(true);
  });
});
