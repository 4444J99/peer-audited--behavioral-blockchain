import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    rawBody: true, // Required for Stripe webhook signature verification
  });

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const allowedOrigins = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',')
    : ['http://localhost:3001', 'http://localhost:5173'];
  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
  });

  const port = process.env.API_PORT || 3000;
  await app.listen(port);
  console.log(`Styx API running on http://localhost:${port}`);
}

bootstrap();
