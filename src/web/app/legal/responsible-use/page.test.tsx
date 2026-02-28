import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

jest.mock('next/link', () => {
  return function MockLink({ children, href }: { children: React.ReactNode; href: string }) {
    return <a href={href}>{children}</a>;
  };
});

import ResponsibleUsePage from './page';

describe('ResponsibleUsePage', () => {
  it('renders the page title', () => {
    const html = renderToStaticMarkup(<ResponsibleUsePage />);
    expect(html).toContain('Responsible Use');
  });

  it('renders the back link to home', () => {
    const html = renderToStaticMarkup(<ResponsibleUsePage />);
    expect(html).toContain('href="/"');
  });
});
