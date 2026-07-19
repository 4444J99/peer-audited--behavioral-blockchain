import { parseSupportTraceMessage } from './support-trace';

describe('parseSupportTraceMessage', () => {
  it('parses a basic message with request_id suffix', () => {
    const result = parseSupportTraceMessage('Something failed [request_id: abc-123]');
    expect(result.message).toBe('Something failed');
    expect(result.traceId).toBe('abc-123');
  });

  it('extracts trace ID with various formats', () => {
    const result = parseSupportTraceMessage('Error [request_id: trace-web-456]');
    expect(result.message).toBe('Error');
    expect(result.traceId).toBe('trace-web-456');
  });

  it('returns null traceId when no request_id suffix is present', () => {
    const result = parseSupportTraceMessage('Forbidden: ADMIN role required');
    expect(result.message).toBe('Forbidden: ADMIN role required');
    expect(result.traceId).toBeNull();
  });

  it('returns empty message and null traceId for empty string', () => {
    const result = parseSupportTraceMessage('');
    expect(result.message).toBe('');
    expect(result.traceId).toBeNull();
  });

  it('returns empty message and null traceId for null input', () => {
    const result = parseSupportTraceMessage(null);
    expect(result.message).toBe('');
    expect(result.traceId).toBeNull();
  });

  it('returns empty message and null traceId for undefined input', () => {
    const result = parseSupportTraceMessage(undefined);
    expect(result.message).toBe('');
    expect(result.traceId).toBeNull();
  });

  it('handles message with multiple brackets — only parses the request_id suffix', () => {
    const result = parseSupportTraceMessage(
      'Error in [module X] for [user Y] [request_id: multi-bracket-99]',
    );
    expect(result.message).toBe('Error in [module X] for [user Y]');
    expect(result.traceId).toBe('multi-bracket-99');
  });

  it('handles message with brackets that are not request_id', () => {
    const result = parseSupportTraceMessage('Error in [module X] for [user Y]');
    expect(result.message).toBe('Error in [module X] for [user Y]');
    expect(result.traceId).toBeNull();
  });

  it('trims whitespace in message and trace ID', () => {
    const result = parseSupportTraceMessage('  Padded message   [request_id:   spaced-id  ]  ');
    expect(result.message).toBe('Padded message');
    expect(result.traceId).toBe('spaced-id');
  });

  it('handles case-insensitive request_id tag', () => {
    const result = parseSupportTraceMessage('Error [REQUEST_ID: UPPER-001]');
    expect(result.message).toBe('Error');
    expect(result.traceId).toBe('UPPER-001');
  });
});
