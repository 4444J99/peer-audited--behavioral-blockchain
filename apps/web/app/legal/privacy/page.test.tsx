import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

jest.mock('next/link', () => {
  return function MockLink({ children, href }: { children: React.ReactNode; href: string }) {
    return <a href={href}>{children}</a>;
  };
});

import PrivacyPage from './page';

describe('PrivacyPage', () => {
  it('renders the page title', () => {
    const html = renderToStaticMarkup(<PrivacyPage />);
    expect(html).toContain('Privacy Policy');
  });

  it('renders the information collection section', () => {
    const html = renderToStaticMarkup(<PrivacyPage />);
    expect(html).toContain('Information We Collect');
  });

  it('renders data categories', () => {
    const html = renderToStaticMarkup(<PrivacyPage />);
    expect(html).toContain('Account information');
    expect(html).toContain('Behavioral data');
    expect(html).toContain('Financial data');
  });

  it('renders the back link to home', () => {
    const html = renderToStaticMarkup(<PrivacyPage />);
    expect(html).toContain('href="/"');
  });
});
