import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { SocialController } from './social.controller';
import { SocialLayerService } from './social-layer.service';

@Module({
  imports: [DatabaseModule],
  controllers: [SocialController],
  providers: [SocialLayerService],
  exports: [SocialLayerService],
})
export class SocialModule {}
