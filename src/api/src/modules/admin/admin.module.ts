import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { ModerationService } from '../../../services/security/moderation.service';
import { HoneypotInjectorService } from '../../../services/intelligence/honeypot.service';
import { TruthLogService } from '../../../services/ledger/truth-log.service';
import { FuryRouterService } from '../../../services/fury-router/fury-router.service';
import { ContractsModule } from '../contracts/contracts.module';

@Module({
  imports: [ContractsModule],
  controllers: [AdminController],
  providers: [
    ModerationService,
    HoneypotInjectorService,
    TruthLogService,
    FuryRouterService,
  ],
})
export class AdminModule {}
