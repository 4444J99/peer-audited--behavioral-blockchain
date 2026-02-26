/**
 * Minimal stubs for react-native APIs used by mobile services.
 * Only stubs what the service layer actually imports.
 */
import React from 'react';

function createPrimitive(tag: string) {
  return ({ children, ...props }: any) => React.createElement(tag, props, children);
}

export const View = createPrimitive('div');
export const Text = createPrimitive('span');
export const ScrollView = createPrimitive('div');
export const KeyboardAvoidingView = createPrimitive('div');
export const TouchableOpacity = createPrimitive('button');
export const TextInput = createPrimitive('input');
export const ActivityIndicator = createPrimitive('span');
export const FlatList = createPrimitive('div');
export const RefreshControl = createPrimitive('div');

export const StyleSheet = {
  create: <T extends Record<string, unknown>>(styles: T) => styles,
  flatten: (style: unknown) => style,
};

export const Linking = {
  addEventListener: jest.fn(),
  getInitialURL: jest.fn(async () => null),
};

export const Alert = {
  alert: jest.fn(),
};

export const Platform = {
  OS: 'ios' as const,
  select: jest.fn((obj: Record<string, unknown>) => obj.ios),
};
