import { Module } from '@nestjs/common';
import { RealmsController } from './realms.controller';

@Module({
  controllers: [RealmsController],
})
export class RealmsModule {}
