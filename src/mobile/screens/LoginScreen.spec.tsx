import React from 'react';
import { SupportTraceErrorBanner } from '../components/SupportTraceErrorBanner';

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
