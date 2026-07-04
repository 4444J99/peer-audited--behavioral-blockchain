import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import supertest from 'supertest';

// Minimal module for Swagger bootstrap test
import { Module, Controller, Get } from '@nestjs/common';

@Controller('health')
class MockHealthController {
  @Get()
  check() {
    return { status: 'ok' };
  }
}

@Module({
  controllers: [MockHealthController],
})
class MockAppModule {}

describe('Swagger Documentation', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [MockAppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    const config = new DocumentBuilder()
      .setTitle('Styx API')
      .setDescription('Peer-audited behavioral market — the Blockchain of Truth')
      .setVersion('0.1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should serve Swagger UI at /api/docs', async () => {
    const response = await supertest(app.getHttpServer())
      .get('/api/docs/')
      .expect(200);
    expect(response.text).toContain('Swagger UI');
  });

  it('should serve OpenAPI JSON at /api/docs-json', async () => {
    const response = await supertest(app.getHttpServer())
      .get('/api/docs-json')
      .expect(200);
    expect(response.body.info.title).toBe('Styx API');
    expect(response.body.info.version).toBe('0.1.0');
    expect(response.body.components.securitySchemes).toHaveProperty('bearer');
  });
});
