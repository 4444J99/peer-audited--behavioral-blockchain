'use client';

import React from 'react';

export interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
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
        <p className="whitespace-pre-wrap text-sm leading-relaxed">{content}</p>
        <span className="block mt-1 text-neutral-500 text-xs">{time}</span>
      </div>
    </div>
  );
}
