import type { StyxFeatureFlags } from '@styx/shared/index';

export type MobileBootstrapGate = 'ready' | 'maintenance' | 'update_required';

export interface MobileAppBootstrapViewState {
  gate: MobileBootstrapGate;
  betaBannerText: string;
  featureFlags: StyxFeatureFlags;
  showNoContactScopeNotice: boolean;
  bootstrapError: string | null;
  updateMessage: string | null;
}

export function resolveMobileAppBootstrapViewState(input: {
  betaBannerText: string;
  featureFlags: StyxFeatureFlags;
  bootstrapError?: string | null;
  belowMinimumSupportedVersion: boolean;
  localVersion: string;
  localBuild: string;
}): MobileAppBootstrapViewState {
  const {
    betaBannerText,
    featureFlags,
    bootstrapError = null,
    belowMinimumSupportedVersion,
    localVersion,
    localBuild,
  } = input;

  if (featureFlags.maintenanceMode) {
    return {
      gate: 'maintenance',
      betaBannerText,
      featureFlags,
      showNoContactScopeNotice: featureFlags.phase1NoContactOnly,
      bootstrapError,
      updateMessage: null,
    };
  }

  if (belowMinimumSupportedVersion) {
    return {
      gate: 'update_required',
      betaBannerText,
      featureFlags,
      showNoContactScopeNotice: featureFlags.phase1NoContactOnly,
      bootstrapError,
      updateMessage: `This build is no longer supported. Installed version ${localVersion} (build ${localBuild}) is below the current private beta minimum.`,
    };
  }

  return {
    gate: 'ready',
    betaBannerText,
    featureFlags,
    showNoContactScopeNotice: featureFlags.phase1NoContactOnly,
    bootstrapError,
    updateMessage: null,
  };
}
