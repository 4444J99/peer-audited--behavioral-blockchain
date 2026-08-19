import React from 'react';
import { act, render } from '@testing-library/react';

// Lives in its own spec file rather than App.navigation.spec.tsx because proving the
// SSO handoff requires mocking App's whole async service layer, which would change
// what the navigator-wiring tests are actually exercising.
const nativeScreenRegistry: Array<{ name: string }> = [];

jest.mock('@react-navigation/native', () => ({
  NavigationContainer: ({ children }: any) => React.createElement(React.Fragment, null, children),
}));

jest.mock('@react-navigation/native-stack', () => ({
  createNativeStackNavigator: () => ({
    Navigator: ({ children }: any) => React.createElement(React.Fragment, null, children),
    Screen: ({ name }: any) => {
      nativeScreenRegistry.push({ name });
      return null;
    },
  }),
}));

jest.mock('@react-navigation/bottom-tabs', () => ({
  createBottomTabNavigator: () => ({
    Navigator: ({ children }: any) => React.createElement(React.Fragment, null, children),
    Screen: () => null,
  }),
}));

jest.mock('./screens/DigitalExhaustScreen', () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock('./services/EnterpriseSSO', () => ({
  EnterpriseSSO: {
    initializeDeepLinkListener: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock('./services/SessionService', () => ({
  SessionService: {
    isLoggedIn: jest.fn().mockResolvedValue(false),
    clearSession: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock('./services/NotificationService', () => ({
  NotificationService: {
    initialize: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock('./services/ApiClient', () => ({
  ApiClient: {
    getMobileBootstrap: jest.fn().mockResolvedValue({
      environment: {
        label: 'test',
        apiBaseUrl: null,
        privateBeta: true,
        testMoneyMode: true,
        allowlistUsOnly: true,
        maintenanceMode: false,
      },
      mobile: { minSupportedVersion: '0.0.0', minSupportedBuild: '0', platformPrimary: 'ios' },
      featureFlags: {
        phase1MobilePrimary: true,
        phase1NoContactOnly: true,
        enableB2bHrUi: false,
        maintenanceMode: false,
        privateBeta: true,
        testMoneyMode: true,
        allowlistUsOnly: true,
      },
      labels: { betaBanner: 'Private beta', complianceNotice: 'Test money only' },
      release: { apiVersion: '0.0.0', buildSha: null, snapshotHash: 'test' },
    }),
  },
  setAuthToken: jest.fn(),
}));

const { EnterpriseSSO } = require('./services/EnterpriseSSO');
const App = require('./App').default;

async function mountApp() {
  await act(async () => {
    render(React.createElement(App));
  });
}

describe('App enterprise SSO wiring', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    nativeScreenRegistry.length = 0;
    (EnterpriseSSO.initializeDeepLinkListener as jest.Mock).mockResolvedValue(undefined);
  });

  it('registers the enterprise SSO deep link listener on mount', async () => {
    await mountApp();

    expect(EnterpriseSSO.initializeDeepLinkListener).toHaveBeenCalledTimes(1);
    expect(EnterpriseSSO.initializeDeepLinkListener).toHaveBeenCalledWith(expect.any(Function));
  });

  it('leaves the auth stack when the SSO token exchange succeeds', async () => {
    await mountApp();

    // Logged out, so the auth stack owns the tree.
    expect(nativeScreenRegistry.map((route) => route.name)).toContain('Login');

    const callback = (EnterpriseSSO.initializeDeepLinkListener as jest.Mock).mock.calls[0][0];

    // A successful exchange has already stored the session token on ApiClient, so the
    // only thing left for App to do is flip out of the auth stack.
    nativeScreenRegistry.length = 0;
    await act(async () => {
      callback({ success: true, userId: 'ent-user-1' });
    });

    expect(nativeScreenRegistry.map((route) => route.name)).not.toContain('Login');
  });

  it('stays in the auth stack when the SSO token exchange fails', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    await mountApp();

    const callback = (EnterpriseSSO.initializeDeepLinkListener as jest.Mock).mock.calls[0][0];
    await act(async () => {
      callback({ success: false, error: 'Invalid enterprise token' });
    });

    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('Enterprise SSO handoff failed: Invalid enterprise token'),
    );
    // A failed handoff must not grant a session.
    expect(nativeScreenRegistry.map((route) => route.name)).toContain('Login');
    warn.mockRestore();
  });

  it('reports a listener that cannot be initialized instead of leaving an unhandled rejection', async () => {
    const error = jest.spyOn(console, 'error').mockImplementation(() => {});
    (EnterpriseSSO.initializeDeepLinkListener as jest.Mock).mockRejectedValueOnce(
      new Error('Linking unavailable'),
    );

    await mountApp();

    expect(error).toHaveBeenCalledWith(
      expect.stringContaining('Enterprise SSO listener failed to initialize: Linking unavailable'),
    );
    error.mockRestore();
  });
});
