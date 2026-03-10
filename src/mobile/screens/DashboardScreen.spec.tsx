import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react';
import { SupportTraceErrorBanner } from '../components/SupportTraceErrorBanner';
import { parseSupportTraceMessage } from '../utils/support-trace';

jest.mock('../services/ApiClient', () => ({
  ApiClient: {
    getMe: jest.fn(() => new Promise(() => {})),
    getBalance: jest.fn(() => new Promise(() => {})),
    getNotifications: jest.fn(() => new Promise(() => {})),
    getContracts: jest.fn(() => new Promise(() => {})),
    getAttestationStatus: jest.fn(() => new Promise(() => {})),
  },
}));

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
    setOptions: jest.fn(),
  }),
}));

function collectText(node: any): string {
  if (node == null || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(collectText).join('');
  return collectText(node.props?.children);
}

describe('DashboardScreen – trace-ID display', () => {
  it('renders trace ID when dashboard load error contains request_id', () => {
    const tree = SupportTraceErrorBanner({
      value: 'Failed to load dashboard [request_id: dash-trace-001]',
    }) as any;
    const text = collectText(tree);

    expect(text).toContain('Failed to load dashboard');
    expect(text).toContain('Support trace ID');
    expect(text).toContain('dash-trace-001');
    expect(text).not.toContain('[request_id:');
  });

  it('does not render trace ID for client-side errors', () => {
    const tree = SupportTraceErrorBanner({
      value: 'Network request failed',
    }) as any;
    const text = collectText(tree);

    expect(text).toContain('Network request failed');
    expect(text).not.toContain('Support trace ID');
  });

  it('renders trace ID for profile fetch error', () => {
    const tree = SupportTraceErrorBanner({
      value: 'Unable to load profile [request_id: dash-profile-err]',
    }) as any;
    const text = collectText(tree);

    expect(text).toContain('Unable to load profile');
    expect(text).toContain('dash-profile-err');
  });

  it('renders trace ID for balance fetch error', () => {
    const tree = SupportTraceErrorBanner({
      value: 'Failed to load balance [request_id: dash-bal-502]',
    }) as any;
    const text = collectText(tree);

    expect(text).toContain('Failed to load balance');
    expect(text).toContain('dash-bal-502');
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

describe('DashboardScreen – parseSupportTraceMessage edge cases', () => {
  it('extracts trace ID from attestation status fetch error', () => {
    const result = parseSupportTraceMessage(
      'Failed to load attestation info [request_id: dash-att-err]',
    );
    expect(result.message).toBe('Failed to load attestation info');
    expect(result.traceId).toBe('dash-att-err');
  });

  it('extracts trace ID from contracts fetch error', () => {
    const result = parseSupportTraceMessage(
      'Unable to fetch contracts [request_id: dash-contracts-500]',
    );
    expect(result.message).toBe('Unable to fetch contracts');
    expect(result.traceId).toBe('dash-contracts-500');
  });

  it('handles notification fetch error without trace', () => {
    const result = parseSupportTraceMessage('Failed to load notifications');
    expect(result.message).toBe('Failed to load notifications');
    expect(result.traceId).toBeNull();
  });

  it('returns empty message for null input', () => {
    const result = parseSupportTraceMessage(null);
    expect(result.message).toBe('');
    expect(result.traceId).toBeNull();
  });
});

describe('DashboardScreen – render tests', () => {
  const { DashboardScreen } = require('../screens/DashboardScreen');
  const { ApiClient } = require('../services/ApiClient');

  const navigation = {
    navigate: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows "Loading..." when loading', () => {
    const { container } = render(React.createElement(DashboardScreen));
    expect(container.textContent).toContain('Loading...');
  });

  it('renders the locked beta quick actions without a Fury route', async () => {
    ApiClient.getMe.mockResolvedValueOnce({
      integrity_score: 77,
      tier: 'STANDARD',
      contract_count: 1,
      total_staked: 50,
    });
    ApiClient.getBalance.mockResolvedValueOnce({
      ledger_balance: 12.34,
    });
    ApiClient.getNotifications.mockResolvedValueOnce({
      notifications: [],
    });
    ApiClient.getContracts.mockResolvedValueOnce([]);

    const { getByText, queryByText } = render(
      React.createElement(DashboardScreen, { navigation }),
    );

    await waitFor(() => expect(getByText('Quick Actions')).toBeTruthy());

    expect(getByText('New Oath')).toBeTruthy();
    expect(getByText('Wallet')).toBeTruthy();
    expect(getByText('Profile')).toBeTruthy();
    expect(queryByText('Fury Queue')).toBeNull();
  });

  it('navigates the profile quick action to the profile tab', async () => {
    ApiClient.getMe.mockResolvedValueOnce({
      integrity_score: 77,
      tier: 'STANDARD',
      contract_count: 1,
      total_staked: 50,
    });
    ApiClient.getBalance.mockResolvedValueOnce({
      ledger_balance: 12.34,
    });
    ApiClient.getNotifications.mockResolvedValueOnce({
      notifications: [],
    });
    ApiClient.getContracts.mockResolvedValueOnce([]);

    const { getByText } = render(
      React.createElement(DashboardScreen, { navigation }),
    );

    await waitFor(() => expect(getByText('Profile')).toBeTruthy());
    fireEvent.click(getByText('Profile').closest('button') as HTMLElement);

    expect(navigation.navigate).toHaveBeenCalledWith('Profile');
  });
});
