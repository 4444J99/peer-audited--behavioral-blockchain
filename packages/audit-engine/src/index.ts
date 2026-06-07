/**
 * @styx/audit-engine
 *
 * Peer-audited behavioral verification engine with consensus voting,
 * honeypot detection, and privacy-preserving proof verification.
 *
 * @packageDocumentation
 */

// Integrity scoring and tier management
export {
  // Constants
  BASE_INTEGRITY,
  FRAUD_PENALTY,
  STRIKE_PENALTY,
  COMPLETION_BONUS,
  INTEGRITY_CEILING_HIGH,
  CEILING_PENALTY_RATE,
  AUDITOR_STAKE_AMOUNT,
  AUDITOR_HARASSMENT_THRESHOLD,
  FALSE_ACCUSATION_WEIGHT,
  // Types
  type UserHistory,
  type FuryHistory,
  // Functions
  calculateIntegrity,
  getAllowedTiers,
  calculateAccuracy,
  calculateReviewerWeight,
  shouldDemoteFury,
  getDisplayTier,
  getTierMaxStake,
} from "./integrity";

// Consensus resolution
export { type AuditorDecision, ConsensusResolver } from "./consensus";

// Honeypot detection
export { type HoneypotArtifact, HoneypotEngine } from "./honeypot";

// Violation codes
export {
  FuryViolationCode,
  VIOLATION_CODE_CATALOG,
  type ViolationCodeInfo,
  getViolationLabel,
  getViolationSeverity,
  isFraudViolation,
  isMediaViolation,
} from "./violation-codes";

// Privacy-preserving proof verification
export {
  type ZKProof,
  ZK_PROOF_MAX_AGE_MS,
  generateZkChallenge,
  ZKExhaustVerifier,
} from "./zk-exhaust";

// Loss aversion physics
export {
  type LossAversionConfig,
  DEFAULT_CONFIG,
  LossAversionEngine,
} from "./loss-aversion";

// Temporal volatility
export { RiskWindow, VolatilityEngine } from "./volatility";
