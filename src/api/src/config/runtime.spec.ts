import {
  isTestMoneyModeEnabled,
  normalizeBaseUrl,
  parsePort,
  resolveDatabaseUrl,
} from './runtime';

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

// Issue #28: the migration runner must source DB credentials from the same
// canonical config the app uses, with a loud failure when unset — never a
// wrong/hardcoded 'styx' default that silently drifts between environments.
describe('resolveDatabaseUrl (migration runner credential source)', () => {
  const PG_KEYS = [
    'DATABASE_URL',
    'POSTGRES_HOST',
    'POSTGRES_PORT',
    'POSTGRES_USER',
    'POSTGRES_PASSWORD',
    'POSTGRES_DB',
  ];
  let saved: Record<string, string | undefined>;

  beforeEach(() => {
    saved = {};
    for (const key of PG_KEYS) {
      saved[key] = process.env[key];
      delete process.env[key];
    }
  });

  afterEach(() => {
    for (const key of PG_KEYS) {
      if (saved[key] === undefined) delete process.env[key];
      else process.env[key] = saved[key];
    }
  });

  it('prefers an explicit DATABASE_URL verbatim', () => {
    process.env.DATABASE_URL =
      'postgresql://styx_admin:styx_local_secret@localhost:5432/styx';
    expect(resolveDatabaseUrl()).toBe(
      'postgresql://styx_admin:styx_local_secret@localhost:5432/styx',
    );
  });

  it('builds a connection URL from discrete POSTGRES_* vars when DATABASE_URL is unset', () => {
    process.env.POSTGRES_HOST = 'localhost';
    process.env.POSTGRES_PORT = '5432';
    process.env.POSTGRES_USER = 'styx_admin';
    process.env.POSTGRES_PASSWORD = 'styx_local_secret';
    process.env.POSTGRES_DB = 'styx';

    const url = new URL(resolveDatabaseUrl());
    expect(url.protocol).toBe('postgresql:');
    expect(url.hostname).toBe('localhost');
    expect(url.port).toBe('5432');
    expect(url.username).toBe('styx_admin');
    expect(url.password).toBe('styx_local_secret');
    expect(url.pathname).toBe('/styx');
  });

  it('throws (no hardcoded fallback) when neither DATABASE_URL nor PG vars are set', () => {
    expect(() => resolveDatabaseUrl()).toThrow(/PostgreSQL host is required/);
  });

  it('rejects an invalid PostgreSQL port instead of silently connecting', () => {
    process.env.POSTGRES_HOST = 'localhost';
    process.env.POSTGRES_PORT = 'not-a-port';
    process.env.POSTGRES_USER = 'styx_admin';
    process.env.POSTGRES_PASSWORD = 'styx_local_secret';
    process.env.POSTGRES_DB = 'styx';
    expect(() => resolveDatabaseUrl()).toThrow(
      'PostgreSQL port must be a valid TCP port',
    );
  });
});

describe('isTestMoneyModeEnabled (Issue #905 rail predicate)', () => {
  const saved = process.env.STYX_TEST_MONEY_MODE;

  afterEach(() => {
    if (saved === undefined) delete process.env.STYX_TEST_MONEY_MODE;
    else process.env.STYX_TEST_MONEY_MODE = saved;
  });

  it('defaults to true when unset (matches beta feature flag)', () => {
    delete process.env.STYX_TEST_MONEY_MODE;
    expect(isTestMoneyModeEnabled()).toBe(true);
  });

  it('treats truthy labels as enabled', () => {
    for (const value of ['1', 'true', 'TRUE', 'yes', 'on']) {
      process.env.STYX_TEST_MONEY_MODE = value;
      expect(isTestMoneyModeEnabled()).toBe(true);
    }
  });

  it('treats falsy labels as disabled', () => {
    for (const value of ['0', 'false', 'no', 'off', 'anything-else']) {
      process.env.STYX_TEST_MONEY_MODE = value;
      expect(isTestMoneyModeEnabled()).toBe(false);
    }
  });
});
