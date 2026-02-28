import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

jest.mock('next/link', () => {
  return function MockLink({ children, href }: { children: React.ReactNode; href: string }) {
    return <a href={href}>{children}</a>;
  };
});

import TermsPage from './page';

describe('TermsPage', () => {
  it('renders the page title', () => {
    const html = renderToStaticMarkup(<TermsPage />);
    expect(html).toContain('Terms of Service');
  });

  it('renders all 14 sections', () => {
    const html = renderToStaticMarkup(<TermsPage />);
    expect(html).toContain('1. Acceptance of Terms');
    expect(html).toContain('2. Description of Service');
    expect(html).toContain('3. Beta Program');
    expect(html).toContain('4. User Accounts');
    expect(html).toContain('5. Behavioral Contracts');
    expect(html).toContain('6. Fury Network');
    expect(html).toContain('7. Financial Terms');
    expect(html).toContain('8. Health and Safety');
    expect(html).toContain('9. Prohibited Conduct');
    expect(html).toContain('10. Dispute Resolution');
    expect(html).toContain('11. Termination');
    expect(html).toContain('12. Limitation of Liability');
    expect(html).toContain('13. Changes to Terms');
    expect(html).toContain('14. Contact');
  });

  it('renders the back link to home', () => {
    const html = renderToStaticMarkup(<TermsPage />);
    expect(html).toContain('href="/"');
  });

  it('renders links to related policies', () => {
    const html = renderToStaticMarkup(<TermsPage />);
    expect(html).toContain('href="/legal/privacy"');
    expect(html).toContain('href="/legal/rules"');
    expect(html).toContain('href="/legal/responsible-use"');
  });

  it('renders the contact email', () => {
    const html = renderToStaticMarkup(<TermsPage />);
    expect(html).toContain('legal@styx.protocol');
  });
});
