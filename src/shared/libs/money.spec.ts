import { toCents, toDollars, formatCents } from './money';

describe('toCents', () => {
  it('should convert a whole dollar amount to cents', () => {
    expect(toCents(1)).toBe(100);
  });

  it('should convert a multi-dollar amount to cents', () => {
    expect(toCents(5)).toBe(500);
  });

  it('should convert a dollar-and-cents amount to cents', () => {
    expect(toCents(1.99)).toBe(199);
  });

  it('should return 0 for zero dollars', () => {
    expect(toCents(0)).toBe(0);
  });

  it('should handle negative dollar amounts', () => {
    expect(toCents(-1)).toBe(-100);
    expect(toCents(-9.99)).toBe(-999);
  });

  it('should handle IEEE 754 rounding for $1.005 (100.4999... in float)', () => {
    // $1.005 * 100 = 100.49999... in IEEE 754, Math.round → 100
    expect(toCents(1.005)).toBe(100);
  });

  it('should round fractional cents (below half-cent down)', () => {
    // $1.004 → 100.4 cents → rounds to 100
    expect(toCents(1.004)).toBe(100);
  });

  it('should handle IEEE 754 floating-point imprecision via rounding', () => {
    // 0.1 + 0.2 = 0.30000000000000004 in IEEE 754; should round to 30
    expect(toCents(0.1 + 0.2)).toBe(30);
  });

  it('should convert a large stake amount correctly', () => {
    expect(toCents(1000)).toBe(100000);
    expect(toCents(10000)).toBe(1000000);
  });

  it('should handle a very small positive amount (1 cent)', () => {
    expect(toCents(0.01)).toBe(1);
  });

  it('should handle a sub-cent amount by rounding to nearest cent', () => {
    // $0.004 → 0.4 cents → rounds to 0
    expect(toCents(0.004)).toBe(0);
    // $0.006 → 0.6 cents → rounds to 1
    expect(toCents(0.006)).toBe(1);
  });

  it('should handle the TIER_2_STANDARD max stake ($100)', () => {
    expect(toCents(100)).toBe(10000);
  });

  it('should handle the TIER_3_HIGH_ROLLER max stake ($1000)', () => {
    expect(toCents(1000)).toBe(100000);
  });
});

describe('toDollars', () => {
  it('should convert whole cents to dollars', () => {
    expect(toDollars(100)).toBe(1);
  });

  it('should convert a multi-cent amount to dollars', () => {
    expect(toDollars(199)).toBe(1.99);
  });

  it('should return 0 for zero cents', () => {
    expect(toDollars(0)).toBe(0);
  });

  it('should handle negative cents', () => {
    expect(toDollars(-100)).toBe(-1);
    expect(toDollars(-999)).toBe(-9.99);
  });

  it('should handle a single cent', () => {
    expect(toDollars(1)).toBe(0.01);
  });

  it('should handle large cent amounts', () => {
    expect(toDollars(100000)).toBe(1000);
    expect(toDollars(1000000)).toBe(10000);
  });

  it('should be the inverse of toCents for whole-cent dollar amounts', () => {
    expect(toDollars(toCents(9.99))).toBe(9.99);
    expect(toDollars(toCents(100))).toBe(100);
  });

  it('should handle the auditor stake amount (200 cents = $2.00)', () => {
    expect(toDollars(200)).toBe(2);
  });
});

describe('formatCents', () => {
  it('should format a round dollar amount with two decimal places', () => {
    expect(formatCents(100)).toBe('$1.00');
  });

  it('should format a dollar-and-cents amount', () => {
    expect(formatCents(199)).toBe('$1.99');
  });

  it('should format zero as $0.00', () => {
    expect(formatCents(0)).toBe('$0.00');
  });

  it('should format a single cent as $0.01', () => {
    expect(formatCents(1)).toBe('$0.01');
  });

  it('should format a negative amount with a leading minus sign', () => {
    expect(formatCents(-100)).toBe('$-1.00');
  });

  it('should format a negative single cent', () => {
    expect(formatCents(-1)).toBe('$-0.01');
  });

  it('should format a large amount correctly', () => {
    expect(formatCents(100000)).toBe('$1000.00');
    expect(formatCents(1000000)).toBe('$10000.00');
  });

  it('should always show exactly two decimal places for a whole-dollar amount', () => {
    expect(formatCents(500)).toBe('$5.00');
  });

  it('should format the auditor stake (200 cents)', () => {
    expect(formatCents(200)).toBe('$2.00');
  });

  it('should format the onboarding bonus (500 cents = $5.00)', () => {
    expect(formatCents(500)).toBe('$5.00');
  });

  it('should format a value with trailing zero in cents correctly', () => {
    // 110 cents = $1.10 — the trailing zero must be preserved
    expect(formatCents(110)).toBe('$1.10');
  });

  it('should format the TIER_1 max stake (2000 cents = $20.00)', () => {
    expect(formatCents(2000)).toBe('$20.00');
  });
});
