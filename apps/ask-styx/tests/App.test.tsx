import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { App } from '../src/App';

vi.mock('../src/components/ChatInterface', () => ({
  ChatInterface: function MockChatInterface() {
    return <div data-testid="chat-interface">ChatInterface</div>;
  },
}));

describe('App', () => {
  it('renders without crashing', () => {
    const { container } = render(<App />);
    expect(container).toBeTruthy();
  });

  it('mounts the ChatInterface component', () => {
    render(<App />);
    expect(screen.getByTestId('chat-interface')).toBeInTheDocument();
  });

  it('has dark theme styling', () => {
    const { container } = render(<App />);
    const root = container.firstChild as HTMLElement;
    expect(root.className).toContain('bg-neutral-950');
  });
});
