import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

jest.mock('next/link', () => {
  return function MockLink({ children, href }: { children: React.ReactNode; href: string }) {
    return <a href={href}>{children}</a>;
  };
});

import { SiteFooter } from './SiteFooter';

describe('SiteFooter', () => {
  it('renders the Styx Protocol brand name', () => {
    const html = renderToStaticMarkup(<SiteFooter />);

    expect(html).toContain('Styx Protocol');
  });

  it('renders the Terms of Service link', () => {
    const html = renderToStaticMarkup(<SiteFooter />);

    expect(html).toContain('href="/legal/terms"');
    expect(html).toContain('Terms of Service');
  });

  it('renders the Privacy Policy link', () => {
    const html = renderToStaticMarkup(<SiteFooter />);

    expect(html).toContain('href="/legal/privacy"');
    expect(html).toContain('Privacy Policy');
  });

  it('renders the Contest Rules link', () => {
    const html = renderToStaticMarkup(<SiteFooter />);

    expect(html).toContain('href="/legal/rules"');
    expect(html).toContain('Contest Rules');
  });

  it('renders the Responsible Use link', () => {
    const html = renderToStaticMarkup(<SiteFooter />);

    expect(html).toContain('href="/legal/responsible-use"');
    expect(html).toContain('Responsible Use');
  });

  it('renders copyright with the current year', () => {
    const html = renderToStaticMarkup(<SiteFooter />);
    const currentYear = new Date().getFullYear().toString();

    expect(html).toContain(`\u00A9 ${currentYear} Styx Protocol`);
  });

  it('renders as a footer element', () => {
    const html = renderToStaticMarkup(<SiteFooter />);

    expect(html).toMatch(/^<footer/);
    expect(html).toMatch(/<\/footer>$/);
  });
});
