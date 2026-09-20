/**
 * Sentry integration for Styx API.
 *
 * Installation:
 *   npm install --save @sentry/nestjs
 *
 * Add SENTRY_DSN to .env (get from https://sentry.io -> create project -> NestJS).
 * Call `initSentry()` at the top of main.ts, BEFORE NestFactory.create().
 */

let sentryAvailable = false;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let SentryModule: any = null;

export function initSentry(): void {
  sentryAvailable = false;
  SentryModule = null;
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) {
    console.info('[Sentry] SENTRY_DSN not set — error monitoring disabled.');
    return;
  }

  try {
    // Defer loading the installed runtime SDK until a DSN is configured.
    SentryModule = require('@sentry/nestjs');
    SentryModule.init({
      dsn,
      environment: process.env.NODE_ENV || 'development',
      release: process.env.STYX_API_VERSION || '0.0.1',
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.2 : 1.0,
      integrations: [],
    });
    sentryAvailable = true;
    console.info('[Sentry] Initialized successfully.');
  } catch (error) {
    console.warn('[Sentry] initialization failed; monitoring unavailable:', error);
  }
}

export function captureException(error: unknown, context?: Record<string, unknown>): void {
  if (!sentryAvailable || !SentryModule) return;
  SentryModule.captureException(error, context ? { extra: context } : undefined);
}

export function captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info'): void {
  if (!sentryAvailable || !SentryModule) return;
  SentryModule.captureMessage(message, level);
}

export function captureFinancialAlert(
  event: string,
  details: Record<string, unknown> = {},
): void {
  if (!sentryAvailable || !SentryModule) {
    console.error(`[CRITICAL FINANCIAL ALERT] ${event}`, details);
    return;
  }
  try {
    if (typeof SentryModule.withScope === 'function') {
      SentryModule.withScope((scope: any) => {
        scope.setLevel('fatal');
        scope.setTag('financial_incident', 'true');
        scope.setTag('financial_event', event);
        scope.setFingerprint(['financial-incident', event]);
        scope.setContext('financial_details', details);
        // Do not override the fatal level configured on this scope. Passing an
        // explicit `error` level here silently downgraded quarantine incidents.
        SentryModule.captureMessage(`FINANCIAL INTEGRITY ALERT: ${event}`);
      });
    } else {
      SentryModule.captureMessage(`FINANCIAL INTEGRITY ALERT: ${event}`, 'fatal');
    }
  } catch (err) {
    console.error(`Failed to dispatch Sentry financial alert: ${(err as Error).message}`, details);
  }
}

export function isSentryAvailable(): boolean {
  return sentryAvailable;
}
