import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

jest.mock('next/link', () => {
  return function MockLink({ children, href }: { children: React.ReactNode; href: string }) {
    return <a href={href}>{children}</a>;
  };
});

import ContestRulesPage from './page';

describe('ContestRulesPage', () => {
  it('renders the page title', () => {
    const html = renderToStaticMarkup(<ContestRulesPage />);
    expect(html).toContain('Contest Official Rules');
  });

  it('renders the sponsor section', () => {
    const html = renderToStaticMarkup(<ContestRulesPage />);
    expect(html).toContain('1. Sponsor');
    expect(html).toContain('Styx Protocol');
  });

  it('renders the eligibility section', () => {
    const html = renderToStaticMarkup(<ContestRulesPage />);
    expect(html).toContain('2. Eligibility');
  });

  it('renders the back link to home', () => {
    const html = renderToStaticMarkup(<ContestRulesPage />);
    expect(html).toContain('href="/"');
  });
});
