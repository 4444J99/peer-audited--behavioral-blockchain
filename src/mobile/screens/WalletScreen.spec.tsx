import React from 'react';
import { SupportTraceErrorBanner } from '../components/SupportTraceErrorBanner';
import { parseSupportTraceMessage } from '../utils/support-trace';

function collectText(node: any): string {
  if (node == null || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(collectText).join('');
  return collectText(node.props?.children);
}

describe('WalletScreen – trace-ID display', () => {
  it('renders trace ID when balance load fails with request_id', () => {
    const tree = SupportTraceErrorBanner({
      value: 'Failed to load balance [request_id: wallet-bal-001]',
    }) as any;
    const text = collectText(tree);

    expect(text).toContain('Failed to load balance');
    expect(text).toContain('Support trace ID');
    expect(text).toContain('wallet-bal-001');
    expect(text).not.toContain('[request_id:');
  });

  it('does not render trace ID when error has no request_id suffix', () => {
    const tree = SupportTraceErrorBanner({
      value: 'Connection timeout',
    }) as any;
    const text = collectText(tree);

    expect(text).toContain('Connection timeout');
    expect(text).not.toContain('Support trace ID');
  });

  it('renders trace ID for transaction history error', () => {
    const tree = SupportTraceErrorBanner({
      value: 'Failed to load transactions [request_id: wallet-tx-err]',
    }) as any;
    const text = collectText(tree);

    expect(text).toContain('Failed to load transactions');
    expect(text).toContain('wallet-tx-err');
  });

  it('renders trace ID for insufficient funds error', () => {
    const tree = SupportTraceErrorBanner({
      value: 'Insufficient balance for withdrawal [request_id: wallet-insuf-amt]',
    }) as any;
    const text = collectText(tree);

    expect(text).toContain('Insufficient balance for withdrawal');
    expect(text).toContain('wallet-insuf-amt');
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

describe('WalletScreen – parseSupportTraceMessage edge cases', () => {
  it('extracts trace ID from ledger sync error', () => {
    const result = parseSupportTraceMessage(
      'Ledger sync failed [request_id: wallet-sync-err]',
    );
    expect(result.message).toBe('Ledger sync failed');
    expect(result.traceId).toBe('wallet-sync-err');
  });

  it('returns null traceId for client-side formatting error', () => {
    const result = parseSupportTraceMessage('Invalid amount format');
    expect(result.message).toBe('Invalid amount format');
    expect(result.traceId).toBeNull();
  });

  it('handles tier restriction error', () => {
    const result = parseSupportTraceMessage(
      'Stake exceeds tier limit [request_id: wallet-tier-lim]',
    );
    expect(result.message).toBe('Stake exceeds tier limit');
    expect(result.traceId).toBe('wallet-tier-lim');
  });

  it('returns empty message for undefined input', () => {
    const result = parseSupportTraceMessage(undefined);
    expect(result.message).toBe('');
    expect(result.traceId).toBeNull();
  });
});

/* ------------------------------------------------------------------ */
/*  WalletScreen – render tests                                       */
/* ------------------------------------------------------------------ */

jest.mock('../services/ApiClient', () => ({
  ApiClient: {
    getBalance: jest.fn().mockReturnValue(new Promise(() => {})),
    getWalletHistory: jest.fn().mockReturnValue(new Promise(() => {})),
  },
}));

jest.mock('@react-navigation/native', () => ({
  useFocusEffect: jest.fn(),
}));

describe('WalletScreen – render', () => {
  const renderer = require('react-test-renderer');
  const { act } = renderer;
  const { WalletScreen } = require('../screens/WalletScreen');

  beforeAll(() => { (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true; });
  afterAll(() => { delete (globalThis as any).IS_REACT_ACT_ENVIRONMENT; });

  function render(): any {
    let component: any;
    act(() => { component = renderer.create(React.createElement(WalletScreen)); });
    return component;
  }

  function allText(component: any): string {
    const spans = component.root.findAllByType('span');
    return spans.map((n: any) => (n.children || []).join('')).join(' ');
  }

  it('renders loading state on initial render', () => {
    const c = render();
    const text = allText(c);
    expect(text).toContain('Loading wallet...');
  });

  it('does not show balance card while loading', () => {
    const c = render();
    const text = allText(c);
    expect(text).not.toContain('LEDGER BALANCE');
    expect(text).not.toContain('INTEGRITY');
    expect(text).not.toContain('Transaction History');
  });

  it('exports WalletScreen as a named function', () => {
    expect(WalletScreen).toBeDefined();
    expect(typeof WalletScreen).toBe('function');
    expect(WalletScreen.name).toBe('WalletScreen');
  });
});
