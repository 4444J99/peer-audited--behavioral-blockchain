import { BetaController } from './beta.controller';

describe('BetaController', () => {
  let controller: BetaController;
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    // Clear all Styx env vars
    Object.keys(process.env).forEach((key) => {
      if (key.startsWith('STYX_') || key === 'RENDER_GIT_COMMIT' || key === 'GIT_SHA' || key === 'VERCEL_GIT_COMMIT_SHA') {
        delete process.env[key];
      }
    });
    controller = new BetaController();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  // ─── getMobileBootstrap ───

  describe('getMobileBootstrap', () => {
    it('should return default feature flags', () => {
      const result = controller.getMobileBootstrap();
      expect(result.featureFlags.phase1MobilePrimary).toBe(true);
      expect(result.featureFlags.phase1NoContactOnly).toBe(true);
      expect(result.featureFlags.enableB2bHrUi).toBe(false);
      expect(result.featureFlags.maintenanceMode).toBe(false);
      expect(result.featureFlags.privateBeta).toBe(true);
      expect(result.featureFlags.testMoneyMode).toBe(true);
      expect(result.featureFlags.allowlistUsOnly).toBe(true);
    });

    it('should respect environment variable overrides', () => {
      process.env.STYX_FEATURE_B2B_HR_UI = 'true';
      process.env.STYX_MAINTENANCE_MODE = '1';
      process.env.STYX_PRIVATE_BETA = 'false';

      const result = controller.getMobileBootstrap();
      expect(result.featureFlags.enableB2bHrUi).toBe(true);
      expect(result.featureFlags.maintenanceMode).toBe(true);
      expect(result.featureFlags.privateBeta).toBe(false);
    });

    it('should return environment info', () => {
      process.env.STYX_ENV_LABEL = 'staging';
      process.env.STYX_PUBLIC_API_URL = 'https://api.styx.io';

      const result = controller.getMobileBootstrap();
      expect(result.environment.label).toBe('staging');
      expect(result.environment.apiBaseUrl).toBe('https://api.styx.io');
    });

    it('should fall back to NODE_ENV for environment label', () => {
      process.env.NODE_ENV = 'test';
      const result = controller.getMobileBootstrap();
      expect(result.environment.label).toBe('test');
    });

    it('should return mobile version constraints', () => {
      process.env.STYX_MOBILE_MIN_IOS_VERSION = '1.2.0';
      process.env.STYX_MOBILE_MIN_IOS_BUILD = '42';

      const result = controller.getMobileBootstrap();
      expect(result.mobile.minSupportedVersion).toBe('1.2.0');
      expect(result.mobile.minSupportedBuild).toBe('42');
      expect(result.mobile.platformPrimary).toBe('ios');
    });

    it('should default mobile version to 0.0.0', () => {
      const result = controller.getMobileBootstrap();
      expect(result.mobile.minSupportedVersion).toBe('0.0.0');
      expect(result.mobile.minSupportedBuild).toBe('0');
    });

    it('should include beta banner with test-money text when testMoneyMode is on', () => {
      const result = controller.getMobileBootstrap();
      expect(result.labels.betaBanner).toContain('test-money');
    });

    it('should exclude test-money text from beta banner when testMoneyMode is off', () => {
      process.env.STYX_TEST_MONEY_MODE = 'false';
      const result = controller.getMobileBootstrap();
      expect(result.labels.betaBanner).not.toContain('test-money');
    });

    it('should include compliance notice for US allowlist', () => {
      const result = controller.getMobileBootstrap();
      expect(result.labels.complianceNotice).toContain('US allowlist');
    });

    it('should use non-US compliance notice when allowlist disabled', () => {
      process.env.STYX_ALLOWLIST_US_ONLY = 'false';
      const result = controller.getMobileBootstrap();
      expect(result.labels.complianceNotice).not.toContain('US allowlist');
    });

    it('should include release info with snapshot hash', () => {
      const result = controller.getMobileBootstrap();
      expect(result.release.apiVersion).toBe('0.1.0-beta');
      expect(result.release.snapshotHash).toBeDefined();
      expect(typeof result.release.snapshotHash).toBe('string');
      expect(result.release.snapshotHash.length).toBe(12);
    });

    it('should pick up build SHA from RENDER_GIT_COMMIT', () => {
      process.env.RENDER_GIT_COMMIT = 'abc123def';
      const result = controller.getMobileBootstrap();
      expect(result.release.buildSha).toBe('abc123def');
    });

    it('should return null buildSha when no SHA env var is set', () => {
      const result = controller.getMobileBootstrap();
      expect(result.release.buildSha).toBe(null);
    });

    it('should produce consistent snapshot hashes for the same flags', () => {
      const r1 = controller.getMobileBootstrap();
      const r2 = controller.getMobileBootstrap();
      expect(r1.release.snapshotHash).toBe(r2.release.snapshotHash);
    });

    it('should produce different snapshot hashes for different flags', () => {
      const r1 = controller.getMobileBootstrap();
      process.env.STYX_MAINTENANCE_MODE = 'true';
      const r2 = controller.getMobileBootstrap();
      expect(r1.release.snapshotHash).not.toBe(r2.release.snapshotHash);
    });
  });

  // ─── getReleaseInfo ───

  describe('getReleaseInfo', () => {
    it('should return service name styx-api', () => {
      const result = controller.getReleaseInfo();
      expect(result.service).toBe('styx-api');
    });

    it('should return default apiVersion', () => {
      const result = controller.getReleaseInfo();
      expect(result.apiVersion).toBe('0.1.0-beta');
    });

    it('should respect STYX_API_VERSION override', () => {
      process.env.STYX_API_VERSION = '1.0.0';
      const result = controller.getReleaseInfo();
      expect(result.apiVersion).toBe('1.0.0');
    });

    it('should include environment details', () => {
      process.env.NODE_ENV = 'production';
      process.env.STYX_ENV_LABEL = 'prod';
      const result = controller.getReleaseInfo();
      expect(result.environment.label).toBe('prod');
      expect(result.environment.nodeEnv).toBe('production');
    });

    it('should include build info', () => {
      process.env.RENDER_GIT_COMMIT = 'deadbeef';
      process.env.STYX_DEPLOYED_AT = '2026-02-27T10:00:00Z';
      const result = controller.getReleaseInfo();
      expect(result.build.sha).toBe('deadbeef');
      expect(result.build.source).toBe('env');
      expect(result.build.deployedAt).toBe('2026-02-27T10:00:00Z');
    });

    it('should set build source to unknown when no SHA env var', () => {
      const result = controller.getReleaseInfo();
      expect(result.build.source).toBe('unknown');
    });

    it('should include feature flags and hash', () => {
      const result = controller.getReleaseInfo();
      expect(result.featureFlags).toBeDefined();
      expect(result.featureFlagSnapshotHash).toBeDefined();
      expect(typeof result.featureFlagSnapshotHash).toBe('string');
    });

    it('should include an ISO timestamp', () => {
      const result = controller.getReleaseInfo();
      expect(() => new Date(result.timestamp)).not.toThrow();
      expect(new Date(result.timestamp).toISOString()).toBe(result.timestamp);
    });
  });
});
