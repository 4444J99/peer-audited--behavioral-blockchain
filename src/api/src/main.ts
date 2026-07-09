import * as dotenv from 'dotenv';
import { resolveEnvFilePath } from './config/env-path';
const resolvedEnvFilePath = resolveEnvFilePath();
dotenv.config({ path: resolvedEnvFilePath });
console.info(`[Bootstrap] Loaded environment from ${resolvedEnvFilePath}`);

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { randomUUID } from 'crypto';
import { AppModule } from './app.module';
import { Logger } from 'nestjs-pino';
import * as express from 'express';
import { GlobalHttpExceptionFilter } from './common/filters/global-http-exception.filter';
import { initSentry } from './common/monitoring/sentry';
import {
  resolveApiListenPort,
  resolveApiPublicUrl,
  resolveCorsOrigins,
} from './config/runtime';

async function bootstrap() {
  // Initialize Sentry before NestFactory (requires SENTRY_DSN in .env)
  initSentry();
  const isProduction = process.env.NODE_ENV === 'production';

  const app = await NestFactory.create(AppModule, {
    rawBody: true, // Required for Stripe webhook signature verification
    bufferLogs: true,
  });

  // Structured logging — replace default NestJS logger with pino
  app.useLogger(app.get(Logger));
  const logger = app.get(Logger);

  // Security headers
  app.use(helmet());

  // Request correlation IDs surfaced to clients and logs
  app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
    const incomingId =
      req.header('x-styx-request-id') ||
      req.header('x-request-id') ||
      undefined;
    const requestId = incomingId || randomUUID();
    (req as any).id = (req as any).id || requestId;
    (req as any).traceId = requestId;
    res.setHeader('x-request-id', requestId);
    res.setHeader('x-styx-request-id', requestId);
    next();
  });

  // Request body size limit (prevent OOM via large payloads)
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ limit: '1mb', extended: true }));

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(new GlobalHttpExceptionFilter());

  const allowedOrigins = resolveCorsOrigins();

  if (allowedOrigins.length > 0) {
    app.enableCors({
      origin: allowedOrigins,
      credentials: true,
    });
  } else if (isProduction) {
    logger.warn(
      'CORS_ORIGINS is not configured in production; starting without cross-origin browser access.',
      'Bootstrap',
    );
  }

  // OpenAPI/Swagger documentation — only in non-production environments
  if (!isProduction) {
    const config = new DocumentBuilder()
      .setTitle('Styx API')
      .setDescription('Peer-audited behavioral market — the Blockchain of Truth')
      .setVersion('0.1.0')
      .addBearerAuth()
      .addApiKey({ type: 'apiKey', name: 'x-api-key', in: 'header' }, 'apiKey')
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
  }

  // Graceful shutdown — drain in-flight requests before exit
  app.enableShutdownHooks();

  const port = resolveApiListenPort();
  await app.listen(port);
  const boundUrl = await app.getUrl();
  const publicApiUrl = resolveApiPublicUrl(boundUrl) || boundUrl;
  logger.log(`Styx API running on ${publicApiUrl}`, 'Bootstrap');
  if (!isProduction) {
    logger.log(`Swagger docs at ${publicApiUrl}/api/docs`, 'Bootstrap');
  }
}

bootstrap();
