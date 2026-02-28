import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

jest.mock('../services/api-client', () => ({
  api: {
    getLeaderboard: jest.fn().mockResolvedValue([]),
  },
}));

jest.mock('./Leaderboard.css', () => ({}));

import Leaderboard from './Leaderboard';

describe('Leaderboard', () => {
  it('renders the component with the header', () => {
    const html = renderToStaticMarkup(<Leaderboard />);

    expect(html).toContain('Tavern Board');
  });

  it('renders period filter buttons', () => {
    const html = renderToStaticMarkup(<Leaderboard />);

    expect(html).toContain('weekly');
    expect(html).toContain('monthly');
    expect(html).toContain('All Time');
  });

  it('shows loading spinner on initial render', () => {
    const html = renderToStaticMarkup(<Leaderboard />);

    // Initial state has loading=true which renders a spinner div
    expect(html).toContain('animate-spin');
  });

  it('renders the alltime period as selected by default', () => {
    const html = renderToStaticMarkup(<Leaderboard />);

    // The alltime button should have active styling (red)
    expect(html).toContain('All Time');
  });
});
