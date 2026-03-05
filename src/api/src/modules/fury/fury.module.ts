import { Module, forwardRef } from '@nestjs/common';
import { FuryController } from './fury.controller';
import { EnforcementController } from './enforcement.controller';
import { FuryWorker } from './fury.worker';
import { FuryRouterWorker } from '../../../services/fury-router/fury-router.worker';
import { ConsensusEngine } from './consensus.engine';
import { EnforcementService } from './enforcement.service';
import { LedgerService } from '../../../services/ledger/ledger.service';
import { TruthLogService } from '../../../services/ledger/truth-log.service';
import { R2StorageService } from '../../../services/storage/r2.service';
import { HoneypotService } from '../../../services/intelligence/honeypot.service';
import { FuryRouterService } from '../../../services/fury-router/fury-router.service';
import { ContractsModule } from '../contracts/contracts.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { JudgeService } from './judge.service';

@Module({
  imports: [forwardRef(() => ContractsModule), NotificationsModule],
  controllers: [FuryController, EnforcementController],
  providers: [
    FuryWorker, 
    FuryRouterWorker, 
    ConsensusEngine, 
    EnforcementService,
    LedgerService, 
    TruthLogService, 
    R2StorageService, 
    HoneypotService, 
    FuryRouterService,
    JudgeService,
  ],
  exports: [
    FuryWorker, 
    FuryRouterWorker, 
    ConsensusEngine, 
    EnforcementService,
    R2StorageService,
    JudgeService,
  ],
})
export class FuryModule {}
