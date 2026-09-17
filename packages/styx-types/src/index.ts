/**
 * @styx/types — Public type contracts for the Styx behavioral market.
 *
 * This package is the stable API surface for web, mobile, and desktop clients.
 * It is intentionally curated to contain ONLY:
 *   - API transport DTOs and response shapes
 *   - Public enum taxonomies (OathCategory, VerificationMethod, etc.)
 *   - Realm registry and UI display data
 *   - Identity and motivation archetype catalogs
 *   - UI display helpers (getDisplayTier, getAllowedTiers, getTierMaxStake)
 *   - Waitlist attribution, push notification, and referral types
 *   - Public-facing policy constants (MAX_WEEKLY_LOSS_VELOCITY_PCT)
 *
 * NOT exported here (stays in styx-core / @styx/shared internal):
 *   - Behavioral physics engines (LossAversionEngine, VolatilityEngine)
 *   - Behavioral-logic theorem constants and formulas
 *   - Integrity score calculation (calculateIntegrity, calculateAccuracy)
 *   - Fury consensus/honeypot weights and seeds
 *   - ZK exhaust verifier, native health bridge
 *   - Money epsilon guards, circuit breaker config
 *
 * Note: During the monorepo transition this package re-exports from @styx/shared.
 * After git filter-repo splits the repo, @styx/types will be standalone (source
 * files copied directly, @styx/shared dependency removed).
 */

// ─── API Transport Contracts ─────────────────────────────────────────────────

export type {
  BaseStyxResponse,
  StyxErrorEnvelope,
  StyxClientPlatform,
  StyxClientBuildMetadata,
  StyxFeatureFlags,
  MobileBootstrapResponse,
  ComplianceArtifactStatus,
  ReleaseInfoResponse,
  PushTokenRegistration,
  PushToken,
  PushDeliveryStatus,
  ReferralCodeResponse,
  ReferralStats,
  ReferralReward,
  RationalizationCategory,
  RationalizationResult,
  RationalizationHistory,
} from "@styx/shared";

// ─── Realm Registry ──────────────────────────────────────────────────────────

export {
  RealmId,
  type RealmDefinition,
  type RealmBridge,
  type RealmGuardrail,
  type RealmTheme,
  type OracleType,
  REALM_REGISTRY,
  getRealmForCategory,
  getRealmBySlug,
  getRealmById,
  getOathCategoriesForRealm,
  getAllRealmIds,
  getAllRealmSlugs,
} from "@styx/shared";

// ─── Identity Oath ───────────────────────────────────────────────────────────

export {
  IDENTITY_OATH_CATEGORIES,
  IDENTITY_COPY_VARIANTS,
  IDENTITY_ARCHETYPES,
  type IdentityOathCategory,
  type IdentityCopyVariant,
  type IdentityArchetype,
  type IdentityOathDeclaration,
  getIdentityArchetype,
  isIdentityOathCategory,
  assignCopyVariant,
  buildPledgeCopy,
  composeIdentityOath,
} from "@styx/shared";

// ─── Motivation Archetype ────────────────────────────────────────────────────

export {
  MOTIVATION_ARCHETYPES,
  type MotivationArchetype,
  type MotivationAssessmentAnswers,
  type MotivationProfile,
  classifyMotivationArchetype,
  getArchetypeNotificationCopy,
} from "@styx/shared";

// ─── Waitlist Attribution ────────────────────────────────────────────────────

export {
  WAITLIST_CHANNELS,
  type WaitlistChannel,
  type WaitlistAttribution,
  type AttributionInput,
  classifyWaitlistChannel,
  parseWaitlistAttribution,
} from "@styx/shared";

// ─── UI Display Helpers ──────────────────────────────────────────────────────
// These are display-only functions — all enforcement is server-side.
// The thresholds and max-stake values are visible to users in the UI already.
// When styx-public is split, these should be moved into this file as standalone
// implementations or replaced with API-returned data (see Issue #995 Step 2).

export { getDisplayTier, getAllowedTiers, getTierMaxStake } from "@styx/shared";

// ─── Public Policy Constants ─────────────────────────────────────────────────

/**
 * Maximum allowed weekly body-weight loss velocity (as a fraction of body weight).
 * Used for advisory display only — e.g. "Weekly loss cap policy (2%): $X.XX".
 * Server-side enforcement is the authoritative check; this constant is for UI display.
 */
export const MAX_WEEKLY_LOSS_VELOCITY_PCT = 0.02;
