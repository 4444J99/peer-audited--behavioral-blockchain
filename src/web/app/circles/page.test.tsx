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
    return (
      <a href={href} className={className}>
        {children}
      </a>
    );
  };
});

import CirclesPage from './page';

describe('Concentric Circles demo index page', () => {
  const render = () => renderToStaticMarkup(<CirclesPage />);

  it('presents all five circles in wedge-to-enterprise order', () => {
    const html = render();

    const names = [
      'Circle Alpha — The Wedge',
      'Circle Beta — The Loop',
      'Circle Gamma — Proof Integrity',
      'Circle Delta — Retention',
      'Circle Omega — The Enterprise',
    ];
    let lastIndex = -1;
    for (const name of names) {
      const index = html.indexOf(name);
      expect(index).toBeGreaterThan(lastIndex);
      lastIndex = index;
    }
  });

  it('links every live demo surface exactly once', () => {
    const html = render();

    const hrefs = [
      '/',
      '/beta',
      '/contracts/new',
      '/fury',
      '/kyc',
      '/practitioner',
      '/hr',
      '/admin/jurisdictions',
      '/realms',
      '/tavern',
    ];
    for (const href of hrefs) {
      const matches = html.match(new RegExp(`href="${href.replace(/\//g, '\\/')}"`, 'g'));
      expect(matches?.length).toBe(1);
    }
  });

  it('gives each surface a one-line what-to-look-at description', () => {
    const html = render();

    // One guidance line per surface (10 surfaces total).
    expect(html.match(/What to look at:/g)?.length).toBe(10);
    expect(html).toContain('masked subject aliases');
    expect(html).toContain('compliance gate');
    expect(html).toContain('Anonymized workforce metrics');
  });

  it('renders the page title and framing narrative', () => {
    const html = render();

    expect(html).toContain('The Concentric Circles');
    expect(html).toContain('no-contact recovery');
    expect(html).toContain('scripts/demo/README.md');
  });

  it('is a public page with no client-side data dependencies', () => {
    // renderToStaticMarkup succeeds without any fetch/auth mocks — the page
    // must stay statically renderable so it can serve as the public demo map.
    expect(() => render()).not.toThrow();
  });
});
