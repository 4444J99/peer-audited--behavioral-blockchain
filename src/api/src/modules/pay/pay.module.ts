import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { RoleGuard } from '../../common/guards/role.guard';
import { BillingService } from '../b2b/billing.service';
import { StripeFboService } from '../../../services/escrow/stripe.service';
import { LedgerService } from '../../../services/ledger/ledger.service';
import { TruthLogService } from '../../../services/ledger/truth-log.service';
import { PayController } from './pay.controller';
import { PayService } from './pay.service';

@Module({
  imports: [DatabaseModule],
  controllers: [PayController],
  providers: [
    PayService,
    BillingService,
    StripeFboService,
    LedgerService,
    TruthLogService,
    RoleGuard,
  ],
  exports: [PayService],
})
export class PayModule {}
