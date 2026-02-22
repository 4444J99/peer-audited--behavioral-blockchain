import { Module } from '@nestjs/common';
import { FuryController } from './fury.controller';
import { FuryWorker } from './fury.worker';
import { ConsensusEngine } from './consensus.engine';
import { TruthLogService } from '../../../services/ledger/truth-log.service';

@Module({
  controllers: [FuryController],
  providers: [FuryWorker, ConsensusEngine, TruthLogService],
  exports: [FuryWorker, ConsensusEngine],
})
export class FuryModule {}
