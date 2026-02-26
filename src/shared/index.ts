// Styx Shared Types & Interfaces
// This file acts as the primary export entrypoint for the @styx/shared workspace.

export interface BaseStyxResponse {
  success: boolean;
  message?: string;
}

export type StyxClientPlatform = 'ios' | 'android' | 'web' | 'desktop' | 'unknown';

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
    platformPrimary: 'ios' | 'android' | 'web';
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

export interface ReleaseInfoResponse {
  service: 'styx-api';
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
    source: 'env' | 'unknown';
    deployedAt: string | null;
  };
  featureFlags: StyxFeatureFlags;
  featureFlagSnapshotHash: string;
  timestamp: string;
}
