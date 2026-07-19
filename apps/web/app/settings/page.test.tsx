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
    getSettings: jest.fn().mockResolvedValue({
      email_notifications: true,
      push_notifications: true,
      stygian_mode: false,
    }),
    updateSettings: jest.fn().mockResolvedValue({ success: true }),
  },
}));

jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: '1', email: 'test@styx.io' },
    logout: jest.fn(),
    isLoading: false,
  }),
}));

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
  });

  it('renders the Notification Preferences section', () => {
    const html = renderToStaticMarkup(<SettingsPage />);

    expect(html).toContain('Notification Preferences');
    expect(html).toContain('Email Notifications');
    expect(html).toContain('Push Notifications');
  });

  it('renders the Recovery Commitments section with link to wallet', () => {
    const html = renderToStaticMarkup(<SettingsPage />);

    expect(html).toContain('Recovery Commitments');
    expect(html).toContain('Commitment Wallet');
    expect(html).toContain('href="/wallet"');
  });

  it('renders the Terminology section', () => {
    const html = renderToStaticMarkup(<SettingsPage />);

    expect(html).toContain('Terminology');
    expect(html).toContain('Stygian Mode');
  });

  it('renders the Danger Zone section', () => {
    const html = renderToStaticMarkup(<SettingsPage />);

    expect(html).toContain('Danger Zone');
    expect(html).toContain('Delete My Account');
  });
});
