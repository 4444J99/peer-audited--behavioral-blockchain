import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { SupportTraceMessage } from '../../components/support/SupportTraceMessage';

/**
 * Regression tests for trace-ID rendering on the Admin page.
 *
 * The admin page uses <SupportTraceMessage> in multiple places:
 *   - Main error banner (when auth fails or stats fail to load)
 *   - Honeypot result
 *   - Ban result
 *   - Resolve result
 *
 * These tests verify that the trace-ID rendering integration works correctly
 * with error strings that match the admin page's actual error patterns.
 */
describe('Admin page – trace-ID rendering (SupportTraceMessage)', () => {
  it('renders trace ID for a "Forbidden" error with request_id suffix', () => {
    const html = renderToStaticMarkup(
      <SupportTraceMessage
        value="Forbidden: ADMIN role required [request_id: adm-trace-001]"
        messageClassName="text-red-400 font-bold"
        traceClassName="text-xs text-neutral-500 font-mono"
        containerClassName="space-y-2"
      />,
    );

    expect(html).toContain('Forbidden: ADMIN role required');
    expect(html).toContain('Support trace ID');
    expect(html).toContain('adm-trace-001');
    expect(html).not.toContain('[request_id:');
  });

  it('renders trace ID for a "Failed to load admin stats" error', () => {
    const html = renderToStaticMarkup(
      <SupportTraceMessage value="Failed to load admin stats [request_id: adm-trace-002]" />,
    );

    expect(html).toContain('Failed to load admin stats');
    expect(html).toContain('adm-trace-002');
  });

  it('does not render trace ID when request_id suffix is absent', () => {
    const html = renderToStaticMarkup(
      <SupportTraceMessage
        value="Forbidden: ADMIN role required"
        messageClassName="text-red-400 font-bold"
      />,
    );

    expect(html).toContain('Forbidden: ADMIN role required');
    expect(html).not.toContain('Support trace ID');
  });

  it('renders trace ID for honeypot result with request_id', () => {
    const html = renderToStaticMarkup(
      <SupportTraceMessage value="Failed to inject honeypot [request_id: hp-trace-99]" />,
    );

    expect(html).toContain('Failed to inject honeypot');
    expect(html).toContain('hp-trace-99');
  });

  it('renders trace ID for ban result with request_id', () => {
    const html = renderToStaticMarkup(
      <SupportTraceMessage value="User not found [request_id: ban-trace-42]" />,
    );

    expect(html).toContain('User not found');
    expect(html).toContain('ban-trace-42');
  });

  it('renders trace ID for resolve result with request_id', () => {
    const html = renderToStaticMarkup(
      <SupportTraceMessage value="Contract not found [request_id: res-trace-77]" />,
    );

    expect(html).toContain('Contract not found');
    expect(html).toContain('res-trace-77');
  });

  it('renders nothing for null/undefined/empty values', () => {
    expect(renderToStaticMarkup(<SupportTraceMessage value={null} />)).toBe('');
    expect(renderToStaticMarkup(<SupportTraceMessage value={undefined} />)).toBe('');
    expect(renderToStaticMarkup(<SupportTraceMessage value="" />)).toBe('');
  });
});
