/**
 * Tests that contract creation correctly populates realm_id.
 *
 * These are targeted unit tests for the realm derivation logic,
 * not full integration tests of the entire createContract flow.
 */

import { OathCategory } from '../../../../shared/libs/behavioral-logic';
import { getRealmForCategory, RealmId } from '../../../../shared/libs/realm-registry';

describe('Contract realm_id derivation', () => {
  describe('getRealmForCategory (used by contracts.service on INSERT)', () => {
    it('should derive BIOLOGICAL_HARDWARE for all BIOLOGICAL_ categories', () => {
      expect(getRealmForCategory(OathCategory.WEIGHT_MANAGEMENT)).toBe(RealmId.BIOLOGICAL_HARDWARE);
      expect(getRealmForCategory(OathCategory.CARDIOVASCULAR_STAMINA)).toBe(RealmId.BIOLOGICAL_HARDWARE);
      expect(getRealmForCategory(OathCategory.GLUCOSE_STABILITY)).toBe(RealmId.BIOLOGICAL_HARDWARE);
      expect(getRealmForCategory(OathCategory.SLEEP_INTEGRITY)).toBe(RealmId.BIOLOGICAL_HARDWARE);
      expect(getRealmForCategory(OathCategory.SOBRIETY_HRV)).toBe(RealmId.BIOLOGICAL_HARDWARE);
    });

    it('should derive COGNITIVE_DEVICE for all COGNITIVE_ categories', () => {
      expect(getRealmForCategory(OathCategory.DIGITAL_FASTING)).toBe(RealmId.COGNITIVE_DEVICE);
      expect(getRealmForCategory(OathCategory.DEEP_WORK_FOCUS)).toBe(RealmId.COGNITIVE_DEVICE);
      expect(getRealmForCategory(OathCategory.INBOX_ZERO)).toBe(RealmId.COGNITIVE_DEVICE);
      expect(getRealmForCategory(OathCategory.LEARNING_RETENTION)).toBe(RealmId.COGNITIVE_DEVICE);
    });

    it('should derive PROFESSIONAL_API for all PROFESSIONAL_ categories', () => {
      expect(getRealmForCategory(OathCategory.SALES_VELOCITY)).toBe(RealmId.PROFESSIONAL_API);
      expect(getRealmForCategory(OathCategory.DEVELOPER_THROUGHPUT)).toBe(RealmId.PROFESSIONAL_API);
      expect(getRealmForCategory(OathCategory.PUNCTUALITY)).toBe(RealmId.PROFESSIONAL_API);
    });

    it('should derive CREATIVE_PROCESS for all CREATIVE_ categories', () => {
      expect(getRealmForCategory(OathCategory.DEEP_WRITING)).toBe(RealmId.CREATIVE_PROCESS);
      expect(getRealmForCategory(OathCategory.VISUAL_ARTS)).toBe(RealmId.CREATIVE_PROCESS);
      expect(getRealmForCategory(OathCategory.MUSIC_PRACTICE)).toBe(RealmId.CREATIVE_PROCESS);
      expect(getRealmForCategory(OathCategory.MAKER_BUILD)).toBe(RealmId.CREATIVE_PROCESS);
    });

    it('should derive ENVIRONMENTAL_VISUAL for all VISUAL_ categories', () => {
      expect(getRealmForCategory(OathCategory.NUTRITIONAL_TRANSPARENCY)).toBe(RealmId.ENVIRONMENTAL_VISUAL);
      expect(getRealmForCategory(OathCategory.TIDINESS_MINIMALISM)).toBe(RealmId.ENVIRONMENTAL_VISUAL);
      expect(getRealmForCategory(OathCategory.PERSONAL_PRESENTATION)).toBe(RealmId.ENVIRONMENTAL_VISUAL);
      expect(getRealmForCategory(OathCategory.ACTIVE_READING)).toBe(RealmId.ENVIRONMENTAL_VISUAL);
    });

    it('should derive CHARACTER_SOCIAL for all SOCIAL_ categories', () => {
      expect(getRealmForCategory(OathCategory.CIVIC_ENGAGEMENT)).toBe(RealmId.CHARACTER_SOCIAL);
      expect(getRealmForCategory(OathCategory.PHILANTHROPIC_VELOCITY)).toBe(RealmId.CHARACTER_SOCIAL);
      expect(getRealmForCategory(OathCategory.FAMILY_PRESENCE)).toBe(RealmId.CHARACTER_SOCIAL);
    });

    it('should derive RECOVERY_ABSTINENCE for all RECOVERY_ categories', () => {
      expect(getRealmForCategory(OathCategory.NO_CONTACT_BOUNDARY)).toBe(RealmId.RECOVERY_ABSTINENCE);
      expect(getRealmForCategory(OathCategory.SUBSTANCE_ABSTINENCE)).toBe(RealmId.RECOVERY_ABSTINENCE);
      expect(getRealmForCategory(OathCategory.BEHAVIORAL_DETOX)).toBe(RealmId.RECOVERY_ABSTINENCE);
      expect(getRealmForCategory(OathCategory.ENVIRONMENT_AVOIDANCE)).toBe(RealmId.RECOVERY_ABSTINENCE);
    });
  });

  describe('explicit realmId override', () => {
    it('should prefer explicit realmId when provided (dto.realmId ?? getRealmForCategory)', () => {
      // Simulates the contracts.service.ts logic:
      // const realmId = dto.realmId ?? getRealmForCategory(dto.oathCategory as OathCategory);
      const dtoWithExplicit = { realmId: RealmId.BIOLOGICAL_HARDWARE, oathCategory: 'BIOLOGICAL_WEIGHT' };
      const resolved = dtoWithExplicit.realmId ?? getRealmForCategory(dtoWithExplicit.oathCategory as OathCategory);
      expect(resolved).toBe(RealmId.BIOLOGICAL_HARDWARE);
    });

    it('should fall back to auto-derivation when realmId is undefined', () => {
      const dtoWithoutExplicit = { realmId: undefined, oathCategory: 'CREATIVE_WRITING' };
      const resolved = dtoWithoutExplicit.realmId ?? getRealmForCategory(dtoWithoutExplicit.oathCategory as OathCategory);
      expect(resolved).toBe(RealmId.CREATIVE_PROCESS);
    });
  });
});
