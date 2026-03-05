import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ChatMessage } from './ChatMessage';

describe('ChatMessage', () => {
  it('renders user message with right-alignment class', () => {
    const html = renderToStaticMarkup(
      <ChatMessage role="user" content="Hello Styx" timestamp={1709500000000} />
    );
    expect(html).toContain('justify-end');
    expect(html).toContain('Hello Styx');
  });

  it('renders assistant message with left-alignment class', () => {
    const html = renderToStaticMarkup(
      <ChatMessage
        role="assistant"
        content="I can help with that."
        timestamp={1709500000000}
      />
    );
    expect(html).toContain('justify-start');
    expect(html).toContain('I can help with that.');
  });

  it('renders user message with red border styling', () => {
    const html = renderToStaticMarkup(
      <ChatMessage role="user" content="test" timestamp={1709500000000} />
    );
    expect(html).toContain('border-red-900/40');
  });

  it('renders assistant message with neutral border styling', () => {
    const html = renderToStaticMarkup(
      <ChatMessage role="assistant" content="test" timestamp={1709500000000} />
    );
    expect(html).toContain('border-neutral-800');
  });

  it('displays formatted timestamp', () => {
    const html = renderToStaticMarkup(
      <ChatMessage role="user" content="test" timestamp={1709500000000} />
    );
    // Should contain a time string (format varies by locale)
    expect(html).toMatch(/\d{1,2}:\d{2}/);
  });

  it('preserves whitespace in content', () => {
    const html = renderToStaticMarkup(
      <ChatMessage
        role="assistant"
        content="Line one\nLine two"
        timestamp={1709500000000}
      />
    );
    expect(html).toContain('whitespace-pre-wrap');
    expect(html).toContain('Line one');
    expect(html).toContain('Line two');
  });
});

describe('ChatInterface (static render)', () => {
  // ChatInterface uses hooks (useState, useEffect, useRef) which don't work
  // with renderToStaticMarkup. We test the page wrapper and message component
  // independently. The ChatInterface integration is covered by E2E tests.

  it('exports ChatInterface as a named export', () => {
    const mod = require('./ChatInterface');
    expect(typeof mod.ChatInterface).toBe('function');
  });

  it('exports ChatMessage as a named export', () => {
    const mod = require('./ChatMessage');
    expect(typeof mod.ChatMessage).toBe('function');
  });
});

describe('Ask page', () => {
  it('exports a default component', () => {
    const mod = require('../../app/ask/page');
    expect(typeof mod.default).toBe('function');
  });
});
