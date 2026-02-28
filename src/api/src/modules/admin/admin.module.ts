import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { ModerationService } from '../../../services/security/moderation.service';
import { HoneypotService } from '../../../services/intelligence/honeypot.service';
import { AnomalyService } from '../../../services/anomaly/anomaly.service';
import { TruthLogService } from '../../../services/ledger/truth-log.service';
import { FuryRouterService } from '../../../services/fury-router/fury-router.service';
import { RoleGuard } from '../../common/guards/role.guard';
import { ContractsModule } from '../contracts/contracts.module';
import { ProofsModule } from '../proofs/proofs.module';

@Module({
  imports: [ContractsModule, ProofsModule],
  controllers: [AdminController],
  providers: [
    ModerationService,
    HoneypotService,
    AnomalyService,
    TruthLogService,
    FuryRouterService,
    RoleGuard,
  ],
})
export class AdminModule {}
