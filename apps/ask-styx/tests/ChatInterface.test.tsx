import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ChatInterface } from '../src/components/ChatInterface';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('ChatInterface', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  it('renders the header with ASK STYX title', () => {
    render(<ChatInterface />);
    expect(screen.getByText('ASK STYX')).toBeInTheDocument();
  });

  it('shows suggested questions when no messages', () => {
    render(<ChatInterface />);
    expect(screen.getByText('How does the integrity score work?')).toBeInTheDocument();
    expect(screen.getByText('What are the 7 oath categories?')).toBeInTheDocument();
  });

  it('shows description text when no messages', () => {
    render(<ChatInterface />);
    expect(
      screen.getByText(/Ask anything about Styx/),
    ).toBeInTheDocument();
  });

  it('renders the input textarea', () => {
    render(<ChatInterface />);
    expect(screen.getByPlaceholderText('Ask about Styx...')).toBeInTheDocument();
  });

  it('renders the Send button', () => {
    render(<ChatInterface />);
    const btn = screen.getByRole('button', { name: 'Send' });
    expect(btn).toBeInTheDocument();
    expect(btn).toBeDisabled(); // disabled when input is empty
  });

  it('enables Send button when input has text', () => {
    render(<ChatInterface />);
    const textarea = screen.getByPlaceholderText('Ask about Styx...');
    fireEvent.change(textarea, { target: { value: 'Hello' } });
    const btn = screen.getByRole('button', { name: 'Send' });
    expect(btn).not.toBeDisabled();
  });

  it('loads messages from localStorage on mount', () => {
    const stored = [
      { role: 'user', content: 'Stored question', timestamp: Date.now() },
    ];
    localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(stored));
    render(<ChatInterface />);
    expect(screen.getByText('Stored question')).toBeInTheDocument();
  });

  it('does not show suggested questions when messages exist', () => {
    const stored = [
      { role: 'user', content: 'test', timestamp: Date.now() },
    ];
    localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(stored));
    render(<ChatInterface />);
    expect(screen.queryByText('How does the integrity score work?')).not.toBeInTheDocument();
  });

  it('shows Export and Clear buttons when messages exist', () => {
    const stored = [
      { role: 'user', content: 'test', timestamp: Date.now() },
    ];
    localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(stored));
    render(<ChatInterface />);
    expect(screen.getByText('Export')).toBeInTheDocument();
    expect(screen.getByText('Clear')).toBeInTheDocument();
  });

  it('clears messages when Clear is clicked', () => {
    const stored = [
      { role: 'user', content: 'test msg', timestamp: Date.now() },
    ];
    localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(stored));
    render(<ChatInterface />);
    fireEvent.click(screen.getByText('Clear'));
    expect(screen.queryByText('test msg')).not.toBeInTheDocument();
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('styx-chat-messages');
  });

  it('shows message count when messages exist', () => {
    const stored = [
      { role: 'user', content: 'q1', timestamp: Date.now() },
      { role: 'assistant', content: 'a1', timestamp: Date.now() },
    ];
    localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(stored));
    render(<ChatInterface />);
    expect(screen.getByText('2 messages')).toBeInTheDocument();
  });
});
