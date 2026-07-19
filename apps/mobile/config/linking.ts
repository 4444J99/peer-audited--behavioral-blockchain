import type { LinkingOptions } from '@react-navigation/native';

/**
 * Deep link configuration for React Navigation.
 *
 * Supports:
 *   styx://contracts/:contractId       → ContractDetail
 *   styx://contracts/:contractId/attest → Attestation (daily check-in)
 *   styx://contracts/new               → CreateContract
 *   styx://fury                        → Fury queue
 *   styx://wallet                      → Wallet
 *   styx://dashboard                   → Dashboard (home)
 *   styx://profile                     → Profile
 *   styx://settings                    → Settings
 *
 * Push notification payloads use the `data.url` field:
 *   { type: 'attestation_reminder', contractId: '...' }
 *   → resolved to styx://contracts/:contractId/attest
 */
export const linking: LinkingOptions<any> = {
  prefixes: ['styx://', 'com.styxprotocol.app://'],
  config: {
    screens: {
      // Main tabs
      Dashboard: 'dashboard',
      Wallet: 'wallet',
      Fury: 'fury',

      // Contracts stack (nested navigator)
      Contracts: {
        screens: {
          ContractList: 'contracts',
          ContractDetail: 'contracts/:contractId',
          Attestation: 'contracts/:contractId/attest',
          CreateContract: 'contracts/new',
        },
      },

      // Profile stack (nested navigator)
      Profile: {
        screens: {
          ProfileMain: 'profile',
          Settings: 'settings',
        },
      },
    },
  },
};

/**
 * Resolve a push notification payload into a deep link URL.
 * Returns null if the payload has no actionable navigation target.
 */
export function resolveNotificationDeepLink(data: Record<string, any> | undefined): string | null {
  if (!data) return null;

  switch (data.type) {
    case 'attestation_reminder':
      return data.contractId ? `styx://contracts/${data.contractId}/attest` : null;

    case 'grace_day_reminder':
      return data.contractId ? `styx://contracts/${data.contractId}` : null;

    case 'deadline_warning':
      return data.contractId ? `styx://contracts/${data.contractId}` : null;

    case 'fury_assignment':
      return 'styx://fury';

    case 'verdict_result':
      return data.contractId ? `styx://contracts/${data.contractId}` : null;

    case 'wallet_update':
      return 'styx://wallet';

    default:
      return null;
  }
}
