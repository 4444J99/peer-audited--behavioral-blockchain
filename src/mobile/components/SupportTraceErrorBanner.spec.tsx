import React from 'react';
import { SupportTraceErrorBanner } from './SupportTraceErrorBanner';

function collectText(node: any): string {
  if (node == null || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(collectText).join('');
  return collectText(node.props?.children);
}

describe('SupportTraceErrorBanner', () => {
  it('renders message and support trace ID when request id suffix is present', () => {
    const tree = SupportTraceErrorBanner({ value: 'Login failed [request_id: trace-mobile-123]' }) as any;
    const text = collectText(tree);

    expect(text).toContain('Login failed');
    expect(text).toContain('Support trace ID');
    expect(text).toContain('trace-mobile-123');
    expect(text).not.toContain('[request_id:');
  });

  it('renders only the message when request id suffix is absent', () => {
    const tree = SupportTraceErrorBanner({ value: 'All fields are required.' }) as any;
    const text = collectText(tree);

    expect(text).toContain('All fields are required.');
    expect(text).not.toContain('Support trace ID');
  });

  it('renders nothing for empty values', () => {
    const tree = SupportTraceErrorBanner({ value: '' });
    expect(tree).toBeNull();
  });
});
