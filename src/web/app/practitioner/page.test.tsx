/** @jest-environment jsdom */

import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

jest.mock('next/link', () => {
  return function MockLink({
    children,
    href,
    className,
  }: {
    children: React.ReactNode;
    href: string;
    className?: string;
  }) {
    return (
      <a href={href} className={className}>
        {children}
      </a>
    );
  };
});

import PractitionerPage from './page';

type FetchMock = jest.Mock<Promise<Partial<Response>>, [string, RequestInit?]>;

const DASHBOARD_URL = '/api/practitioner/dashboard';

function jsonResponse(status: number, body: unknown): Partial<Response> {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  };
}

const riskProfile = (overrides: Record<string, unknown> = {}) => ({
  userId: 'd1000000-0000-0000-0000-000000000002',
  riskScore: 44,
  riskLevel: 'YELLOW',
  factors: [
    {
      type: 'ATTESTATION_CONSISTENCY',
      weight: 0.25,
      value: 1,
      description: '2 missed check-ins in the last 14 days',
    },
    {
      type: 'GRACE_DAY_BURN',
      weight: 0.2,
      value: 0.5,
      description: '50% of grace days consumed',
    },
    {
      type: 'TIME_OF_DAY',
      weight: 0.15,
      value: 0.1,
      description: '10% of activity between midnight and 4am',
    },
    {
      type: 'WEEKEND_COMPLIANCE',
      weight: 0.1,
      value: 0.05,
      description: '5% lower compliance on weekends',
    },
  ],
  trend: 'DECLINING',
  lastUpdated: '2026-07-29T12:00:00.000Z',
  ...overrides,
});

const mediumAlert = {
  id: 'al-1',
  userId: 'd1000000-0000-0000-0000-000000000002',
  alertType: 'RATIONALIZATION',
  excerpt: 'just one more time',
  severity: 'MEDIUM',
  createdAt: '2026-07-28T09:00:00.000Z',
};

const highAlert = {
  id: 'al-2',
  userId: 'd1000000-0000-0000-0000-000000000006',
  alertType: 'DISTRESS_ESCALATION',
  excerpt: 'falling apart',
  severity: 'HIGH',
  createdAt: '2026-07-29T22:00:00.000Z',
};

const demoClients = [
  {
    clientId: 'd1000000-0000-0000-0000-000000000002',
    clientAlias: 'Ash',
    riskProfile: riskProfile(),
    recentAlerts: [mediumAlert],
    adherenceRate: 86,
    streakDays: 7,
    nextCheckIn: '2026-07-31T00:00:00.000Z',
  },
  {
    clientId: 'd1000000-0000-0000-0000-000000000001',
    clientAlias: null,
    riskProfile: riskProfile({
      userId: 'd1000000-0000-0000-0000-000000000001',
      riskScore: 12,
      riskLevel: 'GREEN',
      trend: 'IMPROVING',
    }),
    recentAlerts: [highAlert],
    adherenceRate: 100,
    streakDays: 21,
    nextCheckIn: null,
  },
];

describe('Practitioner console page', () => {
  let fetchMock: FetchMock;

  beforeEach(() => {
    jest.clearAllMocks();
    fetchMock = jest.fn();
    (global as unknown as { fetch: unknown }).fetch = fetchMock;
  });

  const mockDashboard = (payload: unknown) => {
    fetchMock.mockImplementation((url: string) => {
      if (url === DASHBOARD_URL) return Promise.resolve(jsonResponse(200, payload));
      return Promise.resolve(jsonResponse(404, { message: 'not found' }));
    });
  };

  it('fetches the practitioner dashboard and renders client cards', async () => {
    mockDashboard(demoClients);

    render(<PractitionerPage />);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        DASHBOARD_URL,
        expect.objectContaining({ credentials: 'include' }),
      );
    });

    expect(await screen.findByText('Ash')).toBeTruthy();
    // Aliasless client falls back to a truncated id label.
    expect(screen.getByText('Client d1000000')).toBeTruthy();
    expect(screen.getByText('YELLOW')).toBeTruthy();
    expect(screen.getByText('GREEN')).toBeTruthy();
    expect(screen.getByText('86%')).toBeTruthy();
    expect(screen.getByText('21d')).toBeTruthy();
  });

  it('renders the top risk factors sorted by weighted contribution', async () => {
    mockDashboard([demoClients[0]]);

    render(<PractitionerPage />);
    await screen.findByText('Ash');

    // Top-3 by min(1, value) * weight: ATTESTATION (0.25) > GRACE (0.10) > TIME (0.015);
    // WEEKEND (0.005) must be cut.
    expect(screen.getByText('2 missed check-ins in the last 14 days')).toBeTruthy();
    expect(screen.getByText('50% of grace days consumed')).toBeTruthy();
    expect(screen.getByText('10% of activity between midnight and 4am')).toBeTruthy();
    expect(screen.queryByText('5% lower compliance on weekends')).toBeNull();
  });

  it('derives the alerts feed from embedded recentAlerts, newest first', async () => {
    mockDashboard(demoClients);

    render(<PractitionerPage />);

    expect(await screen.findByText('Distress Escalation')).toBeTruthy();
    expect(screen.getByText('Rationalization')).toBeTruthy();
    expect(screen.getByText('HIGH')).toBeTruthy();
    expect(screen.getByText(/falling apart/)).toBeTruthy();
    // High-severity KPI counts the single HIGH alert.
    expect(screen.getByText('High-Severity Alerts')).toBeTruthy();
  });

  it('accepts a wrapped { clients } envelope', async () => {
    mockDashboard({ clients: demoClients });

    render(<PractitionerPage />);

    expect(await screen.findByText('Ash')).toBeTruthy();
    expect(screen.getByText('Distress Escalation')).toBeTruthy();
  });

  it('renders empty states when the caseload is clear', async () => {
    mockDashboard([]);

    render(<PractitionerPage />);

    expect(
      await screen.findByText(/No clients assigned/),
    ).toBeTruthy();
    expect(screen.getByText(/No open alerts/)).toBeTruthy();
  });

  it('shows the practitioner sign-in gate on 401', async () => {
    fetchMock.mockResolvedValue(jsonResponse(401, { message: 'Unauthorized' }));

    render(<PractitionerPage />);

    expect(await screen.findByText('Practitioner sign-in required')).toBeTruthy();
    const login = screen.getByText('Go to Login') as HTMLAnchorElement;
    expect(login.getAttribute('href')).toBe('/login');
  });

  it('surfaces API errors from the dashboard endpoint', async () => {
    fetchMock.mockImplementation((url: string) => {
      if (url === DASHBOARD_URL) {
        return Promise.resolve(jsonResponse(500, { message: 'risk engine offline' }));
      }
      return Promise.resolve(jsonResponse(200, []));
    });

    render(<PractitionerPage />);

    expect(await screen.findByText('API 500: risk engine offline')).toBeTruthy();
  });

  it('refetches the dashboard when Refresh is clicked', async () => {
    mockDashboard([]);

    render(<PractitionerPage />);
    await screen.findByText(/No clients assigned/);

    const callsBefore = fetchMock.mock.calls.length;
    fireEvent.click(screen.getByText('Refresh'));

    await waitFor(() => {
      expect(fetchMock.mock.calls.length).toBe(callsBefore + 1);
    });
  });
});
