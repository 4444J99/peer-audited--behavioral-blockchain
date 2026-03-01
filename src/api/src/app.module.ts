import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { ContractsModule } from './modules/contracts/contracts.module';
import { FuryModule } from './modules/fury/fury.module';
import { WalletModule } from './modules/wallet/wallet.module';
import { UsersModule } from './modules/users/users.module';
import { AdminModule } from './modules/admin/admin.module';
import { HealthModule } from './modules/health/health.module';
import { B2BModule } from './modules/b2b/b2b.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { AiModule } from './modules/ai/ai.module';
import { ProofsModule } from './modules/proofs/proofs.module';
import { FeedModule } from './modules/feed/feed.module';
import { ComplianceModule } from './modules/compliance/compliance.module';
import { BetaModule } from './modules/beta/beta.module';

@Module({
  imports: [
    LoggerModule.forRoot({
      pinoHttp: {
        autoLogging: true,
        level: process.env.LOG_LEVEL || 'info',
        ...(process.env.PINO_TRANSPORT
          ? { transport: { target: process.env.PINO_TRANSPORT, options: { colorize: true } } }
          : {}),
      },
    }),
    ComplianceModule,
    BetaModule,
    DatabaseModule,
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 60 }]),
    AuthModule,
    ContractsModule,
    FuryModule,
    WalletModule,
    UsersModule,
    AdminModule,
    HealthModule,
    B2BModule,
    NotificationsModule,
    PaymentsModule,
    AiModule,
    ProofsModule,
    FeedModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
