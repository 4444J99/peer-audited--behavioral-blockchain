import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import { AppModule } from '../src/app.module';
import { GlobalHttpExceptionFilter } from '../src/common/filters/global-http-exception.filter';
import { initSentry } from '../src/common/monitoring/sentry';

const server = express();
let cachedApp: Awaited<ReturnType<typeof NestFactory.create>> | null = null;

async function bootstrap() {
  if (cachedApp) return server;

  initSentry();

  const nestApp = await NestFactory.create(AppModule, new ExpressAdapter(server), {
    rawBody: true,
    logger: process.env.NODE_ENV === 'production' ? ['error', 'warn'] : ['error', 'warn', 'log'],
  });

  nestApp.use(helmet());

  // Request correlation IDs
  nestApp.use((req: Request, res: Response, next: NextFunction) => {
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

  nestApp.use(express.json({ limit: '1mb' }));
  nestApp.use(express.urlencoded({ limit: '1mb', extended: true }));

  nestApp.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  nestApp.useGlobalFilters(new GlobalHttpExceptionFilter());

  const allowedOrigins = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',')
    : ['http://localhost:3001'];
  nestApp.enableCors({ origin: allowedOrigins, credentials: true });

  await nestApp.init();
  cachedApp = nestApp;

  return server;
}

export default async function handler(req: any, res: any) {
  const s = await bootstrap();
  s(req, res);
}
