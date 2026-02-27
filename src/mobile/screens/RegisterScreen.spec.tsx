import React from 'react';
import { SupportTraceErrorBanner } from '../components/SupportTraceErrorBanner';

function collectText(node: any): string {
  if (node == null || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(collectText).join('');
  return collectText(node.props?.children);
}

/**
 * RegisterScreen trace-ID display tests.
 *
 * The RegisterScreen uses <SupportTraceErrorBanner> to display errors
 * that may contain a [request_id:] trace suffix from the API.
 * These tests verify the trace-ID renders correctly in the screen context.
 */
describe('RegisterScreen – trace-ID display', () => {
  it('renders trace ID when error contains request_id suffix', () => {
    const tree = SupportTraceErrorBanner({
      value: 'Registration failed [request_id: reg-trace-001]',
    }) as any;
    const text = collectText(tree);

    expect(text).toContain('Registration failed');
    expect(text).toContain('Support trace ID');
    expect(text).toContain('reg-trace-001');
    expect(text).not.toContain('[request_id:');
  });

  it('does not render trace ID when error has no request_id suffix', () => {
    const tree = SupportTraceErrorBanner({
      value: 'Passwords do not match',
    }) as any;
    const text = collectText(tree);

    expect(text).toContain('Passwords do not match');
    expect(text).not.toContain('Support trace ID');
  });

  it('renders trace ID for "email already exists" API error', () => {
    const tree = SupportTraceErrorBanner({
      value: 'Email already registered [request_id: reg-dup-xyz]',
    }) as any;
    const text = collectText(tree);

    expect(text).toContain('Email already registered');
    expect(text).toContain('reg-dup-xyz');
  });

  it('does not render trace ID for client-side validation errors', () => {
    const tree = SupportTraceErrorBanner({
      value: 'All fields are required',
    }) as any;
    const text = collectText(tree);

    expect(text).toContain('All fields are required');
    expect(text).not.toContain('Support trace ID');
  });

  it('renders nothing when value is empty', () => {
    const tree = SupportTraceErrorBanner({ value: '' });
    expect(tree).toBeNull();
  });
});
