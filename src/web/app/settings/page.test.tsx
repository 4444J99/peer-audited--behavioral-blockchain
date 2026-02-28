import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
}));

jest.mock('next/link', () => {
  return function MockLink({ children, href }: { children: React.ReactNode; href: string }) {
    return <a href={href}>{children}</a>;
  };
});

jest.mock('../../services/api-client', () => ({
  api: {
    changePassword: jest.fn(),
    updateSettings: jest.fn(),
    deleteAccount: jest.fn(),
  },
}));

jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: '1', email: 'user@test.com', integrity_score: 50, role: 'USER' },
    token: 'mock-token',
    login: jest.fn(),
    register: jest.fn(),
    logout: jest.fn(),
    isLoading: false,
  }),
}));

// Mock localStorage
const localStorageMock: Record<string, string> = {};
Object.defineProperty(global, 'localStorage', {
  value: {
    getItem: jest.fn((key: string) => localStorageMock[key] ?? null),
    setItem: jest.fn((key: string, value: string) => { localStorageMock[key] = value; }),
    removeItem: jest.fn((key: string) => { delete localStorageMock[key]; }),
    clear: jest.fn(() => { Object.keys(localStorageMock).forEach(k => delete localStorageMock[k]); }),
  },
  writable: true,
  configurable: true,
});

import SettingsPage from './page';

describe('SettingsPage', () => {
  it('renders the Settings heading', () => {
    const html = renderToStaticMarkup(<SettingsPage />);

    expect(html).toContain('Settings');
  });

  it('renders the Change Password section', () => {
    const html = renderToStaticMarkup(<SettingsPage />);

    expect(html).toContain('Change Password');
    expect(html).toContain('Current Password');
    expect(html).toContain('New Password');
    expect(html).toContain('Confirm New Password');
  });

  it('renders the Notification Preferences section', () => {
    const html = renderToStaticMarkup(<SettingsPage />);

    expect(html).toContain('Notification Preferences');
    expect(html).toContain('Email Notifications');
    expect(html).toContain('Push Notifications');
  });

  it('renders the Payment Methods section with link to wallet', () => {
    const html = renderToStaticMarkup(<SettingsPage />);

    expect(html).toContain('Payment Methods');
    expect(html).toContain('Open Capital Escrow');
    expect(html).toContain('href="/wallet"');
  });

  it('renders the Linguistic Cloak toggle section', () => {
    const html = renderToStaticMarkup(<SettingsPage />);

    expect(html).toContain('Linguistic Cloak');
    expect(html).toContain('Stygian Mode');
  });

  it('renders the Danger Zone with delete account button', () => {
    const html = renderToStaticMarkup(<SettingsPage />);

    expect(html).toContain('Danger Zone');
    expect(html).toContain('Delete My Account');
  });

  it('renders Update Password button', () => {
    const html = renderToStaticMarkup(<SettingsPage />);

    expect(html).toContain('Update Password');
  });

  it('renders Save Preferences button', () => {
    const html = renderToStaticMarkup(<SettingsPage />);

    expect(html).toContain('Save Preferences');
  });
});
