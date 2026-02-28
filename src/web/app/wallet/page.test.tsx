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
    getUserContracts: jest.fn().mockResolvedValue([]),
    getBalance: jest.fn().mockResolvedValue({
      userId: '1',
      email: 'test@styx.io',
      integrityScore: 75,
      allowedTiers: ['TIER_2_STANDARD'],
      ledgerBalance: 250.00,
      status: 'ACTIVE',
    }),
    getHistory: jest.fn().mockResolvedValue({ transactions: [] }),
  },
}));

jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: '1', email: 'test@styx.io', integrity_score: 75, role: 'USER' },
    token: 'mock-token',
    login: jest.fn(),
    register: jest.fn(),
    logout: jest.fn(),
    isLoading: false,
  }),
}));

import WalletDashboard from './page';

describe('Wallet Page', () => {
  it('renders the Capital Escrow heading', () => {
    const html = renderToStaticMarkup(<WalletDashboard />);

    expect(html).toContain('Capital Escrow');
  });

  it('renders the financial identity description', () => {
    const html = renderToStaticMarkup(<WalletDashboard />);

    expect(html).toContain('Your Financial Identity');
    expect(html).toContain('loss aversion');
  });

  it('renders the RETURN TO IDENTITY link', () => {
    const html = renderToStaticMarkup(<WalletDashboard />);

    expect(html).toContain('href="/dashboard"');
    expect(html).toContain('RETURN TO IDENTITY');
  });

  it('renders the EscrowConnect component', () => {
    const html = renderToStaticMarkup(<WalletDashboard />);

    expect(html).toContain('Fiat Bridge');
    expect(html).toContain('CONNECT BANK ACCOUNT');
  });

  it('renders the AUTHORIZE NEW DEPOSIT link', () => {
    const html = renderToStaticMarkup(<WalletDashboard />);

    expect(html).toContain('AUTHORIZE NEW DEPOSIT');
    expect(html).toContain('href="/contracts/new"');
  });

  it('renders Active Escrow Contracts section', () => {
    const html = renderToStaticMarkup(<WalletDashboard />);

    expect(html).toContain('Active Escrow Contracts');
  });
});
