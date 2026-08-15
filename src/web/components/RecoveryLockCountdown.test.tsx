import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

jest.mock('../services/api-client', () => ({
  api: {
    getRecoveryLockStatus: jest.fn().mockResolvedValue({ activeRequest: null }),
    requestRecoveryBreak: jest.fn(),
    cancelRecoveryBreak: jest.fn(),
  },
}));

import RecoveryLockCountdown, { RecoveryLockPanel, formatCountdown } from './RecoveryLockCountdown';
import type { RecoveryBreakRequest } from '../services/api-client';

const NOW = Date.parse('2026-02-01T00:00:00Z');

function makeRequest(overrides: Partial<RecoveryBreakRequest> = {}): RecoveryBreakRequest {
  return {
    id: 'break-1',
    contract_id: 'contract-abc-123',
    requested_at: '2026-02-01T00:00:00Z',
    unlock_at: '2026-02-02T00:00:00Z',
    reason: 'I want out.',
    status: 'PENDING_COOLDOWN',
    ...overrides,
  };
}

const NOOP_PROPS = {
  now: NOW,
  canRequestBreak: true,
  reason: '',
  onReasonChange: () => undefined,
  onRequestBreak: () => undefined,
  onCancel: () => undefined,
  requesting: false,
  cancelling: false,
  error: null,
  notice: null,
};

describe('formatCountdown', () => {
  it('renders hours, zero-padded minutes and seconds', () => {
    expect(formatCountdown(3 * 3600_000 + 7 * 60_000 + 5_000)).toBe('3h 07m 05s');
  });

  it('rounds up so a partial second is still time owed', () => {
    expect(formatCountdown(1_200)).toBe('0h 00m 02s');
  });

  it('floors at zero rather than counting negative once unlock_at has passed', () => {
    expect(formatCountdown(-90_000)).toBe('0h 00m 00s');
  });
});

describe('RecoveryLockPanel', () => {
  it('offers the break request form when nothing is queued', () => {
    const html = renderToStaticMarkup(<RecoveryLockPanel {...NOOP_PROPS} request={null} />);

    expect(html).toContain('Request Break');
    expect(html).toContain('Why do you want to break this contract?');
    expect(html).not.toContain('Cancel Break Request');
  });

  it('explains the request is unavailable when the contract is not active', () => {
    const html = renderToStaticMarkup(
      <RecoveryLockPanel {...NOOP_PROPS} request={null} canRequestBreak={false} />,
    );

    expect(html).toContain('only be requested while the contract is active');
    expect(html).not.toContain('Request Break');
  });

  it('counts down to unlock_at and offers cancel while the cooldown runs', () => {
    const html = renderToStaticMarkup(
      <RecoveryLockPanel {...NOOP_PROPS} request={makeRequest()} />,
    );

    expect(html).toContain('Unlocks in');
    expect(html).toContain('24h 00m 00s');
    expect(html).toContain('Cancel Break Request');
    expect(html).toContain('I want out.');
    expect(html).not.toContain('Cooldown complete');
  });

  it('advances the countdown with the clock it is given', () => {
    const html = renderToStaticMarkup(
      <RecoveryLockPanel {...NOOP_PROPS} request={makeRequest()} now={NOW + 3600_000 + 90_000} />,
    );

    expect(html).toContain('22h 58m 30s');
  });

  // The UNLOCKED status is derived by the API from unlock_at; the client must
  // render what the server said rather than re-deciding from its own clock.
  it('shows the unlocked state for an UNLOCKED request even at a stale clock', () => {
    const html = renderToStaticMarkup(
      <RecoveryLockPanel {...NOOP_PROPS} request={makeRequest({ status: 'UNLOCKED' })} now={NOW} />,
    );

    expect(html).toContain('Cooldown complete');
    expect(html).not.toContain('Unlocks in');
    // The stored row is still PENDING_COOLDOWN, so cancelling remains real.
    expect(html).toContain('Cancel Break Request');
  });

  it('returns to the request form after a cancellation, noting the last attempt', () => {
    const html = renderToStaticMarkup(
      <RecoveryLockPanel {...NOOP_PROPS} request={makeRequest({ status: 'CANCELLED' })} />,
    );

    expect(html).toContain('Last request cancelled');
    expect(html).toContain('Request Break');
    expect(html).not.toContain('Cancel Break Request');
  });

  it('renders the error and notice lines when present', () => {
    const html = renderToStaticMarkup(
      <RecoveryLockPanel
        {...NOOP_PROPS}
        request={null}
        error="API 409: A break request is already in cooldown"
        notice="Break queued."
      />,
    );

    expect(html).toContain('A break request is already in cooldown');
    expect(html).toContain('Break queued.');
  });
});

describe('RecoveryLockCountdown', () => {
  it('renders a skeleton until the lock status resolves', () => {
    const html = renderToStaticMarkup(
      <RecoveryLockCountdown contractId="contract-abc-123" canRequestBreak />,
    );

    expect(html).toContain('animate-pulse');
    expect(html).not.toContain('Request Break');
  });
});
