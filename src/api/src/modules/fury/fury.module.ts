import { Module, forwardRef } from '@nestjs/common';
import { FuryController } from './fury.controller';
import { FuryWorker } from './fury.worker';
import { FuryRouterWorker } from '../../../services/fury-router/fury-router.worker';
import { ConsensusEngine } from './consensus.engine';
import { LedgerService } from '../../../services/ledger/ledger.service';
import { TruthLogService } from '../../../services/ledger/truth-log.service';
import { R2StorageService } from '../../../services/storage/r2.service';
import { HoneypotService } from '../../../services/intelligence/honeypot.service';
import { FuryRouterService } from '../../../services/fury-router/fury-router.service';
import { ContractsModule } from '../contracts/contracts.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [forwardRef(() => ContractsModule), NotificationsModule],
  controllers: [FuryController],
  providers: [FuryWorker, FuryRouterWorker, ConsensusEngine, LedgerService, TruthLogService, R2StorageService, HoneypotService, FuryRouterService],
  exports: [FuryWorker, FuryRouterWorker, ConsensusEngine, R2StorageService],
})
export class FuryModule {}
