import React from 'react';
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
  const renderer = require('react-test-renderer');
  const { act } = renderer;
  const { DashboardScreen } = require('../screens/DashboardScreen');

  beforeAll(() => { (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true; });
  afterAll(() => { delete (globalThis as any).IS_REACT_ACT_ENVIRONMENT; });

  it('shows "Loading..." when loading', () => {
    // On initial render, loading=true, so the component returns the loading view.
    let component: any;
    act(() => {
      component = renderer.create(React.createElement(DashboardScreen));
    });
    const spans = component.root.findAllByType('span');
    const text = spans.map((n: any) => (n.children || []).join('')).join(' ');

    expect(text).toContain('Loading...');
  });
});
