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
import { RoleGuard, Roles } from '../../common/guards/role.guard';
import { JurisdictionDispositionMapper } from '../compliance/jurisdiction-disposition.mapper';
import { toCents } from '../../../../shared/libs/money';

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
  @UseGuards(AuthGuard, RoleGuard)
  @Roles('ADMIN')
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

    // PM11: fundability check. A settlement moves money against an escrow hold; if the contract
    // was never funded (no payment_intent_id) — e.g. a cancelled/unfunded contract — a forced
    // PASS/FAIL would attempt to release/capture non-existent escrow. Refuse rather than dispatch
    // a job that can only fail (or, worse, mis-post the ledger) downstream.
    const paymentIntentId = (contract as any).payment_intent_id;
    if (!paymentIntentId) {
      throw new BadRequestException(
        'Contract has no payment intent on file (unfunded); cannot settle non-existent escrow',
      );
    }

    // PM30: read user_id defensively. If getContract did not surface a snake_case user_id we must
    // NOT run the jurisdiction lookup with `undefined` (which previously defaulted the disposition
    // and could CAPTURE a stake where the user's jurisdiction requires REFUND_ONLY). Fall back to a
    // camelCase alias, and fail CLOSED to REFUND when the user cannot be resolved.
    const userId = (contract as any).user_id ?? (contract as any).userId;

    let dispositionMode: 'CAPTURE' | 'REFUND' | undefined;
    if (settlementOutcome === 'FAIL') {
      if (!userId) {
        this.logger.warn(
          `executeSettlement: contract ${contractId} has no resolvable user_id; defaulting FAIL disposition to REFUND (fail-closed).`,
        );
        dispositionMode = 'REFUND';
      } else {
        const userResult = await this.pool.query(
          'SELECT last_known_state FROM users WHERE id = $1',
          [userId],
        );
        const lastKnownState = userResult.rows[0]?.last_known_state ?? null;
        const jurisdictionPolicy = lastKnownState
          ? await this.compliancePolicy.getJurisdictionPolicy(lastKnownState)
          : null;

        dispositionMode = JurisdictionDispositionMapper.getDispositionMode(jurisdictionPolicy?.tier);
      }
    }

    // This manually enqueues the job that is normally enqueued by ContractsService.resolveContract
    await this.settlementService.dispatchSettlement({
      contractId,
      outcome: settlementOutcome,
      paymentIntentId,
      amountCents: toCents(Number((contract as any).stake_amount)),
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
        // Resolve the contract by the SERVER-STORED payment_intent_id linkage, never by the
        // client-influenceable pi.metadata.contractId alone.
        //
        // PM10: BEFORE activating, verify the PaymentIntent actually paid the staked amount in
        // the expected currency. Previously the handler flipped the contract to ACTIVE on a
        // payment_intent_id match ALONE, so a PI for a smaller amount (or a different currency)
        // would activate the contract as fully funded. We compare amount_received/amount (cents)
        // and currency against the contract's stake. On mismatch we do NOT activate — we leave
        // the contract for reconciliation and log loudly.
        const pending = await this.pool.query(
          `SELECT id, stake_amount FROM contracts
           WHERE payment_intent_id = $1 AND status IN ('PENDING_STAKE', 'PENDING', 'PROCESSING')`,
          [pi.id],
        );
        if (pending.rows.length === 0) {
          this.logger.log(`Payment succeeded for payment_intent ${pi.id} (no pending contract to fund)`);
          break;
        }
        const contractRow = pending.rows[0];
        const expectedCents = toCents(Number(contractRow.stake_amount));
        const paidCents = typeof pi.amount_received === 'number' ? pi.amount_received : pi.amount;
        const currency = (pi.currency || '').toLowerCase();

        if (currency !== 'usd' || paidCents !== expectedCents) {
          this.logger.error(
            `Payment amount/currency mismatch for contract ${contractRow.id} ` +
              `(expected ${expectedCents}¢ usd, got ${paidCents}¢ ${currency}); NOT activating — left for reconciliation.`,
          );
          break;
        }

        const funded = await this.pool.query(
          `UPDATE contracts
           SET status = 'ACTIVE', started_at = COALESCE(started_at, NOW())
           WHERE id = $1 AND status IN ('PENDING_STAKE', 'PENDING', 'PROCESSING')
           RETURNING id`,
          [contractRow.id],
        );
        if (funded.rows.length > 0) {
          this.logger.log(`Payment succeeded; contract ${funded.rows[0].id} marked funded/ACTIVE`);
        }
        break;
      }

      case 'payment_intent.payment_failed': {
        const pi = event.data.object as Stripe.PaymentIntent;
        // Match on the server-stored payment_intent_id rather than trusting metadata.contractId.
        const failed = await this.pool.query(
          `UPDATE contracts SET status = 'PAYMENT_FAILED' WHERE payment_intent_id = $1 RETURNING id, user_id`,
          [pi.id],
        );
        if (failed.rows.length > 0) {
          const { id: contractId, user_id: userId } = failed.rows[0];
          this.logger.warn(`Payment failed for contract ${contractId}`);

          // Notify the user
          await this.notifications.create({
            userId,
            type: 'PAYMENT_FAILED',
            title: 'Payment Failed',
            body: 'Your payment could not be processed. Please update your payment method.',
            metadata: { contractId },
          });
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
            // PM12: guard against reverting a TERMINAL (already-settled) contract back to
            // DISPUTED. The succeeded/failed handlers are status-scoped; this one was not, so a
            // late dispute could re-open a closed financial state. Only move a contract that is
            // still in a live/non-terminal state into DISPUTED.
            const updated = await this.pool.query(
              `UPDATE contracts SET status = 'DISPUTED'
               WHERE id = $1
                 AND status NOT IN ('COMPLETED', 'FAILED', 'SETTLED', 'CANCELLED', 'DISPUTED')
               RETURNING id`,
              [contract.rows[0].id],
            );
            if (updated.rows.length > 0) {
              await this.notifications.create({
                userId: contract.rows[0].user_id,
                type: 'CHARGE_DISPUTED',
                title: 'Payment Disputed',
                body: 'A dispute has been filed on your contract. An admin will review.',
                metadata: { contractId: contract.rows[0].id },
              });
            } else {
              this.logger.warn(
                `Dispute on contract ${contract.rows[0].id} ignored: contract is in a terminal/disputed state.`,
              );
            }
          }
        }
        break;
      }

        default:
          this.logger.debug(`Unhandled Stripe event: ${event.type}`);
      }
    } catch (err: any) {
      // PM13: do NOT delete the dedup row on a processing error. Previously the catch DELETEd the
      // stripe_events row and returned 500, so Stripe's retry re-ran the handlers and re-applied
      // any side effects that had already committed before the throw. Instead we KEEP the row and
      // rely on the handlers being idempotent: every contract mutation above is a status-scoped
      // UPDATE (succeeded activates only PENDING contracts; failed/dispute are state-guarded), so a
      // retry that finds the dedup row will be short-circuited rather than re-committing effects.
      // We still return 500 so Stripe retries — the retry is safely deduped and re-acked.
      this.logger.error(
        `Stripe webhook processing failed for ${event.id}: ${err.message}. ` +
          `Dedup row retained (idempotent handlers); retry will be deduped.`,
      );
      return res.status(500).json({ error: 'Webhook processing failed' });
    }

    return res.json({ received: true });
  }
}
