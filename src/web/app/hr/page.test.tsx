import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { SupportTraceMessage } from '../../components/support/SupportTraceMessage';

/**
 * Regression tests for trace-ID rendering on the HR dashboard page.
 *
 * The HR page uses <SupportTraceMessage> in the error banner when
 * enterprise metrics fail to load. These tests verify that the
 * trace-ID rendering integration works with HR-specific error patterns.
 */
describe('HR page – trace-ID rendering (SupportTraceMessage)', () => {
  it('renders trace ID for a "Failed to load metrics" error with request_id suffix', () => {
    const html = renderToStaticMarkup(
      <SupportTraceMessage
        value="Failed to load metrics [request_id: hr-trace-001]"
        messageClassName="text-red-400 font-bold"
        traceClassName="text-xs text-gray-500 font-mono"
        containerClassName="space-y-2"
      />,
    );

    expect(html).toContain('Failed to load metrics');
    expect(html).toContain('Support trace ID');
    expect(html).toContain('hr-trace-001');
    expect(html).not.toContain('[request_id:');
  });

  it('does not render trace ID for plain error without request_id suffix', () => {
    const html = renderToStaticMarkup(
      <SupportTraceMessage
        value="Failed to load metrics"
        messageClassName="text-red-400 font-bold"
      />,
    );

    expect(html).toContain('Failed to load metrics');
    expect(html).not.toContain('Support trace ID');
  });

  it('renders trace ID for a network timeout error with request_id', () => {
    const html = renderToStaticMarkup(
      <SupportTraceMessage value="Request timeout [request_id: hr-timeout-abc]" />,
    );

    expect(html).toContain('Request timeout');
    expect(html).toContain('hr-timeout-abc');
  });

  it('renders trace ID for unauthorized error with request_id', () => {
    const html = renderToStaticMarkup(
      <SupportTraceMessage value="Unauthorized [request_id: hr-auth-xyz]" />,
    );

    expect(html).toContain('Unauthorized');
    expect(html).toContain('hr-auth-xyz');
  });

  it('renders nothing for empty/null values', () => {
    expect(renderToStaticMarkup(<SupportTraceMessage value={null} />)).toBe('');
    expect(renderToStaticMarkup(<SupportTraceMessage value="" />)).toBe('');
  });

  it('preserves custom className props when rendering with trace ID', () => {
    const html = renderToStaticMarkup(
      <SupportTraceMessage
        value="Error [request_id: hr-cls-test]"
        messageClassName="custom-msg-class"
        traceClassName="custom-trace-class"
        containerClassName="custom-container"
      />,
    );

    expect(html).toContain('custom-msg-class');
    expect(html).toContain('custom-trace-class');
    expect(html).toContain('custom-container');
    expect(html).toContain('hr-cls-test');
  });
});
