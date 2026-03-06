import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

jest.mock('../../components/PitchDeck/PitchDeck', () => {
  return function MockPitchDeck() {
    return <div data-testid="pitch-deck">PitchDeck</div>;
  };
});

import PitchPage from './page';

describe('Pitch page', () => {
  it('renders the PitchDeck component', () => {
    const html = renderToStaticMarkup(<PitchPage />);

    expect(html).toContain('PitchDeck');
  });
});
