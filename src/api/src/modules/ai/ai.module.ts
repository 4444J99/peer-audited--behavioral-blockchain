import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { RationalizationController } from './rationalization.controller';
import { RationalizationService } from './rationalization.service';

@Module({
  controllers: [AiController, RationalizationController],
  providers: [RationalizationService],
  exports: [RationalizationService],
})
export class AiModule {}
