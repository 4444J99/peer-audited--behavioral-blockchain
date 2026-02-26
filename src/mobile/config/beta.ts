import type { MobileBootstrapResponse, StyxFeatureFlags } from '@styx/shared/index';

const LOCAL_VERSION = process.env.EXPO_PUBLIC_STYX_MOBILE_VERSION || '0.0.0-dev';
const LOCAL_BUILD = process.env.EXPO_PUBLIC_STYX_MOBILE_BUILD || 'dev';

const DEFAULT_FEATURE_FLAGS: StyxFeatureFlags = {
  phase1MobilePrimary: true,
  phase1NoContactOnly: true,
  enableB2bHrUi: false,
  maintenanceMode: false,
  privateBeta: true,
  testMoneyMode: true,
  allowlistUsOnly: true,
};

let mobileBootstrap: MobileBootstrapResponse | null = null;

export function getLocalMobileVersion(): string {
  return LOCAL_VERSION;
}

export function getLocalMobileBuild(): string {
  return LOCAL_BUILD;
}

export function setMobileBootstrapConfig(config: MobileBootstrapResponse | null): void {
  mobileBootstrap = config;
}

export function getMobileBootstrapConfig(): MobileBootstrapResponse | null {
  return mobileBootstrap;
}

export function getMobileFeatureFlags(): StyxFeatureFlags {
  return mobileBootstrap?.featureFlags || DEFAULT_FEATURE_FLAGS;
}

function parseNumericParts(input: string): number[] {
  const matches = input.match(/\d+/g);
  if (!matches) {
    return [];
  }
  return matches.map((part) => Number.parseInt(part, 10)).filter((n) => Number.isFinite(n));
}

function compareVersionLike(a: string, b: string): number {
  const aParts = parseNumericParts(a);
  const bParts = parseNumericParts(b);
  const max = Math.max(aParts.length, bParts.length);
  for (let i = 0; i < max; i += 1) {
    const av = aParts[i] || 0;
    const bv = bParts[i] || 0;
    if (av > bv) return 1;
    if (av < bv) return -1;
  }
  return 0;
}

export function isBelowMinimumSupportedVersion(config: MobileBootstrapResponse | null): boolean {
  if (!config) {
    return false;
  }

  const minBuild = config.mobile.minSupportedBuild;
  const localBuild = getLocalMobileBuild();
  if (/^\d+$/.test(minBuild) && /^\d+$/.test(localBuild)) {
    return Number.parseInt(localBuild, 10) < Number.parseInt(minBuild, 10);
  }

  return compareVersionLike(getLocalMobileVersion(), config.mobile.minSupportedVersion) < 0;
}

export function getMobileBetaBannerText(): string {
  return (
    mobileBootstrap?.labels.betaBanner ||
    'Private beta • test-money pilot • US allowlist'
  );
}
