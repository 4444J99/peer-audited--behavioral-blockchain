/**
 * Minimal stubs for react-native APIs used by mobile services.
 * Only stubs what the service layer actually imports.
 */
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
