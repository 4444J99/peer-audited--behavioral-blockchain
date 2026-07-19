import type { MobileBootstrapResponse } from '@styx/shared/index';
import {
  getMobileBetaBannerText,
  getMobileBootstrapConfig,
  getMobileFeatureFlags,
  isBelowMinimumSupportedVersion,
  setMobileBootstrapConfig,
} from './beta';

const bootstrapFixture: MobileBootstrapResponse = {
  environment: {
    label: 'beta',
    apiBaseUrl: 'https://api-beta.styx.example',
    privateBeta: true,
    testMoneyMode: true,
    allowlistUsOnly: true,
    maintenanceMode: false,
  },
  mobile: {
    minSupportedVersion: '1.0.0',
    minSupportedBuild: '100',
    platformPrimary: 'ios',
  },
  featureFlags: {
    phase1MobilePrimary: true,
    phase1NoContactOnly: true,
    enableB2bHrUi: false,
    maintenanceMode: false,
    privateBeta: true,
    testMoneyMode: true,
    allowlistUsOnly: true,
  },
  labels: {
    betaBanner: 'Private beta • test-money pilot • US allowlist',
    complianceNotice: 'US allowlist only',
  },
  release: {
    apiVersion: '0.1.0-beta',
    buildSha: 'abc123',
    snapshotHash: 'ff0011223344',
  },
};

describe('mobile beta bootstrap config', () => {
  afterEach(() => {
    setMobileBootstrapConfig(null);
  });

  it('returns safe defaults when bootstrap config is not loaded', () => {
    const flags = getMobileFeatureFlags();
    expect(flags.phase1NoContactOnly).toBe(true);
    expect(flags.testMoneyMode).toBe(true);
    expect(getMobileBetaBannerText()).toContain('Private beta');
  });

  it('stores and reads the latest mobile bootstrap payload', () => {
    setMobileBootstrapConfig(bootstrapFixture);

    expect(getMobileBootstrapConfig()).toEqual(bootstrapFixture);
    expect(getMobileFeatureFlags()).toEqual(bootstrapFixture.featureFlags);
    expect(getMobileBetaBannerText()).toBe(bootstrapFixture.labels.betaBanner);
  });

  it('flags build/version as below minimum when bootstrap minimum is much higher', () => {
    setMobileBootstrapConfig({
      ...bootstrapFixture,
      mobile: {
        ...bootstrapFixture.mobile,
        minSupportedVersion: '99.0.0',
        minSupportedBuild: '999999',
      },
    });

    expect(isBelowMinimumSupportedVersion(getMobileBootstrapConfig())).toBe(true);
  });

  it('does not flag update when bootstrap minimum is very low', () => {
    setMobileBootstrapConfig({
      ...bootstrapFixture,
      mobile: {
        ...bootstrapFixture.mobile,
        minSupportedVersion: '0.0.0',
        minSupportedBuild: '0',
      },
    });

    expect(isBelowMinimumSupportedVersion(getMobileBootstrapConfig())).toBe(false);
  });
});
