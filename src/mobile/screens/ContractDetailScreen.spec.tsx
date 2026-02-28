import React from 'react';
import { render } from '@testing-library/react';
import { SupportTraceErrorBanner } from '../components/SupportTraceErrorBanner';
import { parseSupportTraceMessage } from '../utils/support-trace';

jest.mock('../services/ApiClient', () => ({
  ApiClient: {
    getContract: jest.fn(),
    submitProof: jest.fn(),
    useGraceDay: jest.fn(),
    fileDispute: jest.fn(),
  },
}));

function collectText(node: any): string {
  if (node == null || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(collectText).join('');
  return collectText(node.props?.children);
}

describe('ContractDetailScreen – trace-ID display', () => {
  it('renders trace ID when contract load fails with request_id', () => {
    const tree = SupportTraceErrorBanner({
      value: 'Contract not found [request_id: cdetail-404-abc]',
    }) as any;
    const text = collectText(tree);

    expect(text).toContain('Contract not found');
    expect(text).toContain('Support trace ID');
    expect(text).toContain('cdetail-404-abc');
    expect(text).not.toContain('[request_id:');
  });

  it('does not render trace ID when error has no request_id suffix', () => {
    const tree = SupportTraceErrorBanner({
      value: 'Failed to load contract',
    }) as any;
    const text = collectText(tree);

    expect(text).toContain('Failed to load contract');
    expect(text).not.toContain('Support trace ID');
  });

  it('renders trace ID for proof submission error', () => {
    const tree = SupportTraceErrorBanner({
      value: 'Proof submission rejected — contract expired [request_id: cdetail-proof-exp]',
    }) as any;
    const text = collectText(tree);

    expect(text).toContain('Proof submission rejected');
    expect(text).toContain('cdetail-proof-exp');
  });

  it('renders trace ID for grace day error', () => {
    const tree = SupportTraceErrorBanner({
      value: 'No grace days remaining [request_id: cdetail-grace-none]',
    }) as any;
    const text = collectText(tree);

    expect(text).toContain('No grace days remaining');
    expect(text).toContain('cdetail-grace-none');
  });

  it('renders trace ID for dispute filing error', () => {
    const tree = SupportTraceErrorBanner({
      value: 'Dispute already filed for this contract [request_id: cdetail-dispute-dup]',
    }) as any;
    const text = collectText(tree);

    expect(text).toContain('Dispute already filed for this contract');
    expect(text).toContain('cdetail-dispute-dup');
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

describe('ContractDetailScreen – parseSupportTraceMessage edge cases', () => {
  it('extracts trace ID from forbidden access error', () => {
    const result = parseSupportTraceMessage(
      'You do not own this contract [request_id: cdetail-403-own]',
    );
    expect(result.message).toBe('You do not own this contract');
    expect(result.traceId).toBe('cdetail-403-own');
  });

  it('returns null traceId for client-side action error', () => {
    const result = parseSupportTraceMessage('Action failed');
    expect(result.message).toBe('Action failed');
    expect(result.traceId).toBeNull();
  });

  it('handles banned user error on proof submission', () => {
    const result = parseSupportTraceMessage(
      'Account suspended — contact support [request_id: cdetail-banned-usr]',
    );
    expect(result.message).toBe('Account suspended — contact support');
    expect(result.traceId).toBe('cdetail-banned-usr');
  });

  it('handles attestation navigation error', () => {
    const result = parseSupportTraceMessage(
      'Attestation unavailable for non-recovery contracts [request_id: cdetail-att-cat]',
    );
    expect(result.message).toBe('Attestation unavailable for non-recovery contracts');
    expect(result.traceId).toBe('cdetail-att-cat');
  });

  it('returns empty message for undefined input', () => {
    const result = parseSupportTraceMessage(undefined);
    expect(result.message).toBe('');
    expect(result.traceId).toBeNull();
  });
});

describe('ContractDetailScreen – render tests', () => {
  const { ContractDetailScreen } = require('../screens/ContractDetailScreen');

  const mockNavigation = {
    navigate: jest.fn(),
    goBack: jest.fn(),
    setOptions: jest.fn(),
  } as any;

  const mockRoute = {
    params: { contractId: 'test-contract-123' },
    key: 'ContractDetail',
    name: 'ContractDetail' as const,
  } as any;

  it('shows loading indicator initially', () => {
    // On initial render, loading=true, so the component returns the
    // ActivityIndicator loading view (rendered as a span via the mock).
    const { container } = render(
      React.createElement(ContractDetailScreen, {
        navigation: mockNavigation,
        route: mockRoute,
      }),
    );

    // The loading state returns: <View><ActivityIndicator /></View>
    // The tree should not contain any contract-specific text since data hasn't loaded.
    expect(container.textContent).not.toContain('Proof History');
    expect(container.textContent).not.toContain('Contract not found');
  });
});
