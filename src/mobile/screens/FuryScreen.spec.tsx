import React from 'react';
import { render } from '@testing-library/react';
import { SupportTraceErrorBanner } from '../components/SupportTraceErrorBanner';
import { parseSupportTraceMessage } from '../utils/support-trace';

jest.mock('../services/ApiClient', () => ({
  ApiClient: {
    getFuryQueue: jest.fn(),
    getFuryStats: jest.fn(),
    submitVerdict: jest.fn(),
  },
}));

function collectText(node: any): string {
  if (node == null || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(collectText).join('');
  return collectText(node.props?.children);
}

describe('FuryScreen – trace-ID display', () => {
  it('renders trace ID when verdict submission fails with request_id', () => {
    const tree = SupportTraceErrorBanner({
      value: 'Failed to submit verdict [request_id: fury-verdict-001]',
    }) as any;
    const text = collectText(tree);

    expect(text).toContain('Failed to submit verdict');
    expect(text).toContain('Support trace ID');
    expect(text).toContain('fury-verdict-001');
    expect(text).not.toContain('[request_id:');
  });

  it('does not render trace ID when error has no request_id suffix', () => {
    const tree = SupportTraceErrorBanner({
      value: 'Queue is empty',
    }) as any;
    const text = collectText(tree);

    expect(text).toContain('Queue is empty');
    expect(text).not.toContain('Support trace ID');
  });

  it('renders trace ID for accuracy demotion error', () => {
    const tree = SupportTraceErrorBanner({
      value: 'Accuracy below threshold — review privileges suspended [request_id: fury-acc-low]',
    }) as any;
    const text = collectText(tree);

    expect(text).toContain('Accuracy below threshold');
    expect(text).toContain('fury-acc-low');
  });

  it('renders trace ID for bounty claim error', () => {
    const tree = SupportTraceErrorBanner({
      value: 'Bounty already claimed [request_id: fury-bounty-dup]',
    }) as any;
    const text = collectText(tree);

    expect(text).toContain('Bounty already claimed');
    expect(text).toContain('fury-bounty-dup');
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

describe('FuryScreen – parseSupportTraceMessage edge cases', () => {
  it('extracts trace ID from queue load error', () => {
    const result = parseSupportTraceMessage(
      'Failed to load audit queue [request_id: fury-queue-err]',
    );
    expect(result.message).toBe('Failed to load audit queue');
    expect(result.traceId).toBe('fury-queue-err');
  });

  it('returns null traceId for generic network error', () => {
    const result = parseSupportTraceMessage('Network error');
    expect(result.message).toBe('Network error');
    expect(result.traceId).toBeNull();
  });

  it('handles forbidden audit access error', () => {
    const result = parseSupportTraceMessage(
      'You cannot audit your own contract [request_id: fury-403-self]',
    );
    expect(result.message).toBe('You cannot audit your own contract');
    expect(result.traceId).toBe('fury-403-self');
  });

  it('handles stats load failure', () => {
    const result = parseSupportTraceMessage(
      'Failed to load fury stats [request_id: fury-stats-500]',
    );
    expect(result.message).toBe('Failed to load fury stats');
    expect(result.traceId).toBe('fury-stats-500');
  });

  it('returns empty message for undefined input', () => {
    const result = parseSupportTraceMessage(undefined);
    expect(result.message).toBe('');
    expect(result.traceId).toBeNull();
  });
});

describe('FuryScreen – render tests', () => {
  const { FuryScreen } = require('../screens/FuryScreen');
  const { ApiClient } = require('../services/ApiClient');

  beforeEach(() => {
    // Keep render tests in a stable loading state to avoid post-assertion async updates.
    (ApiClient.getFuryQueue as jest.Mock).mockReturnValue(new Promise(() => {}));
    (ApiClient.getFuryStats as jest.Mock).mockReturnValue(new Promise(() => {}));
  });

  function renderFury() {
    return render(React.createElement(FuryScreen));
  }

  function allText(container: HTMLElement): string {
    return container.textContent || '';
  }

  it('shows loading indicator initially', () => {
    // On initial render, loading=true, so the component returns the
    // ActivityIndicator loading view. It should not contain queue-specific text.
    const { container } = renderFury();
    const text = allText(container);

    expect(text).not.toContain('Queue Empty');
    expect(text).not.toContain('VERIFY');
    expect(text).not.toContain('BURN');
  });

  it('does not render verdict buttons while loading', () => {
    const { container } = renderFury();
    const text = allText(container);

    expect(text).not.toContain('VERIFY');
    expect(text).not.toContain('BURN');
    expect(text).not.toContain('Video Proof');
  });

  it('does not render stats bar while loading', () => {
    const { container } = renderFury();
    const text = allText(container);

    expect(text).not.toContain('Audits');
    expect(text).not.toContain('Accuracy');
    expect(text).not.toContain('Earnings');
  });
});
