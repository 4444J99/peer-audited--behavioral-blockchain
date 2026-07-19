import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

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
    return <a href={href} className={className}>{children}</a>;
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

  it('renders the relationship-recovery beta tagline', () => {
    const html = renderToStaticMarkup(<Home />);

    expect(html).toContain('Private beta for no-contact recovery.');
    expect(html).toContain('test-money commitments');
    expect(html).toContain('small US allowlist');
  });

  it('renders the START RECOVERY button', () => {
    const html = renderToStaticMarkup(<Home />);

    expect(html).toContain('START RECOVERY');
  });

  it('links to login when user is not authenticated', () => {
    const html = renderToStaticMarkup(<Home />);

    expect(html).toContain('href="/login"');
  });

  it('does not render the removed manifesto or ask CTAs', () => {
    const html = renderToStaticMarkup(<Home />);

    expect(html).not.toContain('VIEW THE MANIFESTO');
    expect(html).not.toContain('ASK STYX AI');
    expect(html).not.toContain('href="/pitch"');
    expect(html).not.toContain('href="/ask"');
  });

  it('renders the feature grid cards', () => {
    const html = renderToStaticMarkup(<Home />);

    expect(html).toContain('DAILY CHECK-INS');
    expect(html).toContain('ACCOUNTABILITY PARTNER');
    expect(html).toContain('TEST-MONEY PILOT');
  });

  it('describes the recovery commitment model', () => {
    const html = renderToStaticMarkup(<Home />);

    expect(html).toContain('daily attestations');
    expect(html).toContain('trusted person into the loop');
    expect(html).toContain('No real funds move in this beta');
  });

  it('renders the Styx logo circle', () => {
    const html = renderToStaticMarkup(<Home />);

    expect(html).toContain('>S</span>');
  });

  it('links only to login when the user is unauthenticated', () => {
    const html = renderToStaticMarkup(<Home />);

    expect(html).toContain('href="/login"');
    expect(html.match(/href=\"\//g)?.length).toBe(1);
  });

  it('styles the primary recovery CTA as a white pill button', () => {
    const html = renderToStaticMarkup(<Home />);

    expect(html).toContain('class="px-8 py-4 bg-white text-black font-extrabold rounded-full hover:bg-neutral-200 hover:scale-105 transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)]"');
  });

  it('renders a single recovery CTA', () => {
    const html = renderToStaticMarkup(<Home />);

    expect(html).toContain('START RECOVERY');
    expect(html.match(/<a /g)?.length).toBe(1);
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
      return function MockLink({
        children,
        href,
        className,
      }: {
        children: React.ReactNode;
        href: string;
        className?: string;
      }) {
        return <a href={href} className={className}>{children}</a>;
      };
    });

    const { default: HomeWithUser } = require('./page');
    const html = renderToStaticMarkup(<HomeWithUser />);

    expect(html).toContain('href="/dashboard"');
  });
});
