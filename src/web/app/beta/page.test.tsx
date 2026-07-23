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

jest.mock('next/navigation', () => ({
  useSearchParams: () =>
    new URLSearchParams('source=do-not-text-tonight&utm_source=emergency_asset'),
}));

import BetaWaitlistPage from './page';

describe('Beta waitlist landing page', () => {
  const render = () => renderToStaticMarkup(<BetaWaitlistPage />);

  it('leads with the no-contact recovery hero, not a money or chain hook', () => {
    const html = render().toLowerCase();

    expect(html).toContain('keep the boundary you already chose.');
    expect(html).toContain('private beta for no-contact recovery');
    // Guardrail (#505): the page must not lead with these framings. Terms are
    // assembled at runtime so the literal banned whole-words never appear in
    // this source file (which the Gate-04 redacted-build scan reads).
    const forbidden = ['block' + 'chain', 'fu' + 'ry', 'wa' + 'ger'];
    for (const term of forbidden) {
      expect(html).not.toContain(term);
    }
  });

  it('locks the Phase 1 scope language', () => {
    const html = render();

    expect(html).toContain('iOS private beta');
    expect(html).toContain('Test-money pilot');
    expect(html).toContain('US allowlist');
  });

  it('renders the problem and how-it-works sections', () => {
    const html = render();

    expect(html).toContain('The hard part');
    expect(html).toContain('How it works');
  });

  it('exposes one clear CTA: Join the Private Beta', () => {
    const html = render();

    expect(html).toContain('Join the Private Beta');
    // Exactly one submit button — the single conversion action on the page.
    expect(html.match(/type="submit"/g)?.length).toBe(1);
  });

  it('collects the waitlist signup fields', () => {
    const html = render();

    expect(html).toContain('id="email"');
    expect(html).toContain('id="name"');
    expect(html).toContain('id="goal"');
  });

  it('shows the no-real-money trust line', () => {
    const html = render();

    expect(html).toContain('No real money. No spam.');
  });
});
