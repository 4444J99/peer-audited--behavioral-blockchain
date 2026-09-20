describe('Sentry monitoring', () => {
  let sentryModule: typeof import('./sentry');

  beforeEach(() => {
    jest.resetModules();
    delete process.env.SENTRY_DSN;
  });

  afterEach(() => {
    jest.dontMock('@sentry/nestjs');
    jest.restoreAllMocks();
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

  it('reports initialization failure without pretending monitoring is available', () => {
    process.env.SENTRY_DSN = 'https://examplePublicKey@o0.ingest.sentry.io/0';
    jest.doMock('@sentry/nestjs', () => { throw new Error('simulated SDK initialization failure'); });
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation();
    sentryModule = require('./sentry');
    sentryModule.initSentry();
    // Failure is injected explicitly; the runtime package must be installed.
    expect(sentryModule.isSentryAvailable()).toBe(false);
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('initialization failed'),
      expect.any(Error),
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

  it('should log error when captureFinancialAlert is called without sentry', () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    sentryModule = require('./sentry');
    sentryModule.captureFinancialAlert('LEDGER_IMBALANCE', { differenceCents: 500 });
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('[CRITICAL FINANCIAL ALERT] LEDGER_IMBALANCE'),
      expect.objectContaining({ differenceCents: 500 }),
    );
    errorSpy.mockRestore();
  });
  it('ships the runtime transport and dispatches a financial alert through it', () => {
    expect(require.resolve('@sentry/nestjs')).toBeTruthy();
    const scope = { setLevel: jest.fn(), setTag: jest.fn(), setFingerprint: jest.fn(), setContext: jest.fn() };
    const sdk = {
      init: jest.fn(), captureMessage: jest.fn(),
      withScope: jest.fn((callback) => callback(scope)),
    };
    jest.doMock('@sentry/nestjs', () => sdk);
    process.env.SENTRY_DSN = 'https://examplePublicKey@o0.ingest.sentry.io/0';
    sentryModule = require('./sentry');
    sentryModule.initSentry();
    sentryModule.captureFinancialAlert('LEDGER_QUARANTINE_ACTIVATED', { accountId: 'acct-1' });
    expect(sentryModule.isSentryAvailable()).toBe(true);
    expect(scope.setLevel).toHaveBeenCalledWith('fatal');
    expect(scope.setTag).toHaveBeenCalledWith('financial_event', 'LEDGER_QUARANTINE_ACTIVATED');
    expect(sdk.captureMessage).toHaveBeenCalledWith('FINANCIAL INTEGRITY ALERT: LEDGER_QUARANTINE_ACTIVATED');
    delete process.env.SENTRY_DSN;
    sentryModule.initSentry();
    expect(sentryModule.isSentryAvailable()).toBe(false);
  });

});
