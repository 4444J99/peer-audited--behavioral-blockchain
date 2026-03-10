import { Controller, Get, Post, Req, Res, Logger, RawBodyRequest, OnModuleInit, UseGuards, Param, Body, BadRequestException, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiExcludeEndpoint, ApiBearerAuth } from '@nestjs/swagger';
import { Pool } from 'pg';
import { Request, Response } from 'express';
import Stripe from 'stripe';
import { ContractsService } from '../contracts/contracts.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CompliancePolicyService } from '../compliance/compliance-policy.service';
import { SettlementService } from './settlement.service';
import { ReconciliationService } from './reconciliation.service';
import { Public } from '../../common/decorators/current-user.decorator';
import { AuthGuard } from '../../../guards/auth.guard';
import { JurisdictionDispositionMapper } from '../compliance/jurisdiction-disposition.mapper';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController implements OnModuleInit {
  private readonly logger = new Logger(PaymentsController.name);
  private readonly stripe: Stripe;
  private readonly webhookSecret: string;

  constructor(
    private readonly pool: Pool,
    private readonly contractsService: ContractsService,
    private readonly notifications: NotificationsService,
    private readonly compliancePolicy: CompliancePolicyService,
    private readonly settlementService: SettlementService,
    private readonly reconciliationService: ReconciliationService,
  ) {
    const apiKey = process.env.STRIPE_SECRET_KEY || 'sk_test_mock_key'; // allow-secret
    this.stripe = new Stripe(apiKey, { apiVersion: '2023-10-16' });
    this.webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || ''; // allow-secret
  }

  onModuleInit() {
    // Keep the API up even when webhook configuration is absent; the webhook
    // endpoint will reject requests until the secret is configured.
    if (process.env.NODE_ENV === 'production' && !this.webhookSecret) {
      this.logger.warn('STRIPE_WEBHOOK_SECRET is unset; Stripe webhook handling is disabled.');
    }
  }

  @Get('disposition-policy/effective')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get the effective payout disposition policy for the current jurisdiction' })
  async getEffectiveDispositionPolicy(@Req() req: Request) {
    const decision = this.compliancePolicy.evaluateRequestPolicy(req);
    let dispositionMode = 'HOUSE_RETAINED';

    if (decision.state) {
      const policy = await this.compliancePolicy.getJurisdictionPolicy(decision.state);
      if (policy) {
        dispositionMode = policy.dispositionMode;
      }
    }

    return {
      jurisdiction: decision.state,
      tier: decision.tier,
      dispositionMode,
      legalBasisRef: dispositionMode === 'REFUND_ONLY' ? 'REGULATORY_RESTRICTION' : 'STANDARD_TERMS',
    };
  }

  @Get('settlement/:contractId/preview')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Preview the financial breakdown of a contract settlement' })
  async previewSettlement(@Param('contractId') contractId: string) {
    return this.settlementService.getSettlementPreview(contractId);
  }

  @Get('settlement/:contractId/status')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get the status of all settlement runs and ledger entries for a contract' })
  async getSettlementStatus(@Param('contractId') contractId: string) {
    return this.settlementService.getSettlementStatus(contractId);
  }

  @Get('reconcile/:contractId')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verify that real-money rails and double-entry ledger are balanced for a contract' })
  async reconcile(@Param('contractId') contractId: string) {
    return this.reconciliationService.reconcileContract(contractId);
  }

  @Get('custody-report')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generate a custody review report for legal counsel' })
  async getCustodyReport(
    @Query('start') start?: string,
    @Query('end') end?: string
  ) {
    const startDate = start ? new Date(start) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = end ? new Date(end) : new Date();
    return this.reconciliationService.generateCustodyReport(startDate, endDate);
  }

  @Post('settlement/:contractId/execute')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Manually trigger settlement dispatch for a resolved contract (Admin/Internal only)' })
  async executeSettlement(
    @Param('contractId') contractId: string,
    @Body() body: { force?: boolean; outcome?: 'PASS' | 'FAIL' }
  ) {
    const contract = await this.contractsService.getContract(contractId);
    if (contract.status !== 'COMPLETED' && contract.status !== 'FAILED' && !body.force) {
      throw new BadRequestException('Contract must be in a resolved state to execute settlement');
    }
    if (body.force && contract.status !== 'COMPLETED' && contract.status !== 'FAILED' && !body.outcome) {
      throw new BadRequestException('Forced settlement on unresolved contracts requires an explicit outcome');
    }

    const settlementOutcome =
      contract.status === 'COMPLETED'
        ? 'PASS'
        : contract.status === 'FAILED'
          ? 'FAIL'
          : body.outcome!;

    let dispositionMode: 'CAPTURE' | 'REFUND' | undefined;
    if (settlementOutcome === 'FAIL') {
      const userResult = await this.pool.query(
        'SELECT last_known_state FROM users WHERE id = $1',
        [(contract as any).user_id],
      );
      const lastKnownState = userResult.rows[0]?.last_known_state ?? null;
      const jurisdictionPolicy = lastKnownState
        ? await this.compliancePolicy.getJurisdictionPolicy(lastKnownState)
        : null;
      
      dispositionMode = JurisdictionDispositionMapper.getDispositionMode(jurisdictionPolicy?.tier);
    }

    // This manually enqueues the job that is normally enqueued by ContractsService.resolveContract
    await this.settlementService.dispatchSettlement({
      contractId,
      outcome: settlementOutcome,
      paymentIntentId: (contract as any).payment_intent_id,
      amountCents: Math.round(Number((contract as any).stake_amount) * 100),
      dispositionMode,
    });

    return { message: 'Settlement job dispatched' };
  }

  @Post('webhook')
  @ApiOperation({ summary: 'Handle Stripe webhook events (payment, dispute)' })
  @ApiExcludeEndpoint()
  @Public()
  async handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Res() res: Response,
  ) {
    const sig = req.headers['stripe-signature'];

    if (!this.webhookSecret) {
      this.logger.error('Stripe webhook invoked before STRIPE_WEBHOOK_SECRET was configured');
      return res.status(503).json({ error: 'Webhook unavailable' });
    }

    if (!sig) {
      this.logger.warn('Stripe webhook received without signature');
      return res.status(400).json({ error: 'Missing signature' });
    }

    let event: Stripe.Event;
    try {
      event = this.stripe.webhooks.constructEvent(
        req.rawBody!,
        sig as string,
        this.webhookSecret,
      );
    } catch (err: any) {
      this.logger.error(`Webhook signature verification failed: ${err.message}`);
      return res.status(400).json({ error: 'Invalid signature' });
    }

    // Idempotency (race-safe): insert and process only if this request won the insert.
    const inserted = await this.pool.query(
      'INSERT INTO stripe_events (event_id, event_type) VALUES ($1, $2) ON CONFLICT (event_id) DO NOTHING RETURNING event_id',
      [event.id, event.type],
    );
    if (inserted.rows.length === 0) {
      this.logger.debug(`Duplicate Stripe event ${event.id}, skipping`);
      return res.json({ received: true, duplicate: true });
    }

    try {
      switch (event.type) {
      case 'payment_intent.succeeded': {
        const pi = event.data.object as Stripe.PaymentIntent;
        const contractId = pi.metadata?.contractId;
        if (contractId) {
          this.logger.log(`Payment succeeded for contract ${contractId}`);
        }
        break;
      }

      case 'payment_intent.payment_failed': {
        const pi = event.data.object as Stripe.PaymentIntent;
        const contractId = pi.metadata?.contractId;
        if (contractId) {
          this.logger.warn(`Payment failed for contract ${contractId}`);
          await this.pool.query(
            `UPDATE contracts SET status = 'PAYMENT_FAILED' WHERE id = $1 AND payment_intent_id = $2`,
            [contractId, pi.id],
          );

          // Notify the user
          const contract = await this.pool.query(
            `SELECT user_id FROM contracts WHERE id = $1`,
            [contractId],
          );
          if (contract.rows.length > 0) {
            await this.notifications.create({
              userId: contract.rows[0].user_id,
              type: 'PAYMENT_FAILED',
              title: 'Payment Failed',
              body: 'Your payment could not be processed. Please update your payment method.',
              metadata: { contractId },
            });
          }
        }
        break;
      }

      case 'charge.dispute.created': {
        const dispute = event.data.object as Stripe.Dispute;
        const piId = typeof dispute.payment_intent === 'string'
          ? dispute.payment_intent
          : (dispute.payment_intent as any)?.id;

        if (piId) {
          const contract = await this.pool.query(
            `SELECT id, user_id FROM contracts WHERE payment_intent_id = $1`,
            [piId],
          );
          if (contract.rows.length > 0) {
            this.logger.warn(`Dispute created for contract ${contract.rows[0].id}`);
            await this.pool.query(
              `UPDATE contracts SET status = 'DISPUTED' WHERE id = $1`,
              [contract.rows[0].id],
            );
            await this.notifications.create({
              userId: contract.rows[0].user_id,
              type: 'CHARGE_DISPUTED',
              title: 'Payment Disputed',
              body: 'A dispute has been filed on your contract. An admin will review.',
              metadata: { contractId: contract.rows[0].id },
            });
          }
        }
        break;
      }

        default:
          this.logger.debug(`Unhandled Stripe event: ${event.type}`);
      }
    } catch (err: any) {
      // Allow Stripe to retry if processing failed after we inserted the dedup row.
      await this.pool.query('DELETE FROM stripe_events WHERE event_id = $1', [event.id]);
      this.logger.error(`Stripe webhook processing failed for ${event.id}: ${err.message}`);
      return res.status(500).json({ error: 'Webhook processing failed' });
    }

    return res.json({ received: true });
  }
}
