import { Module } from '@nestjs/common';
import { ProofsController } from './proofs.controller';
import { R2StorageService } from '../../../services/storage/r2.service';
import { FuryRouterService } from '../../../services/fury-router/fury-router.service';
import { TruthLogService } from '../../../services/ledger/truth-log.service';
import { PHashService } from '../../../services/intelligence/phash.service';
import { AnomalyService } from '../../../services/anomaly/anomaly.service';
import { ProofsService } from './proofs.service';
import { VideoProcessingService } from './video-processing.service';
import { VideoProcessingWorker } from './video-processing.worker';
import { VideoProcessingScheduler } from './video-processing.scheduler';
import { TranscodingService } from '../../../services/media/transcoding.service';
import { RedactionService } from '../../../services/media/redaction.service';
import { CrisisModule } from '../crisis/crisis.module';

@Module({
  imports: [CrisisModule],
  controllers: [ProofsController],
  providers: [
    R2StorageService, FuryRouterService, TruthLogService, PHashService,
    AnomalyService, ProofsService, VideoProcessingService, VideoProcessingWorker,
    VideoProcessingScheduler, TranscodingService, RedactionService,
  ],
  exports: [R2StorageService, VideoProcessingService],
})
export class ProofsModule {}
