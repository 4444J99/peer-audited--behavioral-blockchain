import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import Stripe from 'stripe';

@Injectable()
export class StripeFboService {
  private readonly logger = new Logger(StripeFboService.name);
  private stripe: Stripe;

  constructor() {
    const apiKey = process.env.STRIPE_SECRET_KEY || 'sk_test_mock_key'; // allow-secret
    const isProduction = process.env.NODE_ENV === 'production';

    if (isProduction && (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY === 'sk_test_mock_key')) {
      throw new Error(
        'FATAL: STRIPE_SECRET_KEY is required in production. ' +
        'Set a valid Stripe secret key to prevent mock mode in production.'
      );
    }

    this.stripe = new Stripe(apiKey, {
      apiVersion: '2023-10-16',
    });
  }

  private get isDevMode(): boolean {
    const key = process.env.STRIPE_SECRET_KEY;
    return !key || key === 'sk_test_mock_key';
  }

  async createCustomer(userId: string, email?: string): Promise<string> {
    if (this.isDevMode) {
      const id = `cus_dev_${randomUUID().slice(0, 8)}`;
      this.logger.debug(`[DEV] Created mock customer ${id}`);
      return id;
    }
    const customer = await this.stripe.customers.create({
      metadata: { styxUserId: userId },
      email,
    });
    return customer.id;
  }

  async holdStake(customerId: string, amountDollars: number, contractId: string): Promise<Stripe.PaymentIntent> {
    if (this.isDevMode) {
      this.logger.debug(`[DEV] Mock hold $${amountDollars} for contract ${contractId}`);
      return {
        id: `pi_dev_${randomUUID().slice(0, 8)}`,
        status: 'requires_capture',
        amount: Math.round(amountDollars * 100),
        currency: 'usd',
      } as any;
    }
    const intent = await this.stripe.paymentIntents.create({
      amount: Math.round(amountDollars * 100),
      currency: 'usd',
      customer: customerId,
      capture_method: 'manual',
      metadata: { contractId },
    });
    return intent;
  }

  async captureStake(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
    if (this.isDevMode) {
      this.logger.debug(`[DEV] Mock capture ${paymentIntentId}`);
      return { id: paymentIntentId, status: 'succeeded' } as any;
    }
    return this.stripe.paymentIntents.capture(paymentIntentId);
  }

  async cancelHold(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
    if (this.isDevMode) {
      this.logger.debug(`[DEV] Mock cancel ${paymentIntentId}`);
      return { id: paymentIntentId, status: 'canceled' } as any;
    }
    return this.stripe.paymentIntents.cancel(paymentIntentId);
  }
}
