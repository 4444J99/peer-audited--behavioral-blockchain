import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { ModerationService } from '../../../services/security/moderation.service';
import { HoneypotService } from '../../../services/intelligence/honeypot.service';
import { TruthLogService } from '../../../services/ledger/truth-log.service';
import { FuryRouterService } from '../../../services/fury-router/fury-router.service';
import { RoleGuard } from '../../common/guards/role.guard';
import { ContractsModule } from '../contracts/contracts.module';

@Module({
  imports: [ContractsModule],
  controllers: [AdminController],
  providers: [
    ModerationService,
    HoneypotInjectorService,
    TruthLogService,
    FuryRouterService,
    RoleGuard,
  ],
})
export class AdminModule {}
