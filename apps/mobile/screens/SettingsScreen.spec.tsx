import React from 'react';
import { render } from '@testing-library/react';
import { SupportTraceErrorBanner } from '../components/SupportTraceErrorBanner';
import { parseSupportTraceMessage } from '../utils/support-trace';

function collectText(node: any): string {
  if (node == null || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(collectText).join('');
  return collectText(node.props?.children);
}

describe('SettingsScreen – trace-ID display', () => {
  it('renders trace ID when password change fails with request_id', () => {
    const tree = SupportTraceErrorBanner({
      value: 'Failed to update password [request_id: settings-pw-001]',
    }) as any;
    const text = collectText(tree);

    expect(text).toContain('Failed to update password');
    expect(text).toContain('Support trace ID');
    expect(text).toContain('settings-pw-001');
    expect(text).not.toContain('[request_id:');
  });

  it('does not render trace ID when error has no request_id suffix', () => {
    const tree = SupportTraceErrorBanner({
      value: 'Passwords do not match',
    }) as any;
    const text = collectText(tree);

    expect(text).toContain('Passwords do not match');
    expect(text).not.toContain('Support trace ID');
  });

  it('renders trace ID for notification preference save error', () => {
    const tree = SupportTraceErrorBanner({
      value: 'Failed to save preferences [request_id: settings-notif-err]',
    }) as any;
    const text = collectText(tree);

    expect(text).toContain('Failed to save preferences');
    expect(text).toContain('settings-notif-err');
  });

  it('renders trace ID for account deletion error', () => {
    const tree = SupportTraceErrorBanner({
      value: 'Cannot delete account with active contracts [request_id: settings-del-active]',
    }) as any;
    const text = collectText(tree);

    expect(text).toContain('Cannot delete account with active contracts');
    expect(text).toContain('settings-del-active');
  });

  it('renders nothing when value is empty', () => {
    const tree = SupportTraceErrorBanner({ value: '' });
    expect(tree).toBeNull();
  });

  it('renders nothing when value is null', () => {
    const tree = SupportTraceErrorBanner({ value: null });
    expect(tree).toBeNull();
  });
});

describe('SettingsScreen – parseSupportTraceMessage edge cases', () => {
  it('extracts trace ID from wrong current password', () => {
    const result = parseSupportTraceMessage(
      'Current password is incorrect [request_id: settings-pw-wrong]',
    );
    expect(result.message).toBe('Current password is incorrect');
    expect(result.traceId).toBe('settings-pw-wrong');
  });

  it('returns null traceId for client-side validation', () => {
    const result = parseSupportTraceMessage('New password must be at least 8 characters');
    expect(result.message).toBe('New password must be at least 8 characters');
    expect(result.traceId).toBeNull();
  });

  it('handles rate limit error', () => {
    const result = parseSupportTraceMessage(
      'Too many password attempts [request_id: settings-rate-lim]',
    );
    expect(result.message).toBe('Too many password attempts');
    expect(result.traceId).toBe('settings-rate-lim');
  });

  it('returns empty message for undefined input', () => {
    const result = parseSupportTraceMessage(undefined);
    expect(result.message).toBe('');
    expect(result.traceId).toBeNull();
  });
});

/* ------------------------------------------------------------------ */
/*  SettingsScreen – render tests                                     */
/* ------------------------------------------------------------------ */

jest.mock('../services/ApiClient', () => ({
  ApiClient: {
    changePassword: jest.fn(),
    updateSettings: jest.fn(),
    deleteAccount: jest.fn(),
  },
}));

describe('SettingsScreen – render', () => {
  const { SettingsScreen } = require('../screens/SettingsScreen');

  function renderSettings() {
    return render(React.createElement(SettingsScreen));
  }

  function allText(container: HTMLElement): string {
    return container.textContent || '';
  }

  function allPlaceholders(container: HTMLElement): string[] {
    const inputs = container.querySelectorAll('input');
    return Array.from(inputs).map(n => n.getAttribute('placeholder')).filter(Boolean) as string[];
  }

  it('renders the Change Password section', () => {
    const { container } = renderSettings();
    const text = allText(container);
    expect(text).toContain('Change Password');
    expect(text).toContain('Update Password');
  });

  it('renders the Notifications section with toggle labels', () => {
    const { container } = renderSettings();
    const text = allText(container);
    expect(text).toContain('Notifications');
    expect(text).toContain('Email Notifications');
    expect(text).toContain('Push Notifications');
    expect(text).toContain('Save Preferences');
  });

  it('renders the Danger Zone section', () => {
    const { container } = renderSettings();
    const text = allText(container);
    expect(text).toContain('Danger Zone');
    expect(text).toContain('Delete My Account');
    expect(text).toContain('Permanently delete');
  });

  it('renders the version string', () => {
    const { container } = renderSettings();
    const text = allText(container);
    expect(text).toContain('Styx Mobile v1.0.0');
  });

  it('renders password input placeholders', () => {
    const { container } = renderSettings();
    const placeholders = allPlaceholders(container);
    expect(placeholders).toContain('Current password');
    expect(placeholders).toContain('New password (min. 8 characters)');
    expect(placeholders).toContain('Confirm new password');
  });

  it('renders without crashing', () => {
    expect(() => { renderSettings(); }).not.toThrow();
  });

  it('does not render error messages initially', () => {
    const { container } = renderSettings();
    const text = allText(container);
    expect(text).not.toContain('Password updated successfully');
    expect(text).not.toContain('Current password is required');
  });
});
