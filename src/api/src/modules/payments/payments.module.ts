import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { ContractsModule } from '../contracts/contracts.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { ComplianceModule } from '../compliance/compliance.module';
import { PaymentRouterService } from './payment-router.service';
import { StripeFBOService } from './stripe-fbo.service';
import { StripePayoutProvider } from './stripe-payout.provider';
import { SettlementService } from './settlement.service';
import { SettlementWorker } from './settlement.worker';
import { LedgerService } from '../../../services/ledger/ledger.service';
import { TruthLogService } from '../../../services/ledger/truth-log.service';

@Module({
  imports: [ContractsModule, NotificationsModule, ComplianceModule],
  controllers: [PaymentsController],
  providers: [
    PaymentRouterService,
    StripeFBOService,
    StripePayoutProvider,
    SettlementService,
    SettlementWorker,
    LedgerService,
    TruthLogService,
  ],
  exports: [PaymentRouterService, StripeFBOService, SettlementService],
})
export class PaymentsModule {}
