import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ChatMessage, ChatMessageProps, renderMarkdown, renderInline } from './ChatMessage';

const USER_MSG: ChatMessageProps = {
  role: 'user',
  content: 'Hello Styx',
  timestamp: 1709500000000,
};

const ASSISTANT_MSG: ChatMessageProps = {
  role: 'assistant',
  content: 'I can help with that.',
  timestamp: 1709500060000,
};

function render(props: ChatMessageProps): string {
  return renderToStaticMarkup(<ChatMessage {...props} />);
}

function renderMd(text: string): string {
  return renderToStaticMarkup(<>{renderMarkdown(text)}</>);
}

function renderInl(text: string): string {
  return renderToStaticMarkup(<>{renderInline(text)}</>);
}

describe('ChatMessage', () => {
  describe('layout and alignment', () => {
    it('renders user messages right-aligned', () => {
      expect(render(USER_MSG)).toContain('justify-end');
    });

    it('renders assistant messages left-aligned', () => {
      expect(render(ASSISTANT_MSG)).toContain('justify-start');
    });

    it('wraps in a flex container with bottom margin', () => {
      const html = render(USER_MSG);
      expect(html).toContain('flex');
      expect(html).toContain('mb-4');
    });

    it('constrains message width to 80%', () => {
      expect(render(USER_MSG)).toContain('max-w-[80%]');
    });

    it('applies rounded-2xl border radius', () => {
      expect(render(USER_MSG)).toContain('rounded-2xl');
      expect(render(ASSISTANT_MSG)).toContain('rounded-2xl');
    });
  });

  describe('visual styling by role', () => {
    it('styles user messages with red tones', () => {
      const html = render(USER_MSG);
      expect(html).toContain('bg-red-600/10');
      expect(html).toContain('border-red-900/40');
      expect(html).toContain('text-neutral-100');
    });

    it('styles assistant messages with neutral tones', () => {
      const html = render(ASSISTANT_MSG);
      expect(html).toContain('bg-neutral-900');
      expect(html).toContain('border-neutral-800');
      expect(html).toContain('text-neutral-200');
    });

    it('user messages do NOT have neutral background', () => {
      expect(render(USER_MSG)).not.toContain('bg-neutral-900');
    });

    it('assistant messages do NOT have red background', () => {
      expect(render(ASSISTANT_MSG)).not.toContain('bg-red-600/10');
    });
  });

  describe('content rendering', () => {
    it('renders the message content text', () => {
      expect(render(USER_MSG)).toContain('Hello Styx');
    });

    it('renders user content inside a paragraph element with whitespace-pre-wrap', () => {
      const html = render(USER_MSG);
      expect(html).toContain('<p');
      expect(html).toContain('</p>');
      expect(html).toContain('whitespace-pre-wrap');
    });

    it('renders assistant content inside a markdown-content div', () => {
      const html = render(ASSISTANT_MSG);
      expect(html).toContain('markdown-content');
    });

    it('applies text-sm leading-relaxed typography', () => {
      const html = render(USER_MSG);
      expect(html).toContain('text-sm');
      expect(html).toContain('leading-relaxed');
    });

    it('renders empty content without error', () => {
      const html = render({ ...USER_MSG, content: '' });
      expect(html).toContain('<p');
    });

    it('renders long content', () => {
      const long = 'A'.repeat(5000);
      const html = render({ ...USER_MSG, content: long });
      expect(html).toContain(long);
    });

    it('escapes HTML entities in content', () => {
      const html = render({ ...USER_MSG, content: '<script>alert("xss")</script>' });
      expect(html).toContain('&lt;script&gt;');
      expect(html).not.toContain('<script>');
    });

    it('renders ampersands safely', () => {
      const html = render({ ...USER_MSG, content: 'A & B' });
      expect(html).toContain('A &amp; B');
    });

    it('renders content with quotes', () => {
      const html = render({ ...USER_MSG, content: 'She said "hello"' });
      expect(html).toContain('She said');
      expect(html).toContain('hello');
    });

    it('preserves multiline content (newlines in string)', () => {
      const html = render({ ...USER_MSG, content: 'Line 1\nLine 2\nLine 3' });
      expect(html).toContain('Line 1');
      expect(html).toContain('Line 2');
      expect(html).toContain('Line 3');
    });
  });

  describe('timestamp', () => {
    it('renders a formatted time string', () => {
      const html = render(USER_MSG);
      // Locale-independent: should contain digits and colon
      expect(html).toMatch(/\d{1,2}:\d{2}/);
    });

    it('renders timestamp in a span element', () => {
      expect(render(USER_MSG)).toContain('<span');
    });

    it('styles timestamp with muted color and small text', () => {
      const html = render(USER_MSG);
      expect(html).toContain('text-neutral-500');
      expect(html).toContain('text-xs');
    });

    it('renders timestamp as a block element with top margin', () => {
      const html = render(USER_MSG);
      expect(html).toContain('block');
      expect(html).toContain('mt-1');
    });

    it('formats different timestamps differently', () => {
      const morning = render({ ...USER_MSG, timestamp: 1709460000000 }); // ~early in the day
      const evening = render({ ...USER_MSG, timestamp: 1709510000000 }); // later
      // Both should have time-like content, even if we can't predict exact locale format
      expect(morning).toMatch(/\d{1,2}:\d{2}/);
      expect(evening).toMatch(/\d{1,2}:\d{2}/);
    });
  });

  describe('type exports', () => {
    it('exports ChatMessageProps interface (used by ChatInterface)', () => {
      // Type-level check: if this compiles, the interface is exported
      const props: ChatMessageProps = { role: 'user', content: 'test', timestamp: 0 };
      expect(props.role).toBe('user');
    });

    it('exports ChatMessage as a named export', () => {
      expect(typeof ChatMessage).toBe('function');
    });
  });
});

// ─── Markdown rendering tests ─────────────────────────────────

describe('renderMarkdown', () => {
  it('renders plain text as a paragraph', () => {
    const html = renderMd('Hello world');
    expect(html).toContain('<p');
    expect(html).toContain('Hello world');
  });

  it('renders **bold** as <strong>', () => {
    const html = renderMd('This is **bold** text');
    expect(html).toContain('<strong>bold</strong>');
    expect(html).toContain('This is ');
    expect(html).toContain(' text');
  });

  it('renders # header as h3', () => {
    const html = renderMd('# Main Header');
    expect(html).toContain('<h3');
    expect(html).toContain('Main Header');
  });

  it('renders ## header as h4', () => {
    const html = renderMd('## Sub Header');
    expect(html).toContain('<h4');
    expect(html).toContain('Sub Header');
  });

  it('renders ### header as h5', () => {
    const html = renderMd('### Detail Header');
    expect(html).toContain('<h5');
    expect(html).toContain('Detail Header');
  });

  it('renders - list items as <ul><li>', () => {
    const html = renderMd('- Item one\n- Item two\n- Item three');
    expect(html).toContain('<ul');
    expect(html).toContain('<li');
    expect(html).toContain('Item one');
    expect(html).toContain('Item two');
    expect(html).toContain('Item three');
  });

  it('renders * list items as <ul><li>', () => {
    const html = renderMd('* Alpha\n* Beta');
    expect(html).toContain('<ul');
    expect(html).toContain('Alpha');
    expect(html).toContain('Beta');
  });

  it('renders `inline code` as <code>', () => {
    const html = renderMd('Use the `useState` hook');
    expect(html).toContain('<code');
    expect(html).toContain('useState');
  });

  it('renders fenced code blocks as <pre><code>', () => {
    const html = renderMd('```\nconst x = 1;\nconst y = 2;\n```');
    expect(html).toContain('<pre');
    expect(html).toContain('<code');
    expect(html).toContain('const x = 1;');
    expect(html).toContain('const y = 2;');
  });

  it('handles multiple markdown elements together', () => {
    const input = '# Title\n\nSome **bold** text.\n\n- Item 1\n- Item 2\n\n`code` here';
    const html = renderMd(input);
    expect(html).toContain('<h3');
    expect(html).toContain('<strong>bold</strong>');
    expect(html).toContain('<ul');
    expect(html).toContain('<code');
  });

  it('renders empty string without error', () => {
    const html = renderMd('');
    expect(html).toBe('');
  });

  it('passes through plain text without markdown', () => {
    const html = renderMd('Just a regular sentence.');
    expect(html).toContain('Just a regular sentence.');
    expect(html).not.toContain('<strong');
    expect(html).not.toContain('<h3');
  });

  it('skips blank lines as spacing', () => {
    const html = renderMd('Paragraph 1\n\nParagraph 2');
    expect(html).toContain('Paragraph 1');
    expect(html).toContain('Paragraph 2');
  });
});

describe('renderInline', () => {
  it('renders **bold** as <strong>', () => {
    const html = renderInl('Hello **world**');
    expect(html).toContain('<strong>world</strong>');
  });

  it('renders `code` as <code>', () => {
    const html = renderInl('Run `npm test`');
    expect(html).toContain('<code');
    expect(html).toContain('npm test');
  });

  it('handles text with no inline markdown', () => {
    const html = renderInl('Plain text only');
    expect(html).toBe('Plain text only');
  });

  it('handles multiple bold segments', () => {
    const html = renderInl('**one** and **two**');
    expect(html).toContain('<strong>one</strong>');
    expect(html).toContain('<strong>two</strong>');
  });

  it('handles mixed bold and code', () => {
    const html = renderInl('Use **bold** and `code`');
    expect(html).toContain('<strong>bold</strong>');
    expect(html).toContain('<code');
    expect(html).toContain('code');
  });
});

describe('ChatMessage — markdown in assistant messages', () => {
  it('renders markdown for assistant messages', () => {
    const html = render({
      ...ASSISTANT_MSG,
      content: '# Hello\n\nThis is **bold**.\n\n- Item 1\n- Item 2',
    });
    expect(html).toContain('<h3');
    expect(html).toContain('<strong>bold</strong>');
    expect(html).toContain('<ul');
  });

  it('renders plain text for user messages (no markdown)', () => {
    const html = render({
      ...USER_MSG,
      content: '# Not a header\n\n**Not bold**',
    });
    // User messages use whitespace-pre-wrap, not markdown rendering
    expect(html).toContain('whitespace-pre-wrap');
    expect(html).toContain('# Not a header');
    expect(html).not.toContain('<h3');
  });
});
