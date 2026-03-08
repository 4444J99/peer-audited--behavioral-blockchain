import { OathCategory } from './behavioral-logic';
import {
  RealmId,
  REALM_REGISTRY,
  getRealmForCategory,
  getRealmBySlug,
  getRealmById,
  getOathCategoriesForRealm,
  getAllRealmIds,
  getAllRealmSlugs,
} from './realm-registry';

describe('RealmRegistry', () => {
  describe('REALM_REGISTRY', () => {
    it('should contain exactly 7 realms', () => {
      expect(REALM_REGISTRY).toHaveLength(7);
    });

    it('should have unique IDs', () => {
      const ids = REALM_REGISTRY.map((r) => r.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it('should have unique slugs', () => {
      const slugs = REALM_REGISTRY.map((r) => r.slug);
      expect(new Set(slugs).size).toBe(slugs.length);
    });

    it('should have unique stream prefixes', () => {
      const prefixes = REALM_REGISTRY.map((r) => r.streamPrefix);
      expect(new Set(prefixes).size).toBe(prefixes.length);
    });

    it('should have valid theme colors (hex format)', () => {
      const hexPattern = /^#[0-9a-f]{6}$/;
      for (const realm of REALM_REGISTRY) {
        expect(realm.theme.primary).toMatch(hexPattern);
        expect(realm.theme.accent).toMatch(hexPattern);
      }
    });
  });

  describe('RealmId enum', () => {
    it('should have 7 members matching the registry', () => {
      const enumValues = Object.values(RealmId);
      expect(enumValues).toHaveLength(7);
      for (const realm of REALM_REGISTRY) {
        expect(enumValues).toContain(realm.id);
      }
    });
  });

  describe('getRealmForCategory', () => {
    const expectedMappings: [OathCategory, RealmId][] = [
      // Biological
      [OathCategory.WEIGHT_MANAGEMENT, RealmId.BIOLOGICAL_HARDWARE],
      [OathCategory.CARDIOVASCULAR_STAMINA, RealmId.BIOLOGICAL_HARDWARE],
      [OathCategory.GLUCOSE_STABILITY, RealmId.BIOLOGICAL_HARDWARE],
      [OathCategory.SLEEP_INTEGRITY, RealmId.BIOLOGICAL_HARDWARE],
      [OathCategory.SOBRIETY_HRV, RealmId.BIOLOGICAL_HARDWARE],
      // Cognitive
      [OathCategory.DIGITAL_FASTING, RealmId.COGNITIVE_DEVICE],
      [OathCategory.DEEP_WORK_FOCUS, RealmId.COGNITIVE_DEVICE],
      [OathCategory.INBOX_ZERO, RealmId.COGNITIVE_DEVICE],
      [OathCategory.LEARNING_RETENTION, RealmId.COGNITIVE_DEVICE],
      // Professional
      [OathCategory.SALES_VELOCITY, RealmId.PROFESSIONAL_API],
      [OathCategory.DEVELOPER_THROUGHPUT, RealmId.PROFESSIONAL_API],
      [OathCategory.PUNCTUALITY, RealmId.PROFESSIONAL_API],
      // Creative
      [OathCategory.DEEP_WRITING, RealmId.CREATIVE_PROCESS],
      [OathCategory.VISUAL_ARTS, RealmId.CREATIVE_PROCESS],
      [OathCategory.MUSIC_PRACTICE, RealmId.CREATIVE_PROCESS],
      [OathCategory.MAKER_BUILD, RealmId.CREATIVE_PROCESS],
      // Environmental (VISUAL_ prefix)
      [OathCategory.NUTRITIONAL_TRANSPARENCY, RealmId.ENVIRONMENTAL_VISUAL],
      [OathCategory.TIDINESS_MINIMALISM, RealmId.ENVIRONMENTAL_VISUAL],
      [OathCategory.PERSONAL_PRESENTATION, RealmId.ENVIRONMENTAL_VISUAL],
      [OathCategory.ACTIVE_READING, RealmId.ENVIRONMENTAL_VISUAL],
      // Character (SOCIAL_ prefix)
      [OathCategory.CIVIC_ENGAGEMENT, RealmId.CHARACTER_SOCIAL],
      [OathCategory.PHILANTHROPIC_VELOCITY, RealmId.CHARACTER_SOCIAL],
      [OathCategory.FAMILY_PRESENCE, RealmId.CHARACTER_SOCIAL],
      // Recovery
      [OathCategory.NO_CONTACT_BOUNDARY, RealmId.RECOVERY_ABSTINENCE],
      [OathCategory.SUBSTANCE_ABSTINENCE, RealmId.RECOVERY_ABSTINENCE],
      [OathCategory.BEHAVIORAL_DETOX, RealmId.RECOVERY_ABSTINENCE],
      [OathCategory.ENVIRONMENT_AVOIDANCE, RealmId.RECOVERY_ABSTINENCE],
    ];

    it('should map all 27 oath categories to correct realms', () => {
      expect(expectedMappings).toHaveLength(27);
      for (const [category, expectedRealm] of expectedMappings) {
        expect(getRealmForCategory(category)).toBe(expectedRealm);
      }
    });

    it('should return undefined for unknown category values', () => {
      expect(getRealmForCategory('UNKNOWN_THING' as OathCategory)).toBeUndefined();
    });
  });

  describe('getRealmBySlug', () => {
    it('should find each realm by slug', () => {
      for (const realm of REALM_REGISTRY) {
        const found = getRealmBySlug(realm.slug);
        expect(found).toBeDefined();
        expect(found!.id).toBe(realm.id);
      }
    });

    it('should return undefined for unknown slug', () => {
      expect(getRealmBySlug('nonexistent-realm')).toBeUndefined();
    });
  });

  describe('getRealmById', () => {
    it('should find each realm by ID', () => {
      for (const realm of REALM_REGISTRY) {
        const found = getRealmById(realm.id);
        expect(found).toBeDefined();
        expect(found!.slug).toBe(realm.slug);
      }
    });

    it('should return undefined for unknown ID', () => {
      expect(getRealmById('FAKE_REALM' as RealmId)).toBeUndefined();
    });
  });

  describe('getOathCategoriesForRealm', () => {
    it('should return 5 categories for BIOLOGICAL_HARDWARE', () => {
      const cats = getOathCategoriesForRealm(RealmId.BIOLOGICAL_HARDWARE);
      expect(cats).toHaveLength(5);
      expect(cats).toContain(OathCategory.WEIGHT_MANAGEMENT);
      expect(cats).toContain(OathCategory.SLEEP_INTEGRITY);
    });

    it('should return 4 categories for COGNITIVE_DEVICE', () => {
      expect(getOathCategoriesForRealm(RealmId.COGNITIVE_DEVICE)).toHaveLength(4);
    });

    it('should return 3 categories for PROFESSIONAL_API', () => {
      expect(getOathCategoriesForRealm(RealmId.PROFESSIONAL_API)).toHaveLength(3);
    });

    it('should return 4 categories for CREATIVE_PROCESS', () => {
      expect(getOathCategoriesForRealm(RealmId.CREATIVE_PROCESS)).toHaveLength(4);
    });

    it('should return 4 categories for ENVIRONMENTAL_VISUAL', () => {
      expect(getOathCategoriesForRealm(RealmId.ENVIRONMENTAL_VISUAL)).toHaveLength(4);
    });

    it('should return 3 categories for CHARACTER_SOCIAL', () => {
      expect(getOathCategoriesForRealm(RealmId.CHARACTER_SOCIAL)).toHaveLength(3);
    });

    it('should return 4 categories for RECOVERY_ABSTINENCE', () => {
      expect(getOathCategoriesForRealm(RealmId.RECOVERY_ABSTINENCE)).toHaveLength(4);
    });

    it('should return empty array for unknown realm', () => {
      expect(getOathCategoriesForRealm('FAKE' as RealmId)).toEqual([]);
    });

    it('should cover all 27 oath categories across all realms', () => {
      const allCats = Object.values(RealmId).flatMap(getOathCategoriesForRealm);
      expect(allCats).toHaveLength(27);
      expect(new Set(allCats).size).toBe(27);
    });
  });

  describe('getAllRealmIds', () => {
    it('should return 7 realm IDs', () => {
      expect(getAllRealmIds()).toHaveLength(7);
    });
  });

  describe('getAllRealmSlugs', () => {
    it('should return 7 slugs', () => {
      expect(getAllRealmSlugs()).toHaveLength(7);
    });
  });

  describe('realm bridges', () => {
    it('should have RECOVERY_ABSTINENCE bridge to BIOLOGICAL_HARDWARE', () => {
      const recovery = getRealmById(RealmId.RECOVERY_ABSTINENCE)!;
      expect(recovery.bridges).toHaveLength(1);
      expect(recovery.bridges[0].targetRealm).toBe(RealmId.BIOLOGICAL_HARDWARE);
      expect(recovery.bridges[0].direction).toBe('READ');
    });

    it('should have no bridges for non-recovery realms in Phase 1', () => {
      const nonRecovery = REALM_REGISTRY.filter((r) => r.id !== RealmId.RECOVERY_ABSTINENCE);
      for (const realm of nonRecovery) {
        expect(realm.bridges).toHaveLength(0);
      }
    });
  });
});
