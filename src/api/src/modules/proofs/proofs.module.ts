import { Module } from '@nestjs/common';
import { ProofsController } from './proofs.controller';
import { R2StorageService } from '../../../services/storage/r2.service';
import { FuryRouterService } from '../../../services/fury-router/fury-router.service';
import { TruthLogService } from '../../../services/ledger/truth-log.service';
import { PHashService } from '../../../services/intelligence/phash.service';
import { ProofsService } from './proofs.service';

@Module({
  controllers: [ProofsController],
  providers: [R2StorageService, FuryRouterService, TruthLogService, PHashService, ProofsService],
  exports: [R2StorageService],
})
export class ProofsModule {}
