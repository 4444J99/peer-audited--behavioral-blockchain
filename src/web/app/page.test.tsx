import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

jest.mock('next/link', () => {
  return function MockLink({ children, href }: { children: React.ReactNode; href: string }) {
    return <a href={href}>{children}</a>;
  };
});

jest.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: null,
    token: null,
    login: jest.fn(),
    register: jest.fn(),
    logout: jest.fn(),
    isLoading: false,
  }),
}));

import Home from './page';

describe('Landing Page', () => {
  it('renders the STYX heading', () => {
    const html = renderToStaticMarkup(<Home />);

    expect(html).toContain('STYX');
  });

  it('renders the tagline about Blockchain of Truth', () => {
    const html = renderToStaticMarkup(<Home />);

    expect(html).toContain('Blockchain of Truth');
  });

  it('renders the ENTER THE ARENA button', () => {
    const html = renderToStaticMarkup(<Home />);

    expect(html).toContain('ENTER THE ARENA');
  });

  it('links to login when user is not authenticated', () => {
    const html = renderToStaticMarkup(<Home />);

    expect(html).toContain('href="/login"');
  });

  it('renders the VIEW THE MANIFESTO link to pitch page', () => {
    const html = renderToStaticMarkup(<Home />);

    expect(html).toContain('VIEW THE MANIFESTO');
    expect(html).toContain('href="/pitch"');
  });

  it('renders the feature grid cards', () => {
    const html = renderToStaticMarkup(<Home />);

    expect(html).toContain('ZERO TRUST');
    expect(html).toContain('WEAPONIZED WHISTLEBLOWER');
    expect(html).toContain('HARD LEDGER');
  });

  it('describes the loss aversion mechanism', () => {
    const html = renderToStaticMarkup(<Home />);

    expect(html).toContain('loss aversion');
    expect(html).toContain('No Contact');
  });

  it('renders the Styx logo circle', () => {
    const html = renderToStaticMarkup(<Home />);

    expect(html).toContain('>S</span>');
  });

  it('renders the ASK STYX AI link to ask page', () => {
    const html = renderToStaticMarkup(<Home />);

    expect(html).toContain('ASK STYX AI');
    expect(html).toContain('href="/ask"');
  });

  it('styles ASK STYX AI button with red hover border', () => {
    const html = renderToStaticMarkup(<Home />);

    // The /ask link has hover:border-red-600 to differentiate from the manifesto link
    expect(html).toContain('hover:border-red-600');
  });

  it('renders all three CTA buttons', () => {
    const html = renderToStaticMarkup(<Home />);

    expect(html).toContain('ENTER THE ARENA');
    expect(html).toContain('VIEW THE MANIFESTO');
    expect(html).toContain('ASK STYX AI');
  });

  it('links to dashboard when user is authenticated', () => {
    // Reset modules to apply new mock
    jest.resetModules();
    jest.doMock('../contexts/AuthContext', () => ({
      useAuth: () => ({
        user: { id: '1', email: 'test@styx.io', integrity_score: 50, role: 'USER' },
        token: 'token',
        isLoading: false,
      }),
    }));
    jest.doMock('next/link', () => {
      return function MockLink({ children, href }: { children: React.ReactNode; href: string }) {
        return <a href={href}>{children}</a>;
      };
    });

    const { default: HomeWithUser } = require('./page');
    const html = renderToStaticMarkup(<HomeWithUser />);

    expect(html).toContain('href="/dashboard"');
  });
});
