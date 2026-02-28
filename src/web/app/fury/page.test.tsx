import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
}));

jest.mock('next/link', () => {
  return function MockLink({ children, href }: { children: React.ReactNode; href: string }) {
    return <a href={href}>{children}</a>;
  };
});

jest.mock('../../services/api-client', () => ({
  api: {
    getFuryStats: jest.fn().mockResolvedValue({
      totalAudits: 0,
      successfulAudits: 0,
      falseAccusations: 0,
      accuracy: 0,
      totalBountiesEarned: 0,
      totalPenaltiesPaid: 0,
      netEarnings: 0,
      honeypotsCaught: 0,
      honeypotsFailedOn: 0,
    }),
    submitVerdict: jest.fn(),
    issueFuryStreamCookie: jest.fn(),
  },
  getAuthToken: jest.fn().mockReturnValue('mock-token'),
}));

jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: '1', email: 'fury@styx.io', integrity_score: 90, role: 'USER' },
    token: 'mock-token',
    login: jest.fn(),
    register: jest.fn(),
    logout: jest.fn(),
    isLoading: false,
  }),
}));

jest.mock('../../store/useFuryStore', () => ({
  useFuryStore: Object.assign(
    jest.fn(() => ({
      assignments: [],
      isConnected: true,
      error: null,
      connectStream: jest.fn(),
      disconnectStream: jest.fn(),
      removeAssignment: jest.fn(),
    })),
    {
      getState: jest.fn(() => ({
        assignments: [],
        isConnected: true,
        error: null,
        connectStream: jest.fn(),
        disconnectStream: jest.fn(),
        removeAssignment: jest.fn(),
      })),
      setState: jest.fn(),
    },
  ),
}));

import FuryWorkbench from './page';

describe('Fury Page', () => {
  it('renders The Panopticon heading', () => {
    const html = renderToStaticMarkup(<FuryWorkbench />);

    expect(html).toContain('The Panopticon');
  });

  it('renders the Fury Peer Review Pipeline subtitle', () => {
    const html = renderToStaticMarkup(<FuryWorkbench />);

    expect(html).toContain('Fury Peer Review Pipeline');
  });

  it('renders queue depth indicator', () => {
    const html = renderToStaticMarkup(<FuryWorkbench />);

    expect(html).toContain('Queue Depth');
  });

  it('renders empty queue state when no assignments', () => {
    const html = renderToStaticMarkup(<FuryWorkbench />);

    expect(html).toContain('Queue Empty');
    expect(html).toContain('No proofs awaiting review');
  });

  it('shows live connection indicator in empty queue state', () => {
    const html = renderToStaticMarkup(<FuryWorkbench />);

    expect(html).toContain('Live Connection Active');
  });
});
