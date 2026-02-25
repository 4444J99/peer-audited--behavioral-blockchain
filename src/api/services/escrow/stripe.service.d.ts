import Stripe from 'stripe';
export declare class StripeFboService {
    private readonly logger;
    private stripe;
    constructor();
    private get isDevMode();
    createCustomer(userId: string, email?: string): Promise<string>;
    holdStake(customerId: string, amountDollars: number, contractId: string): Promise<Stripe.PaymentIntent>;
    captureStake(paymentIntentId: string): Promise<Stripe.PaymentIntent>;
    cancelHold(paymentIntentId: string): Promise<Stripe.PaymentIntent>;
}
