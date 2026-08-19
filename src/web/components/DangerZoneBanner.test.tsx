import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

jest.mock('../services/api-client', () => ({
  api: {
    getDangerZoneStatus: jest.fn().mockResolvedValue({
      timezone: 'America/New_York',
      inDangerZone: false,
      contracts: [],
    }),
  },
}));

import DangerZoneBanner, { DangerZoneBanners } from './DangerZoneBanner';
import type { ContractDangerStatus } from '../services/api-client';

const IN_DANGER: ContractDangerStatus = {
  contractId: 'contract-abc-123',
  inDangerZone: true,
  windows: [
    { type: 'DAY_21', severity: 'CRITICAL', message: 'Day 21 is the extinction burst.' },
    { type: 'LATE_NIGHT', severity: 'MEDIUM', message: 'It is past midnight in your timezone.' },
  ],
  recommendations: [
    {
      type: 'DAY_21',
      action: 'Increase attestation frequency, consider reducing stakes',
      description: 'The extinction burst is the last attempt to revert habits.',
    },
    {
      type: 'LATE_NIGHT',
      action: 'Enable do-not-disturb, delete tempting apps',
      description: 'Late-night hours have weaker impulse control.',
    },
  ],
};

describe('DangerZoneBanners', () => {
  it('renders one banner per open window with its severity label', () => {
    const html = renderToStaticMarkup(<DangerZoneBanners status={IN_DANGER} />);

    expect(html).toContain('Day 21 is the extinction burst.');
    expect(html).toContain('It is past midnight in your timezone.');
    expect(html).toContain('Critical risk');
    expect(html).toContain('Medium risk');
  });

  // The API returns recommendations as a parallel list keyed by window type,
  // so a mismatched order must not pair the wrong advice with a window.
  it('pairs each recommendation with its own window by type, not by position', () => {
    const shuffled: ContractDangerStatus = {
      ...IN_DANGER,
      recommendations: [...IN_DANGER.recommendations].reverse(),
    };
    const html = renderToStaticMarkup(<DangerZoneBanners status={shuffled} />);

    const day21At = html.indexOf('Day 21 is the extinction burst.');
    const lateNightAt = html.indexOf('It is past midnight in your timezone.');
    const stakesAdviceAt = html.indexOf('consider reducing stakes');
    const dndAdviceAt = html.indexOf('Enable do-not-disturb');

    expect(day21At).toBeGreaterThan(-1);
    expect(stakesAdviceAt).toBeGreaterThan(day21At);
    expect(stakesAdviceAt).toBeLessThan(lateNightAt);
    expect(dndAdviceAt).toBeGreaterThan(lateNightAt);
  });

  it('renders nothing when the contract is not in a danger zone', () => {
    const html = renderToStaticMarkup(
      <DangerZoneBanners status={{ ...IN_DANGER, inDangerZone: false, windows: [] }} />,
    );

    expect(html).toBe('');
  });

  it('renders nothing when the account-wide status held no row for the contract', () => {
    expect(renderToStaticMarkup(<DangerZoneBanners status={null} />)).toBe('');
  });
});

describe('DangerZoneBanner', () => {
  it('renders nothing before the account-wide status resolves', () => {
    const html = renderToStaticMarkup(<DangerZoneBanner contractId="contract-abc-123" />);

    expect(html).toBe('');
  });
});
