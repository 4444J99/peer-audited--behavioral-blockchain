import { normalizeBaseUrl, parsePort } from './runtime';

describe('normalizeBaseUrl', () => {
  it('should strip a single trailing slash', () => {
    expect(normalizeBaseUrl('https://api.styx.app/')).toBe('https://api.styx.app');
  });

  it('should strip repeated trailing slashes', () => {
    expect(normalizeBaseUrl('https://api.styx.app///')).toBe('https://api.styx.app');
  });

  it('should leave URLs without trailing slashes untouched', () => {
    expect(normalizeBaseUrl('https://api.styx.app')).toBe('https://api.styx.app');
  });

  it('should preserve interior slashes', () => {
    expect(normalizeBaseUrl('https://api.styx.app/v1/health/')).toBe('https://api.styx.app/v1/health');
  });

  it('should reduce an all-slash string to empty', () => {
    expect(normalizeBaseUrl('////')).toBe('');
  });

  it('should handle the empty string', () => {
    expect(normalizeBaseUrl('')).toBe('');
  });

  it('should run in linear time on adversarial slash-heavy input', () => {
    const adversarial = '/'.repeat(100_000) + 'x';
    const started = Date.now();
    expect(normalizeBaseUrl(adversarial)).toBe(adversarial);
    expect(Date.now() - started).toBeLessThan(1000);
  });
});

describe('parsePort', () => {
  it('should accept a valid TCP port', () => {
    expect(parsePort('5432', 'PostgreSQL port')).toBe(5432);
  });

  it('should reject non-numeric, zero, negative, and out-of-range ports', () => {
    for (const bad of ['abc', '0', '-1', '65536', '1.5']) {
      expect(() => parsePort(bad, 'PostgreSQL port')).toThrow(
        'PostgreSQL port must be a valid TCP port',
      );
    }
  });
});
