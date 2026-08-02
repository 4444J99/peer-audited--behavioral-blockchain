// Styx Shared Types & Interfaces
// This file acts as the primary export entrypoint for the @styx/shared workspace.

export interface BaseStyxResponse {
  success: boolean;
  message?: string;
}

/**
 * Error envelope contract — the API serializes every failure as this shape
 * (see `api/src/common/filters/global-http-exception.filter.ts`). One
 * definition shared by the API server, the web client, and every other client
 * so `error_code` can never drift across surfaces.
 */
export interface StyxErrorEnvelope {
  error_code: string;
  message: string;
  trace_id: string | null;
  details?: unknown;
}

export type StyxClientPlatform =
  | "ios"
  | "android"
  | "web"
  | "desktop"
  | "unknown";

// Realm types
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
} from "./libs/realm-registry";

// Beta-waitlist source attribution (shared by the public funnel and signup API)
export {
  WAITLIST_CHANNELS,
  type WaitlistChannel,
  type WaitlistAttribution,
  type AttributionInput,
  classifyWaitlistChannel,
  parseWaitlistAttribution,
} from "./libs/waitlist-attribution";

export interface StyxClientBuildMetadata {
  platform: StyxClientPlatform;
  appVersion: string;
  build: string;
}

export interface StyxFeatureFlags {
  phase1MobilePrimary: boolean;
  phase1NoContactOnly: boolean;
  enableB2bHrUi: boolean;
  maintenanceMode: boolean;
  privateBeta: boolean;
  testMoneyMode: boolean;
  allowlistUsOnly: boolean;
}

export interface MobileBootstrapResponse {
  environment: {
    label: string;
    apiBaseUrl?: string | null;
    privateBeta: boolean;
    testMoneyMode: boolean;
    allowlistUsOnly: boolean;
    maintenanceMode: boolean;
  };
  mobile: {
    minSupportedVersion: string;
    minSupportedBuild: string;
    platformPrimary: "ios" | "android" | "web";
  };
  featureFlags: StyxFeatureFlags;
  labels: {
    betaBanner: string;
    complianceNotice: string;
  };
  release: {
    apiVersion: string;
    buildSha: string | null;
    snapshotHash: string;
  };
}

export interface ComplianceArtifactStatus {
  artifactType: string;
  version: string | null;
  contentHash: string | null;
  signedBy: string | null;
  signedAt: string | null;
  expiresAt: string | null;
  isActive: boolean;
  jurisdictions: string[];
}

export interface ReleaseInfoResponse {
  service: "styx-api";
  apiVersion: string;
  environment: {
    label: string;
    nodeEnv: string;
    privateBeta: boolean;
    testMoneyMode: boolean;
    maintenanceMode: boolean;
  };
  build: {
    sha: string | null;
    source: "env" | "unknown";
    deployedAt: string | null;
  };
  featureFlags: StyxFeatureFlags;
  featureFlagSnapshotHash: string;
  timestamp: string;
}

export * from "./libs/behavioral-enhancements";
export * from "./libs/integrity";

export interface PushTokenRegistration {
  token: string;
  platform: 'ios' | 'android' | 'web' | 'unknown';
  deviceIdentifier?: string;
}

export interface PushToken {
  id: string;
  userId: string;
  platform: string;
  token: string;
  isActive: boolean;
  lastSeenAt: string;
  createdAt: string;
}

export interface PushDeliveryStatus {
  sent: number;
  failed: number;
  unregistered: number;
  total: number;
}

export interface ReferralCodeResponse {
  code: string;
  url: string;
}

export interface ReferralStats {
  totalReferrals: number;
  rewardedReferrals: number;
  pendingReferrals: number;
  totalRewardCents: number;
}

export interface ReferralReward {
  id: string;
  referredUserEmail: string;
  status: string;
  rewardAmountCents: number;
  rewardPaidAt: string | null;
  createdAt: string;
}

export type RationalizationCategory =
  | 'GENUINE_EMERGENCY'
  | 'LEGITIMATE_BUT_NOT_BLOCKING'
  | 'PURE_RATIONALIZATION';

export interface RationalizationResult {
  category: RationalizationCategory;
  confidence: number;
  reasoning: string;
  response: string;
}

export interface RationalizationHistory {
  totalLogs: number;
  genuineEmergency: number;
  legitimateButNotBlocking: number;
  pureRationalization: number;
  recentLogs: Array<{
    id: string;
    contextType: string;
    classification: string;
    rawText: string;
    createdAt: string;
  }>;
}
