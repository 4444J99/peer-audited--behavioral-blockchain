import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AdminController } from './admin.controller';
import { AdminScheduler } from './admin.scheduler';
import { ModerationService } from '../../../services/security/moderation.service';
import { HoneypotService } from '../../../services/intelligence/honeypot.service';
import { AnomalyService } from '../../../services/anomaly/anomaly.service';
import { TruthLogService } from '../../../services/ledger/truth-log.service';
import { FuryRouterService } from '../../../services/fury-router/fury-router.service';
import { RoleGuard } from '../../common/guards/role.guard';
import { ContractsModule } from '../contracts/contracts.module';
import { ProofsModule } from '../proofs/proofs.module';

@Module({
  imports: [ScheduleModule.forRoot(), ContractsModule, ProofsModule],
  controllers: [AdminController],
  providers: [
    ModerationService,
    HoneypotService,
    AnomalyService,
    TruthLogService,
    FuryRouterService,
    RoleGuard,
    AdminScheduler,
  ],
})
export class AdminModule {}
