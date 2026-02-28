import React from 'react';
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
  const renderer = require('react-test-renderer');
  const { act } = renderer;
  const { LoginScreen } = require('../screens/LoginScreen');

  beforeAll(() => { (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true; });
  afterAll(() => { delete (globalThis as any).IS_REACT_ACT_ENVIRONMENT; });

  const mockNavigation = {
    navigate: jest.fn(),
    goBack: jest.fn(),
    setOptions: jest.fn(),
  } as any;

  const mockRoute = { params: undefined, key: 'Login', name: 'Login' as const } as any;

  function renderLogin(): any {
    let component: any;
    const props = { navigation: mockNavigation, route: mockRoute, onLogin: jest.fn() };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const el = (React.createElement as any)(LoginScreen, props);
    act(() => { component = renderer.create(el); });
    return component;
  }

  function allText(component: any): string {
    const spans = component.root.findAllByType('span');
    return spans.map((n: any) => (n.children || []).join('')).join(' ');
  }

  function allPlaceholders(component: any): string[] {
    const inputs = component.root.findAllByType('input');
    return inputs.map((n: any) => n.props.placeholder).filter(Boolean);
  }

  it('renders title "STYX" and subtitle', () => {
    const c = renderLogin();
    const text = allText(c);

    expect(text).toContain('STYX');
    expect(text).toContain('The Blockchain of Truth');
  });

  it('renders email and password inputs', () => {
    const c = renderLogin();
    const placeholders = allPlaceholders(c);

    expect(placeholders).toContain('Email');
    expect(placeholders).toContain('Password');
  });

  it('renders "Enter the River" button text', () => {
    const c = renderLogin();
    const text = allText(c);

    expect(text).toContain('Enter the River');
  });

  it('renders "New here?" link', () => {
    const c = renderLogin();
    const text = allText(c);

    expect(text).toContain('New here?');
  });
});
