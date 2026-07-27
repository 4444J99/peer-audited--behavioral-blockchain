import { Module } from '@nestjs/common';
import { ReferralController } from './referral.controller';
import { ReferralService } from './referral.service';
import { LedgerService } from '../../../services/ledger/ledger.service';

@Module({
  controllers: [ReferralController],
  providers: [ReferralService, LedgerService],
  exports: [ReferralService],
})
export class ReferralModule {}
