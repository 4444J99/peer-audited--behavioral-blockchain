import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

jest.mock('./services/gemini', () => ({
  callGemini: jest.fn(),
}));

jest.mock('lucide-react', () => ({
  Play: () => <span>Play</span>,
  Wand2: () => <span>Wand2</span>,
  ChevronLeft: () => <span>ChevronLeft</span>,
  ChevronRight: () => <span>ChevronRight</span>,
  PanelRightOpen: () => <span>PanelRightOpen</span>,
  PanelRightClose: () => <span>PanelRightClose</span>,
  Sparkles: () => <span>Sparkles</span>,
  X: () => <span>X</span>,
  MessageCircle: () => <span>MessageCircle</span>,
  Menu: () => <span>Menu</span>,
}));

import PitchDeck from './PitchDeck';

describe('PitchDeck', () => {
  it('renders without crashing', () => {
    const html = renderToStaticMarkup(<PitchDeck />);

    expect(html).toBeTruthy();
  });

  it('renders the first slide title area', () => {
    const html = renderToStaticMarkup(<PitchDeck />);

    // The header should contain STYX branding
    expect(html).toContain('STYX');
  });

  it('renders the spoken script tab', () => {
    const html = renderToStaticMarkup(<PitchDeck />);

    expect(html).toContain('Spoken Script');
  });

  it('renders slide navigation controls', () => {
    const html = renderToStaticMarkup(<PitchDeck />);

    // Footer nav has slide count indicator
    expect(html).toContain('1');
    expect(html).toContain('10');
  });
});
