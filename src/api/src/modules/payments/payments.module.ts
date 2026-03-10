import { Module, forwardRef } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { ContractsModule } from '../contracts/contracts.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { ComplianceModule } from '../compliance/compliance.module';
import { PaymentRouterService } from './payment-router.service';
import { StripeFBOService } from './stripe-fbo.service';
import { StripePayoutProvider } from './stripe-payout.provider';
import { SettlementService } from './settlement.service';
import { SettlementWorker } from './settlement.worker';
import { ReconciliationService } from './reconciliation.service';
import { LedgerService } from '../../../services/ledger/ledger.service';
import { TruthLogService } from '../../../services/ledger/truth-log.service';
import { StripeFboService } from '../../../services/escrow/stripe.service';

@Module({
  imports: [
    forwardRef(() => ContractsModule), 
    NotificationsModule, 
    forwardRef(() => ComplianceModule),
  ],
  controllers: [PaymentsController],
  providers: [
    PaymentRouterService,
    StripeFBOService,
    StripeFboService,
    StripePayoutProvider,
    SettlementService,
    SettlementWorker,
    ReconciliationService,
    LedgerService,
    TruthLogService,
  ],
  exports: [PaymentRouterService, StripeFBOService, StripeFboService, SettlementService, ReconciliationService],
})
export class PaymentsModule {}
