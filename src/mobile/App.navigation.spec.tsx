import React from 'react';
import { render } from '@testing-library/react';

const nativeScreenRegistry: Array<{
  name: string;
  component?: unknown;
  options?: { title?: string };
}> = [];

jest.mock('@react-navigation/native', () => ({
  NavigationContainer: ({ children }: any) => React.createElement(React.Fragment, null, children),
}));

jest.mock('@react-navigation/native-stack', () => ({
  createNativeStackNavigator: () => ({
    Navigator: ({ children }: any) => React.createElement(React.Fragment, null, children),
    Screen: ({ name, component, options }: any) => {
      nativeScreenRegistry.push({ name, component, options });
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

const { ContractsNavigator } = require('./App');
const { CameraScreen } = require('./screens/CameraScreen');

describe('App navigation wiring', () => {
  beforeEach(() => {
    nativeScreenRegistry.length = 0;
  });

  it('registers SubmitProof route in Contracts navigator with CameraScreen component', () => {
    render(React.createElement(ContractsNavigator));

    const routeNames = nativeScreenRegistry.map((route) => route.name);
    expect(routeNames).toContain('SubmitProof');

    const submitProofRoute = nativeScreenRegistry.find((route) => route.name === 'SubmitProof');
    expect(submitProofRoute?.component).toBe(CameraScreen);
    expect(submitProofRoute?.options?.title).toBe('Submit Proof');
  });
});
