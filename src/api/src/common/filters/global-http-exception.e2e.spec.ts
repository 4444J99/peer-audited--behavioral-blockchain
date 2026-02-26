import { BadRequestException, Controller, Get, INestApplication, Module } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import supertest from 'supertest';
import { randomUUID } from 'crypto';
import { GlobalHttpExceptionFilter } from './global-http-exception.filter';

@Controller('error-envelope-test')
class ErrorEnvelopeTestController {
  @Get('bad-request')
  badRequest() {
    throw new BadRequestException(['email must be an email']);
  }

  @Get('crash')
  crash() {
    throw new Error('simulated crash');
  }
}

@Module({
  controllers: [ErrorEnvelopeTestController],
})
class ErrorEnvelopeTestModule {}

describe('Global error envelope (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [ErrorEnvelopeTestModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.use((req: any, res: any, next: () => void) => {
      const incomingId = req.header('x-styx-request-id') || req.header('x-request-id');
      const requestId = incomingId || randomUUID();
      req.id = req.id || requestId;
      req.traceId = requestId;
      res.setHeader('x-request-id', requestId);
      res.setHeader('x-styx-request-id', requestId);
      next();
    });
    app.useGlobalFilters(new GlobalHttpExceptionFilter());

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns standardized HttpException envelope and preserves incoming trace_id', async () => {
    const response = await supertest(app.getHttpServer())
      .get('/error-envelope-test/bad-request')
      .set('x-styx-request-id', 'trace-e2e-http-001')
      .expect(400);

    expect(response.headers['x-styx-request-id']).toBe('trace-e2e-http-001');
    expect(response.body).toEqual({
      error_code: 'BAD_REQUEST',
      message: 'Validation failed',
      trace_id: 'trace-e2e-http-001',
      details: {
        issues: ['email must be an email'],
      },
    });
  });

  it('returns standardized 500 envelope with generated trace_id on unhandled errors', async () => {
    const response = await supertest(app.getHttpServer())
      .get('/error-envelope-test/crash')
      .expect(500);

    expect(response.body.error_code).toBe('INTERNAL_SERVER_ERROR');
    expect(typeof response.body.message).toBe('string');
    expect(response.body.trace_id).toBeTruthy();
    expect(response.body.trace_id).toBe(response.headers['x-styx-request-id']);
    expect(response.headers['x-request-id']).toBe(response.body.trace_id);
  });
});
