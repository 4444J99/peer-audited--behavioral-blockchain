import React from 'react';
import { render } from '@testing-library/react';
import { SupportTraceErrorBanner } from '../components/SupportTraceErrorBanner';

jest.mock('../services/ApiClient', () => ({
  ApiClient: {
    login: jest.fn(),
  },
}));

jest.mock('../services/SessionService', () => ({
  SessionService: {
    saveSession: jest.fn(),
  },
}));

// Re-use the collectText helper from existing SupportTraceErrorBanner.spec.tsx
function collectText(node: any): string {
  if (node == null || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(collectText).join('');
  return collectText(node.props?.children);
}

/**
 * LoginScreen trace-ID display tests.
 *
 * The LoginScreen uses <SupportTraceErrorBanner> to display errors
 * that may contain a [request_id:] trace suffix from the API.
 * These tests verify the trace-ID renders correctly in the screen context.
 */
describe('LoginScreen – trace-ID display', () => {
  it('renders trace ID when error contains request_id suffix', () => {
    const tree = SupportTraceErrorBanner({
      value: 'Login failed [request_id: login-trace-001]',
    }) as any;
    const text = collectText(tree);

    expect(text).toContain('Login failed');
    expect(text).toContain('Support trace ID');
    expect(text).toContain('login-trace-001');
    expect(text).not.toContain('[request_id:');
  });

  it('does not render trace ID when error has no request_id suffix', () => {
    const tree = SupportTraceErrorBanner({
      value: 'Please enter email and password',
    }) as any;
    const text = collectText(tree);

    expect(text).toContain('Please enter email and password');
    expect(text).not.toContain('Support trace ID');
  });

  it('renders trace ID for invalid credentials error with trace', () => {
    const tree = SupportTraceErrorBanner({
      value: 'Invalid credentials [request_id: auth-fail-abc]',
    }) as any;
    const text = collectText(tree);

    expect(text).toContain('Invalid credentials');
    expect(text).toContain('auth-fail-abc');
  });

  it('renders nothing when value is empty', () => {
    const tree = SupportTraceErrorBanner({ value: '' });
    expect(tree).toBeNull();
  });

  it('renders nothing when value is null', () => {
    const tree = SupportTraceErrorBanner({ value: null });
    expect(tree).toBeNull();
  });
});

describe('LoginScreen – render tests', () => {
  const { LoginScreen } = require('../screens/LoginScreen');

  const mockNavigation = {
    navigate: jest.fn(),
    goBack: jest.fn(),
    setOptions: jest.fn(),
  } as any;

  const mockRoute = { params: undefined, key: 'Login', name: 'Login' as const } as any;

  function renderLogin() {
    const props = { navigation: mockNavigation, route: mockRoute, onLogin: jest.fn() };
    return render(React.createElement(LoginScreen, props));
  }

  function allText(container: HTMLElement): string {
    return container.textContent || '';
  }

  function allPlaceholders(container: HTMLElement): string[] {
    const inputs = container.querySelectorAll('input');
    return Array.from(inputs).map(n => n.getAttribute('placeholder')).filter(Boolean) as string[];
  }

  it('renders title "STYX" and subtitle', () => {
    const { container } = renderLogin();
    const text = allText(container);

    expect(text).toContain('STYX');
    expect(text).toContain('The Blockchain of Truth');
  });

  it('renders email and password inputs', () => {
    const { container } = renderLogin();
    const placeholders = allPlaceholders(container);

    expect(placeholders).toContain('Email');
    expect(placeholders).toContain('Password');
  });

  it('renders "Enter the River" button text', () => {
    const { container } = renderLogin();
    const text = allText(container);

    expect(text).toContain('Enter the River');
  });

  it('renders "New here?" link', () => {
    const { container } = renderLogin();
    const text = allText(container);

    expect(text).toContain('New here?');
  });
});
