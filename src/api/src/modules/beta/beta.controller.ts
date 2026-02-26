import { Controller, Get } from '@nestjs/common';
import { createHash } from 'crypto';
import type { MobileBootstrapResponse, ReleaseInfoResponse, StyxFeatureFlags } from '@styx/shared/index';
import { Public } from '../../common/decorators/current-user.decorator';

function envFlag(name: string, fallback = false): boolean {
  const raw = process.env[name];
  if (raw == null) {
    return fallback;
  }
  return ['1', 'true', 'yes', 'on'].includes(raw.toLowerCase());
}

function buildFeatureFlags(): StyxFeatureFlags {
  return {
    phase1MobilePrimary: envFlag('STYX_PHASE1_MOBILE_PRIMARY', true),
    phase1NoContactOnly: envFlag('STYX_PHASE1_NO_CONTACT_ONLY', true),
    enableB2bHrUi: envFlag('STYX_FEATURE_B2B_HR_UI', false),
    maintenanceMode: envFlag('STYX_MAINTENANCE_MODE', false),
    privateBeta: envFlag('STYX_PRIVATE_BETA', true),
    testMoneyMode: envFlag('STYX_TEST_MONEY_MODE', true),
    allowlistUsOnly: envFlag('STYX_ALLOWLIST_US_ONLY', true),
  };
}

function hashFeatureFlags(featureFlags: StyxFeatureFlags): string {
  return createHash('sha1')
    .update(JSON.stringify(featureFlags))
    .digest('hex')
    .slice(0, 12);
}

function resolveBuildSha(): string | null {
  return process.env.RENDER_GIT_COMMIT || process.env.GIT_SHA || process.env.VERCEL_GIT_COMMIT_SHA || null;
}

@Controller()
export class BetaController {
  @Get('mobile/bootstrap')
  @Public()
  getMobileBootstrap(): MobileBootstrapResponse {
    const featureFlags = buildFeatureFlags();
    const snapshotHash = hashFeatureFlags(featureFlags);

    return {
      environment: {
        label: process.env.STYX_ENV_LABEL || process.env.NODE_ENV || 'local',
        apiBaseUrl: process.env.STYX_PUBLIC_API_URL || process.env.PUBLIC_API_URL || null,
        privateBeta: featureFlags.privateBeta,
        testMoneyMode: featureFlags.testMoneyMode,
        allowlistUsOnly: featureFlags.allowlistUsOnly,
        maintenanceMode: featureFlags.maintenanceMode,
      },
      mobile: {
        minSupportedVersion: process.env.STYX_MOBILE_MIN_IOS_VERSION || '0.0.0',
        minSupportedBuild: process.env.STYX_MOBILE_MIN_IOS_BUILD || '0',
        platformPrimary: 'ios',
      },
      featureFlags,
      labels: {
        betaBanner: featureFlags.testMoneyMode
          ? 'Private beta • test-money pilot • US allowlist'
          : 'Private beta • US allowlist',
        complianceNotice: featureFlags.allowlistUsOnly
          ? 'Private beta access is limited to invited US allowlist participants. Identity/KYC flows remain non-production in this pilot.'
          : 'Private beta pilot environment. Identity/KYC flows remain non-production in this pilot.',
      },
      release: {
        apiVersion: process.env.STYX_API_VERSION || '0.1.0-beta',
        buildSha: resolveBuildSha(),
        snapshotHash,
      },
    };
  }

  @Get('meta/release')
  @Public()
  getReleaseInfo(): ReleaseInfoResponse {
    const featureFlags = buildFeatureFlags();
    const featureFlagSnapshotHash = hashFeatureFlags(featureFlags);

    return {
      service: 'styx-api',
      apiVersion: process.env.STYX_API_VERSION || '0.1.0-beta',
      environment: {
        label: process.env.STYX_ENV_LABEL || process.env.NODE_ENV || 'local',
        nodeEnv: process.env.NODE_ENV || 'development',
        privateBeta: featureFlags.privateBeta,
        testMoneyMode: featureFlags.testMoneyMode,
        maintenanceMode: featureFlags.maintenanceMode,
      },
      build: {
        sha: resolveBuildSha(),
        source: resolveBuildSha() ? 'env' : 'unknown',
        deployedAt: process.env.STYX_DEPLOYED_AT || null,
      },
      featureFlags,
      featureFlagSnapshotHash,
      timestamp: new Date().toISOString(),
    };
  }
}
