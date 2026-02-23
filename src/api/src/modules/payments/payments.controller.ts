import { Controller, Post, Req, Res, Logger, RawBodyRequest } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiExcludeEndpoint } from '@nestjs/swagger';
import { Pool } from 'pg';
import { Request, Response } from 'express';
import Stripe from 'stripe';
import { ContractsService } from '../contracts/contracts.service';
import { NotificationsService } from '../notifications/notifications.service';
import { Public } from '../../common/decorators/current-user.decorator';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  private readonly logger = new Logger(PaymentsController.name);
  private readonly stripe: Stripe;
  private readonly webhookSecret: string;

  constructor(
    private readonly pool: Pool,
    private readonly contractsService: ContractsService,
    private readonly notifications: NotificationsService,
  ) {
    const apiKey = process.env.STRIPE_SECRET_KEY || 'sk_test_mock_key'; // allow-secret
    this.stripe = new Stripe(apiKey, { apiVersion: '2023-10-16' });
    this.webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || ''; // allow-secret
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

    if (!sig || !this.webhookSecret) {
      this.logger.warn('Stripe webhook received without signature or secret');
      return res.status(400).json({ error: 'Missing signature' });
    }

    let event: Stripe.Event;
    try {
      event = this.stripe.webhooks.constructEvent(
        req.rawBody!,
        sig,
        this.webhookSecret,
      );
    } catch (err) {
      this.logger.error(`Webhook signature verification failed: ${err instanceof Error ? err.message : err}`);
      return res.status(400).json({ error: 'Invalid signature' });
    }

    switch (event.type) {
      case 'payment_intent.succeeded': {
        const pi = event.data.object as Stripe.PaymentIntent;
        const contractId = pi.metadata?.contractId;
        if (contractId) {
          this.logger.log(`Payment succeeded for contract ${contractId}`);
          // Contract activation confirmed — no additional action needed since
          // contracts are created as ACTIVE with a hold. This confirms capture.
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
          : dispute.payment_intent?.id;

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

    return res.json({ received: true });
  }
}
