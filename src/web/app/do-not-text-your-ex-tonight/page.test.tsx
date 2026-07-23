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

import DoNotTextYourExTonightPage from './page';

describe('DoNotTextYourExTonightPage', () => {
  it('renders the emergency no-contact tool headline', () => {
    const html = renderToStaticMarkup(<DoNotTextYourExTonightPage />);

    expect(html).toContain('Do Not Text Your Ex Tonight');
    expect(html).toContain('Ten-minute reset');
  });

  it('renders in-the-moment urge controls', () => {
    const html = renderToStaticMarkup(<DoNotTextYourExTonightPage />);

    expect(html).toContain('What are you feeling right now?');
    expect(html).toContain('Urge level:');
    expect(html).toContain('Send this instead');
    expect(html).toContain('Replacement no-contact note');
  });

  it('keeps the page focused on one beta CTA with source attribution', () => {
    const html = renderToStaticMarkup(<DoNotTextYourExTonightPage />);

    expect(html).toContain('Join the Private Beta');
    expect(html.match(/<a /g)?.length).toBe(1);
    expect(html).toContain('href="/beta?source=do-not-text-tonight&amp;intent=no-contact-urge');
    expect(html).toContain('utm_source=emergency_asset');
    expect(html).toContain('utm_campaign=do_not_text_your_ex_tonight');
  });

  it('preserves the Phase 1 wedge language', () => {
    const html = renderToStaticMarkup(<DoNotTextYourExTonightPage />);

    expect(html).toContain('No-contact recovery');
    expect(html).toContain('Private beta');
    expect(html).toContain('Test-money pilot');
    expect(html).toContain('small iOS private beta');
  });

  it('does not introduce forbidden top-of-funnel terms', () => {
    const html = renderToStaticMarkup(<DoNotTextYourExTonightPage />).toLowerCase();

    expect(html).not.toContain('blockchain');
    expect(html).not.toContain('fury');
    expect(html).not.toContain('real-money');
    expect(html).not.toContain('wager');
  });
});
