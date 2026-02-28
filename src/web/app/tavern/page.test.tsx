import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
}));

jest.mock('next/link', () => {
  return function MockLink({ children, href }: { children: React.ReactNode; href: string }) {
    return <a href={href}>{children}</a>;
  };
});

jest.mock('../../services/api-client', () => ({
  api: {
    getPublicFeed: jest.fn().mockResolvedValue({ events: [] }),
    getLeaderboard: jest.fn().mockResolvedValue([]),
  },
}));

import TavernPage from './page';

describe('Tavern Page', () => {
  it('renders loading state initially', () => {
    const html = renderToStaticMarkup(<TavernPage />);

    expect(html).toContain('Loading the Tavern Board');
  });

  it('renders the Tavern Board loading text', () => {
    const html = renderToStaticMarkup(<TavernPage />);

    expect(html).toContain('Tavern Board');
  });
});
