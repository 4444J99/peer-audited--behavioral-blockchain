import React from 'react';
import { SupportTraceErrorBanner } from '../components/SupportTraceErrorBanner';
import { parseSupportTraceMessage } from '../utils/support-trace';

jest.mock('../services/ApiClient', () => ({
  ApiClient: {
    getContracts: jest.fn(),
  },
}));

function collectText(node: any): string {
  if (node == null || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(collectText).join('');
  return collectText(node.props?.children);
}

describe('ContractListScreen – trace-ID display', () => {
  it('renders trace ID when contract list fails with request_id', () => {
    const tree = SupportTraceErrorBanner({
      value: 'Failed to load contracts [request_id: clist-load-001]',
    }) as any;
    const text = collectText(tree);

    expect(text).toContain('Failed to load contracts');
    expect(text).toContain('Support trace ID');
    expect(text).toContain('clist-load-001');
    expect(text).not.toContain('[request_id:');
  });

  it('does not render trace ID when error has no request_id suffix', () => {
    const tree = SupportTraceErrorBanner({
      value: 'Network unavailable',
    }) as any;
    const text = collectText(tree);

    expect(text).toContain('Network unavailable');
    expect(text).not.toContain('Support trace ID');
  });

  it('renders trace ID for geofence restriction error', () => {
    const tree = SupportTraceErrorBanner({
      value: 'Contracts unavailable in your jurisdiction [request_id: clist-geo-block]',
    }) as any;
    const text = collectText(tree);

    expect(text).toContain('Contracts unavailable in your jurisdiction');
    expect(text).toContain('clist-geo-block');
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

describe('ContractListScreen – parseSupportTraceMessage edge cases', () => {
  it('extracts trace ID from auth error on contract list', () => {
    const result = parseSupportTraceMessage(
      'Unauthorized — please log in [request_id: clist-401-auth]',
    );
    expect(result.message).toBe('Unauthorized — please log in');
    expect(result.traceId).toBe('clist-401-auth');
  });

  it('returns null traceId for empty list message', () => {
    const result = parseSupportTraceMessage('No oaths yet');
    expect(result.message).toBe('No oaths yet');
    expect(result.traceId).toBeNull();
  });

  it('handles server error on refresh', () => {
    const result = parseSupportTraceMessage(
      'Internal server error [request_id: clist-500-ref]',
    );
    expect(result.message).toBe('Internal server error');
    expect(result.traceId).toBe('clist-500-ref');
  });

  it('returns empty message for undefined input', () => {
    const result = parseSupportTraceMessage(undefined);
    expect(result.message).toBe('');
    expect(result.traceId).toBeNull();
  });
});

describe('ContractListScreen – render tests', () => {
  const renderer = require('react-test-renderer');
  const { act } = renderer;
  const { ContractListScreen } = require('../screens/ContractListScreen');

  beforeAll(() => { (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true; });
  afterAll(() => { delete (globalThis as any).IS_REACT_ACT_ENVIRONMENT; });

  const mockNavigation = {
    navigate: jest.fn(),
    goBack: jest.fn(),
    setOptions: jest.fn(),
  } as any;

  const mockRoute = { params: undefined, key: 'ContractList', name: 'ContractList' as const } as any;

  it('shows "Loading oaths..." when loading', () => {
    // On initial render, loading=true so useEffect/useCallback have not resolved.
    // The component returns the loading view.
    let component: any;
    act(() => {
      component = renderer.create(
        React.createElement(ContractListScreen, {
          navigation: mockNavigation,
          route: mockRoute,
        }),
      );
    });
    const spans = component.root.findAllByType('span');
    const text = spans.map((n: any) => (n.children || []).join('')).join(' ');

    expect(text).toContain('Loading oaths...');
  });
});
