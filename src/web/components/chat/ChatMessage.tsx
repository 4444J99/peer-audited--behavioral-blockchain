'use client';

import React from 'react';

export interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

/**
 * Lightweight markdown renderer for LLM output.
 * Handles: **bold**, # headers, - lists, `code`, ```blocks```, paragraph breaks.
 * No external dependencies.
 */
export function renderMarkdown(text: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  const lines = text.split('\n');
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Fenced code blocks: ```...```
    if (line.trimStart().startsWith('```')) {
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trimStart().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // skip closing ```
      nodes.push(
        <pre key={nodes.length} className="bg-neutral-800 rounded-lg px-3 py-2 my-2 overflow-x-auto text-xs">
          <code>{codeLines.join('\n')}</code>
        </pre>
      );
      continue;
    }

    // Headers: # → h3, ## → h4, ### → h5 (downscaled for chat)
    const headerMatch = line.match(/^(#{1,3})\s+(.+)$/);
    if (headerMatch) {
      const level = headerMatch[1].length;
      const Tag = level === 1 ? 'h3' : level === 2 ? 'h4' : 'h5';
      const className = level === 1
        ? 'text-base font-bold mt-3 mb-1'
        : level === 2
          ? 'text-sm font-bold mt-2 mb-1'
          : 'text-sm font-semibold mt-2 mb-1';
      nodes.push(
        <Tag key={nodes.length} className={className}>
          {renderInline(headerMatch[2])}
        </Tag>
      );
      i++;
      continue;
    }

    // Unordered list items: - item or * item
    if (/^[\s]*[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[\s]*[-*]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^[\s]*[-*]\s+/, ''));
        i++;
      }
      nodes.push(
        <ul key={nodes.length} className="list-disc list-inside my-1 space-y-0.5">
          {items.map((item, idx) => (
            <li key={idx} className="text-sm leading-relaxed">{renderInline(item)}</li>
          ))}
        </ul>
      );
      continue;
    }

    // Blank lines → spacing
    if (line.trim() === '') {
      i++;
      continue;
    }

    // Regular paragraph
    nodes.push(
      <p key={nodes.length} className="text-sm leading-relaxed my-1">
        {renderInline(line)}
      </p>
    );
    i++;
  }

  return nodes;
}

/** Renders inline markdown: **bold** and `inline code` */
export function renderInline(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  // Split on **bold** and `code` patterns
  const regex = /(\*\*(.+?)\*\*|`([^`]+?)`)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    // Text before the match
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    if (match[2] !== undefined) {
      // **bold**
      parts.push(<strong key={parts.length}>{match[2]}</strong>);
    } else if (match[3] !== undefined) {
      // `inline code`
      parts.push(
        <code key={parts.length} className="bg-neutral-800 px-1 py-0.5 rounded text-xs">
          {match[3]}
        </code>
      );
    }

    lastIndex = match.index + match[0].length;
  }

  // Remaining text
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length > 0 ? parts : [text];
}

export function ChatMessage({ role, content, timestamp }: ChatMessageProps) {
  const isUser = role === 'user';
  const time = new Date(timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div
        className={`max-w-[80%] px-4 py-3 rounded-2xl ${
          isUser
            ? 'bg-red-600/10 border border-red-900/40 text-neutral-100'
            : 'bg-neutral-900 border border-neutral-800 text-neutral-200'
        }`}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap text-sm leading-relaxed">{content}</p>
        ) : (
          <div className="markdown-content">{renderMarkdown(content)}</div>
        )}
        <span className="block mt-1 text-neutral-500 text-xs">{time}</span>
      </div>
    </div>
  );
}
