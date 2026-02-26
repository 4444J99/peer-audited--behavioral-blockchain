import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { SupportTraceMessage } from './SupportTraceMessage';

describe('SupportTraceMessage', () => {
  it('renders message and support trace ID when request id suffix is present', () => {
    const html = renderToStaticMarkup(
      <SupportTraceMessage value="Failed to load metrics [request_id: trace-web-123]" />,
    );

    expect(html).toContain('Failed to load metrics');
    expect(html).toContain('Support trace ID');
    expect(html).toContain('trace-web-123');
    expect(html).not.toContain('[request_id:');
  });

  it('renders only message when no request id suffix is present', () => {
    const html = renderToStaticMarkup(
      <SupportTraceMessage value="Forbidden: ADMIN role required" />,
    );

    expect(html).toContain('Forbidden: ADMIN role required');
    expect(html).not.toContain('Support trace ID');
  });

  it('renders nothing for empty values', () => {
    const html = renderToStaticMarkup(<SupportTraceMessage value="" />);
    expect(html).toBe('');
  });
});
