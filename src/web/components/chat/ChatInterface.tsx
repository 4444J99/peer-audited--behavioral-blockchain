'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChatMessage, ChatMessageProps } from './ChatMessage';

const STORAGE_KEY = 'styx-chat-messages';
const MAX_HISTORY_MESSAGES = 20;

const SUGGESTED_QUESTIONS = [
  'How does the integrity score work?',
  'What are the 7 oath categories?',
  'How does the Fury peer audit network work?',
  "What's the revenue model?",
  "What's included in the Phase 1 beta?",
  'How does the escrow system handle payments?',
  'What tech stack powers Styx?',
  "What's the current implementation status?",
];

function loadMessages(): ChatMessageProps[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveMessages(messages: ChatMessageProps[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  } catch {
    // localStorage full or unavailable — silently ignore
  }
}

export function ChatInterface() {
  const [messages, setMessages] = useState<ChatMessageProps[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const initialized = useRef(false);

  // Load from localStorage on mount
  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      setMessages(loadMessages());
    }
  }, []);

  // Save to localStorage on change
  useEffect(() => {
    if (initialized.current && messages.length > 0) {
      saveMessages(messages);
    }
  }, [messages]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isStreaming) return;

      setError(null);
      setInput('');

      const userMessage: ChatMessageProps = {
        role: 'user',
        content: trimmed,
        timestamp: Date.now(),
      };

      const updatedMessages = [...messages, userMessage];
      setMessages(updatedMessages);

      // Build conversation history for API (last N messages)
      const history = updatedMessages.slice(-MAX_HISTORY_MESSAGES).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      setIsStreaming(true);

      const assistantMessage: ChatMessageProps = {
        role: 'assistant',
        content: '',
        timestamp: Date.now(),
      };

      // Add placeholder assistant message
      setMessages((prev) => [...prev, assistantMessage]);

      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: history }),
        });

        if (!response.ok) {
          const errBody = await response.json().catch(() => ({}));
          throw new Error(
            errBody.error || `Request failed (${response.status})`
          );
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error('No response stream');

        const decoder = new TextDecoder();
        let accumulated = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              if (parsed.error) {
                throw new Error(parsed.error);
              }
              if (parsed.content) {
                accumulated += parsed.content;
                // Update the last message with accumulated content
                setMessages((prev) => {
                  const next = [...prev];
                  next[next.length - 1] = {
                    ...next[next.length - 1],
                    content: accumulated,
                  };
                  return next;
                });
              }
            } catch (parseErr) {
              if (
                parseErr instanceof Error &&
                parseErr.message !== 'Unexpected end of JSON input'
              ) {
                // Only throw non-parse errors (stream errors from server)
                if ((parseErr as Error).message !== data) {
                  // It's a genuine parse error on partial chunk — skip
                }
              }
            }
          }
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Something went wrong';
        setError(msg);
        // Remove the empty assistant message on error
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last?.role === 'assistant' && !last.content) {
            return prev.slice(0, -1);
          }
          return prev;
        });
      } finally {
        setIsStreaming(false);
      }
    },
    [messages, isStreaming]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const clearConversation = () => {
    setMessages([]);
    setError(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    textareaRef.current?.focus();
  };

  const showSuggestions = messages.length === 0 && !isStreaming;

  return (
    <div className="flex flex-col h-full max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center">
            <span className="text-sm font-black text-black">S</span>
          </div>
          <h1 className="text-lg font-bold text-white tracking-tight">
            ASK STYX
          </h1>
        </div>
        {messages.length > 0 && (
          <button
            onClick={clearConversation}
            className="text-xs text-neutral-500 hover:text-neutral-300 transition-colors px-3 py-1 border border-neutral-800 rounded-full"
          >
            Clear
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        {showSuggestions && (
          <div className="mb-8">
            <p className="text-neutral-400 text-sm mb-4 text-center">
              Ask anything about Styx — how it works, the tech stack,
              implementation status, or business model.
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {SUGGESTED_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => sendMessage(q)}
                  className="px-3 py-2 text-xs text-neutral-300 bg-neutral-900 border border-neutral-800 rounded-full hover:border-red-600/50 hover:text-white transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <ChatMessage key={i} {...msg} />
        ))}

        {isStreaming && messages[messages.length - 1]?.content === '' && (
          <div className="flex justify-start mb-4">
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl px-4 py-3">
              <span className="text-neutral-500 text-sm animate-pulse">
                Thinking...
              </span>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-4 px-4 py-3 bg-red-900/20 border border-red-900/40 rounded-2xl text-red-400 text-sm">
            {error}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="px-4 py-3 border-t border-neutral-800"
      >
        <div className="flex gap-2">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about Styx..."
            rows={1}
            className="flex-1 bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-sm text-neutral-100 placeholder-neutral-600 resize-none focus:outline-none focus:border-red-600/50 transition-colors"
            disabled={isStreaming}
          />
          <button
            type="submit"
            disabled={isStreaming || !input.trim()}
            className="px-4 py-3 bg-red-600 text-black font-bold rounded-xl hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-sm"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}
