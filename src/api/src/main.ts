import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    rawBody: true, // Required for Stripe webhook signature verification
    bufferLogs: true,
  });

  // Structured logging — replace default NestJS logger with pino
  app.useLogger(app.get(Logger));

  // Security headers
  app.use(helmet());

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const allowedOrigins = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',')
    : ['http://localhost:3001', 'http://localhost:5173'];
  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
  });

  // OpenAPI/Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Styx API')
    .setDescription('Peer-audited behavioral market — the Blockchain of Truth')
    .setVersion('0.1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.API_PORT || 3000;
  await app.listen(port);
  const logger = app.get(Logger);
  logger.log(`Styx API running on http://localhost:${port}`, 'Bootstrap');
  logger.log(`Swagger docs at http://localhost:${port}/api/docs`, 'Bootstrap');
}

bootstrap();
