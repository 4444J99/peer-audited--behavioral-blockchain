import { Module, forwardRef } from '@nestjs/common';
import { FuryController } from './fury.controller';
import { FuryWorker } from './fury.worker';
import { ConsensusEngine } from './consensus.engine';
import { LedgerService } from '../../../services/ledger/ledger.service';
import { TruthLogService } from '../../../services/ledger/truth-log.service';
import { ContractsModule } from '../contracts/contracts.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [forwardRef(() => ContractsModule), NotificationsModule],
  controllers: [FuryController],
  providers: [FuryWorker, ConsensusEngine, LedgerService, TruthLogService],
  exports: [FuryWorker, ConsensusEngine],
})
export class FuryModule {}
