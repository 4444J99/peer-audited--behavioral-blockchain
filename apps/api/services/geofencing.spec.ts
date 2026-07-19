import { JurisdictionTier, STATE_TIERS, classifyJurisdiction, normalizeStateCode } from './geofencing';

describe('geofencing', () => {
  describe('JurisdictionTier enum', () => {
    it('should define three tiers', () => {
      expect(JurisdictionTier.TIER_1).toBe('FULL_ACCESS');
      expect(JurisdictionTier.TIER_2).toBe('REFUND_ONLY');
      expect(JurisdictionTier.TIER_3).toBe('HARD_BLOCK');
    });
  });

  describe('STATE_TIERS', () => {
    it('should classify TIER_3 hard-blocked states', () => {
      const tier3States = ['WA', 'AR', 'HI', 'UT', 'ID', 'SC'];
      for (const state of tier3States) {
        expect(STATE_TIERS[state]).toBe(JurisdictionTier.TIER_3);
      }
    });

    it('should classify TIER_2 restricted states', () => {
      const tier2States = ['NY', 'CT', 'MT', 'AZ', 'IA', 'LA', 'ME', 'TN', 'VA', 'IN', 'PA'];
      for (const state of tier2States) {
        expect(STATE_TIERS[state]).toBe(JurisdictionTier.TIER_2);
      }
    });

    it('should classify TIER_1 permissive states', () => {
      const tier1States = ['CA', 'TX', 'FL', 'IL', 'OH', 'GA', 'NC', 'MI', 'NJ', 'CO', 'NV'];
      for (const state of tier1States) {
        expect(STATE_TIERS[state]).toBe(JurisdictionTier.TIER_1);
      }
    });

    it('should include DC', () => {
      expect(STATE_TIERS['DC']).toBe(JurisdictionTier.TIER_1);
    });
  });

  describe('classifyJurisdiction', () => {
    it('should return TIER_3 with null state for null geo', () => {
      const result = classifyJurisdiction(null);
      expect(result).toEqual({ tier: JurisdictionTier.TIER_3, state: null });
    });

    it('should return TIER_3 with null state for non-US country', () => {
      const result = classifyJurisdiction({ country: 'DE', region: 'BE' });
      expect(result).toEqual({ tier: JurisdictionTier.TIER_3, state: null });
    });

    it('should return TIER_1 for a US permissive state', () => {
      const result = classifyJurisdiction({ country: 'US', region: 'CA' });
      expect(result).toEqual({ tier: JurisdictionTier.TIER_1, state: 'CA' });
    });

    it('should return TIER_2 for a US restricted state', () => {
      const result = classifyJurisdiction({ country: 'US', region: 'NY' });
      expect(result).toEqual({ tier: JurisdictionTier.TIER_2, state: 'NY' });
    });

    it('should return TIER_3 for a US hard-blocked state', () => {
      const result = classifyJurisdiction({ country: 'US', region: 'WA' });
      expect(result).toEqual({ tier: JurisdictionTier.TIER_3, state: 'WA' });
    });

    it('should default to TIER_3 for an unknown US state code', () => {
      const result = classifyJurisdiction({ country: 'US', region: 'ZZ' });
      expect(result).toEqual({ tier: JurisdictionTier.TIER_3, state: 'ZZ' });
    });

    it('should resolve a full state name to its code and tier (SH8)', () => {
      expect(classifyJurisdiction({ country: 'US', region: 'California' })).toEqual({
        tier: JurisdictionTier.TIER_1,
        state: 'CA',
      });
      expect(classifyJurisdiction({ country: 'US', region: 'new york' })).toEqual({
        tier: JurisdictionTier.TIER_2,
        state: 'NY',
      });
    });

    it('should fail closed (TIER_3, null state) for non-2-letter garbage input (SH8)', () => {
      const result = classifyJurisdiction({ country: 'US', region: '90210' });
      expect(result).toEqual({ tier: JurisdictionTier.TIER_3, state: null });
    });
  });

  describe('normalizeStateCode (SH8)', () => {
    it('accepts and uppercases a 2-letter code', () => {
      expect(normalizeStateCode(' ca ')).toBe('CA');
    });

    it('maps a full state name to its 2-letter code', () => {
      expect(normalizeStateCode('District of Columbia')).toBe('DC');
      expect(normalizeStateCode('TEXAS')).toBe('TX');
    });

    it('returns null for invalid / unrecognized input', () => {
      expect(normalizeStateCode('')).toBeNull();
      expect(normalizeStateCode('   ')).toBeNull();
      expect(normalizeStateCode('CALI')).toBeNull();
      expect(normalizeStateCode('12')).toBeNull();
      expect(normalizeStateCode(null)).toBeNull();
      expect(normalizeStateCode(undefined)).toBeNull();
    });
  });
});
