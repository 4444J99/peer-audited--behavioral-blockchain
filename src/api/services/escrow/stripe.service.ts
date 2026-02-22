import { Injectable } from '@nestjs/common';
import Stripe from 'stripe';

@Injectable()
export class StripeFboService {
  private stripe: Stripe;

  constructor() {
    // Note: In production, this key must be injected via ConfigService/env.
    const apiKey = process.env.STRIPE_SECRET_KEY || 'sk_test_mock_key'; // allow-secret
    this.stripe = new Stripe(apiKey, {
      apiVersion: '2023-10-16', // Match closest valid API version for expected types
    });
  }

  /**
   * Creates a Stripe customer for a user to attach payment methods.
   */
  async createCustomer(userId: string, email?: string): Promise<string> {
    const customer = await this.stripe.customers.create({
      metadata: { styxUserId: userId },
      email,
    });
    return customer.id;
  }

  /**
   * Initiates a hold on a user's card for a behavioral contract (7-day standard auth limit).
   * Does NOT capture funds immediately.
   */
  async holdStake(customerId: string, amountDollars: number, contractId: string): Promise<Stripe.PaymentIntent> {
    const intent = await this.stripe.paymentIntents.create({
      amount: Math.round(amountDollars * 100), // Convert to cents
      currency: 'usd',
      customer: customerId,
      capture_method: 'manual', // Critcal: Authorized only, not captured
      metadata: { contractId },
    });
    return intent;
  }

  /**
   * Captures the held funds if the user fails the contract oath.
   */
  async captureStake(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
    const intent = await this.stripe.paymentIntents.capture(paymentIntentId);
    return intent;
  }

  /**
   * Cancels the hold and releases funds back to the user if they succeed.
   */
  async cancelHold(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
    const intent = await this.stripe.paymentIntents.cancel(paymentIntentId);
    return intent;
  }
}
