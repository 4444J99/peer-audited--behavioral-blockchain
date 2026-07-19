import { resolveMobileAppBootstrapViewState } from './app-bootstrap-state';
import type { StyxFeatureFlags } from '@styx/shared/index';

const baseFlags: StyxFeatureFlags = {
  phase1MobilePrimary: true,
  phase1NoContactOnly: true,
  enableB2bHrUi: false,
  maintenanceMode: false,
  privateBeta: true,
  testMoneyMode: true,
  allowlistUsOnly: true,
};

describe('mobile app bootstrap state', () => {
  it('returns maintenance gate when maintenance mode is enabled', () => {
    const state = resolveMobileAppBootstrapViewState({
      betaBannerText: 'Private beta',
      featureFlags: { ...baseFlags, maintenanceMode: true },
      belowMinimumSupportedVersion: false,
      localVersion: '1.0.0',
      localBuild: '100',
    });

    expect(state.gate).toBe('maintenance');
    expect(state.updateMessage).toBeNull();
  });

  it('returns update_required gate when build is below minimum', () => {
    const state = resolveMobileAppBootstrapViewState({
      betaBannerText: 'Private beta',
      featureFlags: baseFlags,
      belowMinimumSupportedVersion: true,
      localVersion: '1.0.0-beta.1',
      localBuild: '101',
    });

    expect(state.gate).toBe('update_required');
    expect(state.updateMessage).toContain('1.0.0-beta.1');
    expect(state.updateMessage).toContain('101');
  });

  it('returns ready gate and no-contact scope notice for phase1', () => {
    const state = resolveMobileAppBootstrapViewState({
      betaBannerText: 'Private beta • test-money pilot • US allowlist',
      featureFlags: { ...baseFlags, phase1NoContactOnly: true },
      belowMinimumSupportedVersion: false,
      localVersion: '1.0.0',
      localBuild: '100',
    });

    expect(state.gate).toBe('ready');
    expect(state.showNoContactScopeNotice).toBe(true);
    expect(state.betaBannerText).toContain('test-money');
  });

  it('disables no-contact scope notice when flag is off', () => {
    const state = resolveMobileAppBootstrapViewState({
      betaBannerText: 'Private beta',
      featureFlags: { ...baseFlags, phase1NoContactOnly: false },
      belowMinimumSupportedVersion: false,
      localVersion: '1.0.0',
      localBuild: '100',
      bootstrapError: 'Unable to load beta configuration',
    });

    expect(state.gate).toBe('ready');
    expect(state.showNoContactScopeNotice).toBe(false);
    expect(state.bootstrapError).toContain('Unable to load beta configuration');
  });
});
