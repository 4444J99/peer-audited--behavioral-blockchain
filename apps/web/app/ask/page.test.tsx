import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

jest.mock('../../components/chat/ChatInterface', () => ({
  ChatInterface: function MockChatInterface() {
    return <div data-testid="chat-interface">ChatInterface</div>;
  },
}));

import AskPage from './page';

describe('Ask page', () => {
  it('renders the ChatInterface component', () => {
    const html = renderToStaticMarkup(<AskPage />);

    expect(html).toContain('ChatInterface');
  });

  it('has dark background styling', () => {
    const html = renderToStaticMarkup(<AskPage />);

    expect(html).toContain('bg-neutral-950');
  });
});
