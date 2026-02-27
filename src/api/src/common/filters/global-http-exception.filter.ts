import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { captureException } from '../monitoring/sentry';

type ErrorEnvelope = {
  error_code: string;
  message: string;
  trace_id: string | null;
  details?: unknown;
};

function defaultErrorCode(status: number): string {
  switch (status) {
    case HttpStatus.BAD_REQUEST:
      return 'BAD_REQUEST';
    case HttpStatus.UNAUTHORIZED:
      return 'UNAUTHORIZED';
    case HttpStatus.FORBIDDEN:
      return 'FORBIDDEN';
    case HttpStatus.NOT_FOUND:
      return 'NOT_FOUND';
    case HttpStatus.CONFLICT:
      return 'CONFLICT';
    case HttpStatus.TOO_MANY_REQUESTS:
      return 'RATE_LIMITED';
    default:
      return status >= 500 ? 'INTERNAL_SERVER_ERROR' : 'HTTP_ERROR';
  }
}

function normalizeHttpExceptionPayload(
  exception: HttpException,
  status: number,
): Omit<ErrorEnvelope, 'trace_id'> {
  const raw = exception.getResponse();

  if (typeof raw === 'string') {
    return {
      error_code: defaultErrorCode(status),
      message: raw,
    };
  }

  if (raw && typeof raw === 'object') {
    const payload = raw as Record<string, unknown>;
    const rawMessage = payload.message;
    const rawErrorCode = payload.error_code || payload.code;

    let message = 'Request failed';
    let details: unknown;

    if (Array.isArray(rawMessage)) {
      message = 'Validation failed';
      details = { issues: rawMessage };
    } else if (typeof rawMessage === 'string') {
      message = rawMessage;
      if (payload.details !== undefined) {
        details = payload.details;
      }
      const detailEntries = Object.entries(payload).filter(([key]) =>
        !['message', 'error', 'statusCode', 'code', 'error_code', 'details'].includes(key),
      );
      if (detailEntries.length > 0 && details === undefined) {
        details = Object.fromEntries(detailEntries);
      }
    } else if (typeof payload.error === 'string') {
      message = payload.error;
      if (payload.details !== undefined) {
        details = payload.details;
      }
      const detailEntries = Object.entries(payload).filter(([key]) =>
        !['error', 'statusCode', 'code', 'error_code', 'details'].includes(key),
      );
      if (detailEntries.length > 0 && details === undefined) {
        details = Object.fromEntries(detailEntries);
      }
    }

    return {
      error_code:
        typeof rawErrorCode === 'string' && rawErrorCode.length > 0
          ? rawErrorCode
          : defaultErrorCode(status),
      message,
      ...(details !== undefined ? { details } : {}),
    };
  }

  return {
    error_code: defaultErrorCode(status),
    message: exception.message || 'Request failed',
  };
}

@Catch()
export class GlobalHttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalHttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request & { id?: string; traceId?: string }>();

    const traceId = request.traceId || request.id || null;

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = normalizeHttpExceptionPayload(exception, status);
      response.status(status).json({ ...body, trace_id: traceId });
      return;
    }

    const message =
      process.env.NODE_ENV === 'production'
        ? 'Internal server error'
        : exception instanceof Error
          ? exception.message
          : 'Internal server error';

    const body: ErrorEnvelope = {
      error_code: 'INTERNAL_SERVER_ERROR',
      message,
      trace_id: traceId,
    };

    if (process.env.NODE_ENV !== 'production' && exception instanceof Error && exception.stack) {
      body.details = { name: exception.name, stack: exception.stack };
    }

    this.logger.error(
      exception instanceof Error ? exception.stack || exception.message : String(exception),
      traceId ? `trace_id=${traceId}` : undefined,
    );

    // Report unhandled errors to Sentry (if configured)
    captureException(exception, { trace_id: traceId, path: request.url, method: request.method });

    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json(body);
  }
}

export const __testables = {
  defaultErrorCode,
  normalizeHttpExceptionPayload,
};
