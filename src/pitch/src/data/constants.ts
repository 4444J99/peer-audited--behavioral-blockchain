/**
 * Key constants copied from @styx/shared for standalone pitch deck.
 * Source: src/shared/libs/behavioral-logic.ts + integrity.ts
 */

// Behavioral Physics
export const LOSS_AVERSION_COEFFICIENT = 1.955;
export const MAX_GRACE_DAYS_PER_MONTH = 2;
export const ONBOARDING_BONUS_AMOUNT = 5.0;
export const DOWNSCALE_STRIKE_THRESHOLD = 3;
export const FAILURE_COOL_OFF_DAYS = 7;

// Aegis Protocol
export const MIN_SAFE_BMI = 18.5;
export const MAX_WEEKLY_LOSS_VELOCITY_PCT = 0.02;

// Integrity Score
export const BASE_INTEGRITY = 50;
export const FRAUD_PENALTY = 15;
export const STRIKE_PENALTY = 20;
export const COMPLETION_BONUS = 5;

// Fury Auditor
export const AUDITOR_STAKE_AMOUNT = 2.0;
export const FALSE_ACCUSATION_WEIGHT = 3;
export const FURY_ACCURACY_THRESHOLD = 0.8;
export const FURY_BURN_IN_AUDITS = 10;

// Financial Tiers
export const TIERS = [
  { name: 'RESTRICTED_MODE', threshold: 20, maxStake: 0, label: 'Restricted' },
  { name: 'TIER_1_MICRO_STAKES', threshold: 50, maxStake: 20, label: 'Micro Stakes' },
  { name: 'TIER_2_STANDARD', threshold: 100, maxStake: 100, label: 'Standard' },
  { name: 'TIER_3_HIGH_ROLLER', threshold: 500, maxStake: 1000, label: 'High Roller' },
  { name: 'TIER_4_WHALE_VAULTS', threshold: Infinity, maxStake: Infinity, label: 'Whale Vaults' },
] as const;

// Oath Categories
export const OATH_CATEGORIES = [
  'Biological',
  'Cognitive',
  'Professional',
  'Creative',
  'Environmental',
  'Character',
] as const;

// Business Model
export const HOUSE_CUT_PCT = 0.15;
export const APPEAL_FEE = 5.0;
export const YEAR1_BURN_RATE = 2000;

// Market
export const MARKET_SIZE_2035 = '50B';
export const HEALTHCARE_GAMIFICATION_CAGR = 0.23;

// Funding
export const FUNDING_ASK = 1_500_000;
