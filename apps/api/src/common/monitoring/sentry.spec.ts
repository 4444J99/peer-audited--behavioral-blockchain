describe('Sentry monitoring', () => {
  let sentryModule: typeof import('./sentry');

  beforeEach(() => {
    jest.resetModules();
    delete process.env.SENTRY_DSN;
  });

  afterEach(() => {
    delete process.env.SENTRY_DSN;
  });

  it('should report unavailable when SENTRY_DSN is not set', () => {
    sentryModule = require('./sentry');
    sentryModule.initSentry();
    expect(sentryModule.isSentryAvailable()).toBe(false);
  });

  it('should log info message when DSN is not set', () => {
    const consoleSpy = jest.spyOn(console, 'info').mockImplementation();
    sentryModule = require('./sentry');
    sentryModule.initSentry();
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('SENTRY_DSN not set'),
    );
    consoleSpy.mockRestore();
  });

  it('should gracefully handle missing @sentry/nestjs package', () => {
    process.env.SENTRY_DSN = 'https://examplePublicKey@o0.ingest.sentry.io/0';
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation();
    sentryModule = require('./sentry');
    sentryModule.initSentry();
    // @sentry/nestjs is not installed in this project, so it should warn
    expect(sentryModule.isSentryAvailable()).toBe(false);
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('@sentry/nestjs not installed'),
    );
    warnSpy.mockRestore();
  });

  it('should no-op captureException when sentry is unavailable', () => {
    sentryModule = require('./sentry');
    // Should not throw
    expect(() => sentryModule.captureException(new Error('test'))).not.toThrow();
  });

  it('should no-op captureMessage when sentry is unavailable', () => {
    sentryModule = require('./sentry');
    expect(() => sentryModule.captureMessage('test', 'warning')).not.toThrow();
  });

  it('should no-op captureException with context when sentry is unavailable', () => {
    sentryModule = require('./sentry');
    expect(() =>
      sentryModule.captureException(new Error('test'), { userId: '123' }),
    ).not.toThrow();
  });
});
