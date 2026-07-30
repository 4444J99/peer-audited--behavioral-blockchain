import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { AntiSybilService } from './anti-sybil.service';
import { SecurityController } from './security.controller';
import { RoleGuard } from '../../common/guards/role.guard';

@Module({
  imports: [DatabaseModule],
  controllers: [SecurityController],
  providers: [AntiSybilService, RoleGuard],
  exports: [AntiSybilService],
})
export class SecurityModule {}
