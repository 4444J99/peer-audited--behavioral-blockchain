import { Module, forwardRef } from '@nestjs/common';
import { FuryController } from './fury.controller';
import { FuryWorker } from './fury.worker';
import { ConsensusEngine } from './consensus.engine';
import { TruthLogService } from '../../../services/ledger/truth-log.service';
import { ContractsModule } from '../contracts/contracts.module';

@Module({
  imports: [forwardRef(() => ContractsModule)],
  controllers: [FuryController],
  providers: [FuryWorker, ConsensusEngine, TruthLogService],
  exports: [FuryWorker, ConsensusEngine],
})
export class FuryModule {}
