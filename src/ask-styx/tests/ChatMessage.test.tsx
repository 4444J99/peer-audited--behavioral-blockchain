import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ChatMessage, renderMarkdown, renderInline } from '../src/components/ChatMessage';

describe('ChatMessage', () => {
  it('renders user message with content', () => {
    render(
      <ChatMessage role="user" content="Hello Styx" timestamp={1709500000000} />,
    );
    expect(screen.getByText('Hello Styx')).toBeInTheDocument();
  });

  it('renders assistant message with markdown', () => {
    render(
      <ChatMessage
        role="assistant"
        content="**Bold** text here"
        timestamp={1709500000000}
      />,
    );
    expect(screen.getByText('Bold')).toBeInTheDocument();
    expect(screen.getByText('Bold').tagName).toBe('STRONG');
  });

  it('displays timestamp', () => {
    const ts = new Date(2026, 2, 4, 14, 30).getTime();
    render(<ChatMessage role="user" content="test" timestamp={ts} />);
    expect(screen.getByText(/2:30/)).toBeInTheDocument();
  });

  it('applies user styling (right-aligned)', () => {
    const { container } = render(
      <ChatMessage role="user" content="test" timestamp={Date.now()} />,
    );
    const outer = container.firstElementChild!;
    expect(outer.className).toContain('justify-end');
  });

  it('applies assistant styling (left-aligned)', () => {
    const { container } = render(
      <ChatMessage role="assistant" content="test" timestamp={Date.now()} />,
    );
    const outer = container.firstElementChild!;
    expect(outer.className).toContain('justify-start');
  });
});

describe('renderMarkdown', () => {
  it('renders headers', () => {
    const nodes = renderMarkdown('# Title');
    const { container } = render(<>{nodes}</>);
    expect(container.querySelector('h3')).toHaveTextContent('Title');
  });

  it('renders code blocks', () => {
    const nodes = renderMarkdown('```\nconst x = 1;\n```');
    const { container } = render(<>{nodes}</>);
    expect(container.querySelector('pre code')).toHaveTextContent('const x = 1;');
  });

  it('renders unordered lists', () => {
    const nodes = renderMarkdown('- item one\n- item two');
    const { container } = render(<>{nodes}</>);
    const items = container.querySelectorAll('li');
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveTextContent('item one');
  });

  it('renders paragraphs', () => {
    const nodes = renderMarkdown('Just a paragraph');
    const { container } = render(<>{nodes}</>);
    expect(container.querySelector('p')).toHaveTextContent('Just a paragraph');
  });
});

describe('renderInline', () => {
  it('renders bold text', () => {
    const nodes = renderInline('Hello **world**');
    const { container } = render(<>{nodes}</>);
    expect(container.querySelector('strong')).toHaveTextContent('world');
  });

  it('renders inline code', () => {
    const nodes = renderInline('Use `npm install`');
    const { container } = render(<>{nodes}</>);
    expect(container.querySelector('code')).toHaveTextContent('npm install');
  });

  it('returns plain text when no markup', () => {
    const nodes = renderInline('plain text');
    expect(nodes).toEqual(['plain text']);
  });
});
