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
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) {
    console.info('[Sentry] SENTRY_DSN not set — error monitoring disabled.');
    return;
  }

  try {
    // Dynamic require so the app doesn't crash if @sentry/nestjs isn't installed
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
  } catch {
    console.warn('[Sentry] @sentry/nestjs not installed — run: npm install @sentry/nestjs');
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
        SentryModule.captureMessage(`FINANCIAL INTEGRITY ALERT: ${event}`, 'error');
      });
    } else {
      SentryModule.captureMessage(`FINANCIAL INTEGRITY ALERT: ${event}`, 'error');
    }
  } catch (err) {
    console.error(`Failed to dispatch Sentry financial alert: ${(err as Error).message}`, details);
  }
}

export function isSentryAvailable(): boolean {
  return sentryAvailable;
}

