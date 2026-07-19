import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

jest.mock('next/link', () => {
  return function MockLink({ children, href }: { children: React.ReactNode; href: string }) {
    return <a href={href}>{children}</a>;
  };
});

import NotFound from './not-found';

describe('Not Found Page', () => {
  it('renders the 404 number', () => {
    const html = renderToStaticMarkup(<NotFound />);

    expect(html).toContain('404');
  });

  it('renders the Page Not Found heading', () => {
    const html = renderToStaticMarkup(<NotFound />);

    expect(html).toContain('Page Not Found');
  });

  it('displays the Styx-themed description', () => {
    const html = renderToStaticMarkup(<NotFound />);

    expect(html).toContain('does not exist on the Styx truth ledger');
  });

  it('renders a Return to Dashboard link', () => {
    const html = renderToStaticMarkup(<NotFound />);

    expect(html).toContain('Return to Dashboard');
    expect(html).toContain('href="/dashboard"');
  });
});
