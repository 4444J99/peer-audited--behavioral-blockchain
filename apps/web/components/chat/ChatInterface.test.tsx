import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ChatMessage } from './ChatMessage';
import { ChatInterface } from './ChatInterface';

// ============================================================
// ChatInterface — initial state render tests
// useState returns initial values during SSR, so renderToStaticMarkup
// renders the "empty conversation" state: header, suggestions, form.
// ============================================================

describe('ChatInterface — initial render', () => {
  let html: string;

  beforeAll(() => {
    html = renderToStaticMarkup(<ChatInterface />);
  });

  describe('header', () => {
    it('renders the ASK STYX title', () => {
      expect(html).toContain('ASK STYX');
    });

    it('renders the Styx logo circle with "S"', () => {
      expect(html).toContain('>S</span>');
      expect(html).toContain('bg-red-600');
      expect(html).toContain('rounded-full');
    });

    it('renders a bottom border on the header', () => {
      expect(html).toContain('border-b');
      expect(html).toContain('border-neutral-800');
    });

    it('does NOT render Clear button when no messages', () => {
      expect(html).not.toContain('Clear');
    });

    it('does NOT render Export button when no messages', () => {
      expect(html).not.toContain('Export');
    });

    it('does NOT render message count when no messages', () => {
      expect(html).not.toContain('messages');
    });
  });

  describe('suggested questions', () => {
    it('renders the welcome prompt text', () => {
      expect(html).toContain('Ask anything about Styx');
    });

    it('renders all 8 suggested questions', () => {
      const questions = [
        'How does the integrity score work?',
        'What are the 7 oath categories?',
        'How does the Fury peer audit network work?',
        "What&#x27;s the revenue model?", // JSX escapes single quotes
        "What&#x27;s included in the Phase 1 beta?",
        'How does the escrow system handle payments?',
        'What tech stack powers Styx?',
        "What&#x27;s the current implementation status?",
      ];
      for (const q of questions) {
        expect(html).toContain(q);
      }
    });

    it('renders each suggestion as a button', () => {
      // 8 suggested question buttons
      const buttonMatches = html.match(/<button[^>]*class="[^"]*rounded-full[^"]*"[^>]*>/g);
      expect(buttonMatches).not.toBeNull();
      expect(buttonMatches!.length).toBe(8);
    });

    it('styles suggestions with neutral/red hover theme', () => {
      expect(html).toContain('bg-neutral-900');
      expect(html).toContain('border-neutral-800');
      expect(html).toContain('hover:border-red-600/50');
    });
  });

  describe('input form', () => {
    it('renders a form element', () => {
      expect(html).toContain('<form');
    });

    it('renders the textarea with placeholder', () => {
      expect(html).toContain('Ask about Styx...');
    });

    it('renders the Send button', () => {
      expect(html).toContain('Send');
    });

    it('styles Send button with red background', () => {
      expect(html).toContain('bg-red-600');
    });

    it('renders textarea with a single row', () => {
      expect(html).toContain('rows="1"');
    });

    it('textarea is not disabled initially', () => {
      // Initial isStreaming is false, so no disabled attribute
      // renderToStaticMarkup won't add disabled="false" — it omits it
      expect(html).not.toMatch(/textarea[^>]*disabled/);
    });

    it('renders input border at the bottom of the layout', () => {
      expect(html).toContain('border-t');
    });
  });

  describe('layout', () => {
    it('uses a flex column layout', () => {
      expect(html).toContain('flex flex-col');
    });

    it('constrains width with max-w-3xl', () => {
      expect(html).toContain('max-w-3xl');
    });

    it('centers content with mx-auto', () => {
      expect(html).toContain('mx-auto');
    });

    it('has a scrollable messages area', () => {
      expect(html).toContain('overflow-y-auto');
    });
  });

  describe('empty state', () => {
    it('does NOT render error message', () => {
      expect(html).not.toContain('bg-red-900/20');
    });

    it('does NOT render Thinking indicator', () => {
      expect(html).not.toContain('Thinking...');
    });

    it('does NOT render any ChatMessage components', () => {
      // No message bubbles (no justify-end or justify-start from ChatMessage)
      // But note: suggestions use justify-center
      expect(html).not.toContain('border-red-900/40'); // User message style
    });
  });
});

// ============================================================
// ChatInterface — module exports and constants
// ============================================================

describe('ChatInterface — module exports', () => {
  it('exports ChatInterface as a named function', () => {
    expect(typeof ChatInterface).toBe('function');
    expect(ChatInterface.name).toBe('ChatInterface');
  });
});

describe('ChatInterface — export and message count features', () => {
  it('header area contains export button logic (function defined)', () => {
    // The exportConversation function is defined inside ChatInterface.
    // We verify the Export button text exists in the component source.
    const source = ChatInterface.toString();
    expect(source).toContain('Export');
  });

  it('header area contains message count logic', () => {
    const source = ChatInterface.toString();
    expect(source).toContain('messages');
  });

  it('export creates a markdown blob URL', () => {
    // Verify the export mechanism uses Blob and markdown format
    const source = ChatInterface.toString();
    expect(source).toContain('text/markdown');
    expect(source).toContain('.md');
  });
});

describe('ChatMessage — used by ChatInterface', () => {
  it('renders user messages inside ChatInterface layout', () => {
    const html = renderToStaticMarkup(
      <ChatMessage role="user" content="test question" timestamp={Date.now()} />
    );
    expect(html).toContain('test question');
    expect(html).toContain('justify-end');
  });

  it('renders assistant messages inside ChatInterface layout', () => {
    const html = renderToStaticMarkup(
      <ChatMessage role="assistant" content="test answer" timestamp={Date.now()} />
    );
    expect(html).toContain('test answer');
    expect(html).toContain('justify-start');
  });
});

// ============================================================
// Ask page
// ============================================================

describe('Ask page', () => {
  it('exports a default component', () => {
    const mod = require('../../app/ask/page');
    expect(typeof mod.default).toBe('function');
  });

  it('renders with full-height dark background', () => {
    const mod = require('../../app/ask/page');
    const AskPage = mod.default;
    const html = renderToStaticMarkup(<AskPage />);
    expect(html).toContain('h-screen');
    expect(html).toContain('bg-neutral-950');
  });

  it('renders the ChatInterface inside the page', () => {
    const mod = require('../../app/ask/page');
    const AskPage = mod.default;
    const html = renderToStaticMarkup(<AskPage />);
    // ChatInterface renders ASK STYX header
    expect(html).toContain('ASK STYX');
  });

  it('applies white text and sans-serif font', () => {
    const mod = require('../../app/ask/page');
    const AskPage = mod.default;
    const html = renderToStaticMarkup(<AskPage />);
    expect(html).toContain('text-white');
    expect(html).toContain('font-sans');
  });
});
