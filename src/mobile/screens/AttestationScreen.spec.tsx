import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react';
import { SupportTraceErrorBanner } from '../components/SupportTraceErrorBanner';
import { parseSupportTraceMessage } from '../utils/support-trace';

function collectText(node: any): string {
  if (node == null || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(collectText).join('');
  return collectText(node.props?.children);
}

describe('AttestationScreen – trace-ID display', () => {
  it('renders trace ID when error contains request_id suffix', () => {
    const tree = SupportTraceErrorBanner({
      value: 'Failed to load attestation status [request_id: att-trace-001]',
    }) as any;
    const text = collectText(tree);

    expect(text).toContain('Failed to load attestation status');
    expect(text).toContain('Support trace ID');
    expect(text).toContain('att-trace-001');
    expect(text).not.toContain('[request_id:');
  });

  it('does not render trace ID when error has no request_id suffix', () => {
    const tree = SupportTraceErrorBanner({
      value: 'Failed to submit attestation',
    }) as any;
    const text = collectText(tree);

    expect(text).toContain('Failed to submit attestation');
    expect(text).not.toContain('Support trace ID');
  });

  it('renders trace ID for "already attested today" API error', () => {
    const tree = SupportTraceErrorBanner({
      value: 'Already attested today [request_id: att-dup-xyz]',
    }) as any;
    const text = collectText(tree);

    expect(text).toContain('Already attested today');
    expect(text).toContain('att-dup-xyz');
  });

  it('renders trace ID for non-recovery contract error', () => {
    const tree = SupportTraceErrorBanner({
      value: 'Attestation only available for recovery contracts [request_id: att-cat-err]',
    }) as any;
    const text = collectText(tree);

    expect(text).toContain('Attestation only available for recovery contracts');
    expect(text).toContain('att-cat-err');
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

describe('AttestationScreen – parseSupportTraceMessage edge cases', () => {
  it('extracts trace ID from submission error', () => {
    const result = parseSupportTraceMessage(
      'Contract not found [request_id: att-404-abc]',
    );
    expect(result.message).toBe('Contract not found');
    expect(result.traceId).toBe('att-404-abc');
  });

  it('returns null traceId for client-side errors', () => {
    const result = parseSupportTraceMessage('Failed to submit attestation');
    expect(result.message).toBe('Failed to submit attestation');
    expect(result.traceId).toBeNull();
  });

  it('handles streak-related error messages', () => {
    const result = parseSupportTraceMessage(
      'Streak broken — contract auto-failed [request_id: att-fail-streak]',
    );
    expect(result.message).toBe('Streak broken — contract auto-failed');
    expect(result.traceId).toBe('att-fail-streak');
  });

  it('handles forbidden access error', () => {
    const result = parseSupportTraceMessage(
      'You do not own this contract [request_id: att-403-own]',
    );
    expect(result.message).toBe('You do not own this contract');
    expect(result.traceId).toBe('att-403-own');
  });

  it('returns empty message for undefined input', () => {
    const result = parseSupportTraceMessage(undefined);
    expect(result.message).toBe('');
    expect(result.traceId).toBeNull();
  });
});

/* ------------------------------------------------------------------ */
/*  AttestationScreen – render tests                                  */
/* ------------------------------------------------------------------ */

jest.mock('../services/ApiClient', () => ({
  ApiClient: {
    getAttestationStatus: jest.fn().mockReturnValue(new Promise(() => {})),
    submitAttestation: jest.fn(),
  },
}));

describe('AttestationScreen – render', () => {
  const { AttestationScreen } = require('../screens/AttestationScreen');
  const { ApiClient } = require('../services/ApiClient');

  const mockRoute = { params: { contractId: 'test-contract-123' } } as any;
  const mockNav = { navigate: jest.fn(), goBack: jest.fn(), setOptions: jest.fn() } as any;

  function renderScreen() {
    return render(
      React.createElement(AttestationScreen, { route: mockRoute, navigation: mockNav }),
    );
  }

  function allText(container: HTMLElement): string {
    return container.textContent || '';
  }

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('does not render attestation content while loading', () => {
    const { container } = renderScreen();
    const text = allText(container);
    expect(text).not.toContain('Daily Attestation');
    expect(text).not.toContain('I HELD THE LINE');
  });

  it('calls getAttestationStatus with the correct contractId', () => {
    renderScreen();
    expect(ApiClient.getAttestationStatus).toHaveBeenCalledWith('test-contract-123');
  });

  it('does not render attestation stats while loading', () => {
    const { container } = renderScreen();
    const text = allText(container);
    expect(text).not.toContain('Day Streak');
    expect(text).not.toContain('Days Left');
    expect(text).not.toContain('Grace Days');
  });

  it('exports AttestationScreen as a named function', () => {
    expect(AttestationScreen).toBeDefined();
    expect(typeof AttestationScreen).toBe('function');
    expect(AttestationScreen.name).toBe('AttestationScreen');
  });

  it('renders snake_case attestation status data from the API', async () => {
    (ApiClient.getAttestationStatus as jest.Mock).mockResolvedValueOnce({
      contract_id: 'test-contract-123',
      oath_category: 'RECOVERY_NOCONTACT',
      streak_days: 12,
      days_remaining: 18,
      grace_days_available: 2,
      today_attested: false,
      total_strikes: 1,
    });

    const { getByText } = renderScreen();

    expect(await waitFor(() => getByText('Daily Attestation'))).toBeTruthy();
    expect(getByText('12')).toBeTruthy();
    expect(getByText('18')).toBeTruthy();
    expect(getByText('2')).toBeTruthy();
    expect(getByText('1 missed attestation — 2 remaining before auto-fail')).toBeTruthy();
    expect(getByText('I HELD THE LINE')).toBeTruthy();
  });

  it('submits a daily attestation and renders the confirmed state', async () => {
    (ApiClient.getAttestationStatus as jest.Mock).mockResolvedValueOnce({
      contract_id: 'test-contract-123',
      oath_category: 'RECOVERY_NOCONTACT',
      streak_days: 4,
      days_remaining: 10,
      grace_days_available: 3,
      today_attested: false,
      total_strikes: 0,
    });
    (ApiClient.submitAttestation as jest.Mock).mockResolvedValueOnce({
      status: 'ok',
    });

    const { getByText } = renderScreen();

    await waitFor(() => expect(getByText('I HELD THE LINE')).toBeTruthy());
    fireEvent.click(getByText('I HELD THE LINE').closest('button') as HTMLElement);

    await waitFor(() => {
      expect(ApiClient.submitAttestation).toHaveBeenCalledWith('test-contract-123');
      expect(getByText('Attestation Recorded')).toBeTruthy();
      expect(getByText('Back to Contract')).toBeTruthy();
    });
  });
});
