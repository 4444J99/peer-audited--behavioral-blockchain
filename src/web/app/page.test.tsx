import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

jest.mock('next/link', () => {
  return function MockLink({ children, href, className }: { children: React.ReactNode; href: string; className?: string }) {
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

jest.mock('lucide-react', () => ({
  Shield: 'svg',
  Award: 'svg',
  Eye: 'svg',
  HeartHandshake: 'svg',
  ArrowRight: 'svg',
  BookOpen: 'svg',
  MessageCircle: 'svg',
}));

import Home from './page';

describe('Landing Page', () => {
  it('renders the STYX heading', () => {
    const html = renderToStaticMarkup(<Home />);
    expect(html).toContain('STYX');
  });

  it('renders the beta tagline', () => {
    const html = renderToStaticMarkup(<Home />);
    expect(html).toContain('Peer-audited behavioral accountability');
    expect(html).toContain('Private Beta');
    expect(html).toContain('Test-Money Pilot');
  });

  it('renders the JOIN THE PRIVATE BETA button', () => {
    const html = renderToStaticMarkup(<Home />);
    expect(html).toContain('JOIN THE PRIVATE BETA');
  });

  it('routes the public CTA to the beta waitlist when not authenticated', () => {
    const html = renderToStaticMarkup(<Home />);
    expect(html).toContain('href="/beta"');
  });

  it('renders trust badges', () => {
    const html = renderToStaticMarkup(<Home />);
    expect(html).toContain('FBO Escrow Account');
    expect(html).toContain('Peer-Audited');
    expect(html).toContain('Loss Aversion');
    expect(html).toContain('Safety First');
  });

  it('renders the STYX Method section', () => {
    const html = renderToStaticMarkup(<Home />);
    expect(html).toContain('Commit with Stakes');
    expect(html).toContain('Anonymous Peer Audit');
    expect(html).toContain('Double-Entry Ledger');
  });

  it('renders contract category badges', () => {
    const html = renderToStaticMarkup(<Home />);
    expect(html).toContain('Recovery');
    expect(html).toContain('Biological');
    expect(html).toContain('Cognitive');
    expect(html).toContain('Character');
  });

  it('renders the Styx logo circle', () => {
    const html = renderToStaticMarkup(<Home />);
    expect(html).toContain('>S</span>');
  });

  it('has a behavioral science section', () => {
    const html = renderToStaticMarkup(<Home />);
    expect(html).toContain('Built on Behavioral Science');
    expect(html).toContain('prospect theory');
  });

  it('has a FAQ link in bottom CTA', () => {
    const html = renderToStaticMarkup(<Home />);
    expect(html).toContain('href="/help"');
  });

  it('does not render the removed manifesto or old CTAs', () => {
    const html = renderToStaticMarkup(<Home />);
    expect(html).toContain('JOIN THE PRIVATE BETA');
    expect(html.match(/<a /g)?.length).toBe(1);
  });

  it('links to dashboard when user is authenticated', () => {
    jest.resetModules();
    jest.doMock('../contexts/AuthContext', () => ({
      useAuth: () => ({
        user: { id: '1', email: 'test@styx.io', integrity_score: 50, role: 'USER' },
        token: 'token',
        isLoading: false,
      }),
    }));
    jest.doMock('next/link', () => {
      return function MockLink({ children, href, className }: { children: React.ReactNode; href: string; className?: string }) {
        return <a href={href} className={className}>{children}</a>;
      };
    });
    jest.doMock('lucide-react', () => ({
      Shield: 'svg',
      Award: 'svg',
      Eye: 'svg',
      HeartHandshake: 'svg',
      ArrowRight: 'svg',
      BookOpen: 'svg',
      MessageCircle: 'svg',
    }));

    const { default: HomeWithUser } = require('./page');
    const html = renderToStaticMarkup(<HomeWithUser />);

    expect(html).toContain('href="/dashboard"');
    expect(html).toContain('GO TO DASHBOARD');
  });
});
