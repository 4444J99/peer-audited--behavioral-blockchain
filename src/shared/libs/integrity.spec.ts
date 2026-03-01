import {
  calculateIntegrity,
  getAllowedTiers,
  calculateAccuracy,
  shouldDemoteFury,
  getTierMaxStake,
  BASE_INTEGRITY,
  COMPLETION_BONUS,
  FRAUD_PENALTY,
  STRIKE_PENALTY,
  FALSE_ACCUSATION_WEIGHT,
  UserHistory,
  FuryHistory,
} from './integrity';

const makeUser = (overrides: Partial<UserHistory> = {}): UserHistory => ({
  userId: 'test-user',
  completedOaths: 0,
  fraudStrikes: 0,
  failedOaths: 0,
  monthsInactive: 0,
  ...overrides,
});

const makeFury = (overrides: Partial<FuryHistory> = {}): FuryHistory => ({
  furyId: 'test-fury',
  successfulAudits: 0,
  falseAccusations: 0,
  totalAudits: 0,
  ...overrides,
});

describe('calculateIntegrity', () => {
  it('should return base score (50) for a fresh user', () => {
    expect(calculateIntegrity(makeUser())).toBe(BASE_INTEGRITY);
  });

  it('should add +5 per completed oath', () => {
    expect(calculateIntegrity(makeUser({ completedOaths: 10 }))).toBe(
      BASE_INTEGRITY + 10 * COMPLETION_BONUS,
    );
  });

  it('should subtract -15 per fraud strike', () => {
    expect(calculateIntegrity(makeUser({ fraudStrikes: 2 }))).toBe(
      BASE_INTEGRITY - 2 * FRAUD_PENALTY,
    );
  });

  it('should subtract -20 per failed oath', () => {
    expect(calculateIntegrity(makeUser({ failedOaths: 1 }))).toBe(
      BASE_INTEGRITY - 1 * STRIKE_PENALTY,
    );
  });

  it('should subtract -1 per month inactive', () => {
    expect(calculateIntegrity(makeUser({ monthsInactive: 12 }))).toBe(
      BASE_INTEGRITY - 12,
    );
  });

  it('should floor the score at 0', () => {
    const score = calculateIntegrity(makeUser({ fraudStrikes: 10, failedOaths: 10 }));
    expect(score).toBe(0);
  });

  it('should combine all factors correctly', () => {
    const score = calculateIntegrity(makeUser({
      completedOaths: 5,   // +25
      fraudStrikes: 1,     // -15
      failedOaths: 1,      // -20
      monthsInactive: 3,   // -3
    }));
    // 50 + 25 - 15 - 20 - 3 = 37
    expect(score).toBe(37);
  });
});

describe('getAllowedTiers', () => {
  it('should return RESTRICTED_MODE for score < 20', () => {
    expect(getAllowedTiers(0)).toEqual(['RESTRICTED_MODE']);
    expect(getAllowedTiers(19)).toEqual(['RESTRICTED_MODE']);
  });

  it('should return TIER_1_MICRO_STAKES for score 20-49', () => {
    expect(getAllowedTiers(20)).toEqual(['TIER_1_MICRO_STAKES']);
    expect(getAllowedTiers(49)).toEqual(['TIER_1_MICRO_STAKES']);
  });

  it('should return MICRO + STANDARD for score 50-99', () => {
    expect(getAllowedTiers(50)).toEqual(['TIER_1_MICRO_STAKES', 'TIER_2_STANDARD']);
    expect(getAllowedTiers(99)).toEqual(['TIER_1_MICRO_STAKES', 'TIER_2_STANDARD']);
  });

  it('should return MICRO + STANDARD + HIGH_ROLLER for score 100-499', () => {
    expect(getAllowedTiers(100)).toEqual([
      'TIER_1_MICRO_STAKES', 'TIER_2_STANDARD', 'TIER_3_HIGH_ROLLER',
    ]);
    expect(getAllowedTiers(499)).toEqual([
      'TIER_1_MICRO_STAKES', 'TIER_2_STANDARD', 'TIER_3_HIGH_ROLLER',
    ]);
  });

  it('should return all tiers including WHALE for score >= 500', () => {
    expect(getAllowedTiers(500)).toEqual([
      'TIER_1_MICRO_STAKES', 'TIER_2_STANDARD', 'TIER_3_HIGH_ROLLER', 'TIER_4_WHALE_VAULTS',
    ]);
    expect(getAllowedTiers(10000)).toEqual([
      'TIER_1_MICRO_STAKES', 'TIER_2_STANDARD', 'TIER_3_HIGH_ROLLER', 'TIER_4_WHALE_VAULTS',
    ]);
  });
});

describe('calculateAccuracy', () => {
  it('should return 1.0 for a Fury with zero audits (benefit of doubt)', () => {
    expect(calculateAccuracy(makeFury())).toBe(1.0);
  });

  it('should return 1.0 for a perfect record', () => {
    expect(calculateAccuracy(makeFury({
      successfulAudits: 50,
      falseAccusations: 0,
      totalAudits: 50,
    }))).toBe(1.0);
  });

  it('should weight false accusations 3x', () => {
    // netSuccess = 10 - (1 * 3) = 7, ratio = 7/10 = 0.7
    expect(calculateAccuracy(makeFury({
      successfulAudits: 10,
      falseAccusations: 1,
      totalAudits: 10,
    }))).toBeCloseTo(0.7);
  });

  it('should clamp accuracy at 0.0 (never negative)', () => {
    // netSuccess = 0 - (5 * 3) = -15, ratio = -15/5 → clamped to 0
    expect(calculateAccuracy(makeFury({
      successfulAudits: 0,
      falseAccusations: 5,
      totalAudits: 5,
    }))).toBe(0.0);
  });

  it('should clamp accuracy at 1.0 (never above)', () => {
    // Even with more successful than total (shouldn't happen), clamp at 1
    expect(calculateAccuracy(makeFury({
      successfulAudits: 20,
      falseAccusations: 0,
      totalAudits: 10,
    }))).toBe(1.0);
  });

  it('should use the FALSE_ACCUSATION_WEIGHT constant (3)', () => {
    expect(FALSE_ACCUSATION_WEIGHT).toBe(3);
  });
});

describe('shouldDemoteFury', () => {
  it('should never demote during burn-in (< 10 audits)', () => {
    expect(shouldDemoteFury(makeFury({
      successfulAudits: 0,
      falseAccusations: 9,
      totalAudits: 9,
    }))).toBe(false);
  });

  it('should demote at 10+ audits if accuracy < 0.8', () => {
    // accuracy = (5 - 3*2) / 10 = -1/10 → clamped to 0
    expect(shouldDemoteFury(makeFury({
      successfulAudits: 5,
      falseAccusations: 2,
      totalAudits: 10,
    }))).toBe(true);
  });

  it('should not demote at 10+ audits if accuracy >= 0.8', () => {
    // accuracy = (9 - 0) / 10 = 0.9
    expect(shouldDemoteFury(makeFury({
      successfulAudits: 9,
      falseAccusations: 0,
      totalAudits: 10,
    }))).toBe(false);
  });

  it('should demote at boundary: exactly 0.8 is not demoted', () => {
    // accuracy = (8 - 0) / 10 = 0.8 → NOT below 0.8
    expect(shouldDemoteFury(makeFury({
      successfulAudits: 8,
      falseAccusations: 0,
      totalAudits: 10,
    }))).toBe(false);
  });
});

describe('getTierMaxStake', () => {
  it('should return Infinity for WHALE tier', () => {
    expect(getTierMaxStake(['TIER_1_MICRO_STAKES', 'TIER_2_STANDARD', 'TIER_3_HIGH_ROLLER', 'TIER_4_WHALE_VAULTS'])).toBe(Infinity);
  });

  it('should return 100000 cents for HIGH_ROLLER tier', () => {
    expect(getTierMaxStake(['TIER_1_MICRO_STAKES', 'TIER_2_STANDARD', 'TIER_3_HIGH_ROLLER'])).toBe(100000);
  });

  it('should return 10000 cents for STANDARD tier', () => {
    expect(getTierMaxStake(['TIER_1_MICRO_STAKES', 'TIER_2_STANDARD'])).toBe(10000);
  });

  it('should return 2000 cents for MICRO tier', () => {
    expect(getTierMaxStake(['TIER_1_MICRO_STAKES'])).toBe(2000);
  });

  it('should return 0 for RESTRICTED (no recognized tiers)', () => {
    expect(getTierMaxStake(['RESTRICTED_MODE'])).toBe(0);
    expect(getTierMaxStake([])).toBe(0);
  });
});
