import { ArgumentsHost, BadRequestException, HttpException, HttpStatus } from '@nestjs/common';
import { GlobalHttpExceptionFilter, __testables } from './global-http-exception.filter';

describe('GlobalHttpExceptionFilter', () => {
  let filter: GlobalHttpExceptionFilter;
  let status: jest.Mock;
  let json: jest.Mock;
  let host: ArgumentsHost;
  let request: any;

  beforeEach(() => {
    filter = new GlobalHttpExceptionFilter();
    json = jest.fn();
    status = jest.fn().mockReturnValue({ json });
    request = { id: 'req-123', traceId: 'trace-123' };

    host = {
      switchToHttp: () => ({
        getResponse: () => ({ status }),
        getRequest: () => request,
      }),
    } as unknown as ArgumentsHost;
  });

  it('formats HttpException string responses into the standard envelope', () => {
    filter.catch(new HttpException('Nope', HttpStatus.FORBIDDEN), host);

    expect(status).toHaveBeenCalledWith(403);
    expect(json).toHaveBeenCalledWith({
      error_code: 'FORBIDDEN',
      message: 'Nope',
      trace_id: 'trace-123',
    });
  });

  it('formats validation arrays into details.issues', () => {
    filter.catch(
      new BadRequestException(['email must be an email', 'password should not be empty']),
      host,
    );

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({
      error_code: 'BAD_REQUEST',
      message: 'Validation failed',
      trace_id: 'trace-123',
      details: {
        issues: ['email must be an email', 'password should not be empty'],
      },
    });
  });

  it('preserves custom error_code from HttpException payloads', () => {
    filter.catch(
      new HttpException(
        {
          error_code: 'RECOVERY_CONTRACT_INVALID',
          message: 'No-Contact recovery configuration invalid',
          details: { field: 'oathCategory' },
        },
        HttpStatus.BAD_REQUEST,
      ),
      host,
    );

    expect(json).toHaveBeenCalledWith({
      error_code: 'RECOVERY_CONTRACT_INVALID',
      message: 'No-Contact recovery configuration invalid',
      trace_id: 'trace-123',
      details: { field: 'oathCategory' },
    });
  });

  it('handles unknown errors as 500 with trace_id', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'test';

    filter.catch(new Error('boom'), host);

    expect(status).toHaveBeenCalledWith(500);
    const payload = json.mock.calls[0][0];
    expect(payload.error_code).toBe('INTERNAL_SERVER_ERROR');
    expect(payload.message).toBe('boom');
    expect(payload.trace_id).toBe('trace-123');
    expect(payload.details).toBeDefined();

    process.env.NODE_ENV = originalEnv;
  });
});

describe('global-http-exception.filter helpers', () => {
  it('maps 429 to RATE_LIMITED', () => {
    expect(__testables.defaultErrorCode(429)).toBe('RATE_LIMITED');
  });

  it('normalizes string HttpException payloads', () => {
    const payload = __testables.normalizeHttpExceptionPayload(
      new HttpException('Bad request', 400),
      400,
    );

    expect(payload).toEqual({
      error_code: 'BAD_REQUEST',
      message: 'Bad request',
    });
  });
});
