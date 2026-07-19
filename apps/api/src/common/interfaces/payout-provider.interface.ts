export enum PayoutStatus {
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
}

export interface PayoutResult {
  status: PayoutStatus;
  providerTransactionId?: string;
  error?: string;
  rawResponse?: any;
}

export interface PayoutProvider {
  /**
   * Release funds from escrow back to the user (Pass outcome).
   */
  releaseFunds(paymentIntentId: string, amountCents: number, metadata?: Record<string, any>): Promise<PayoutResult>;

  /**
   * Capture funds from escrow to system revenue (Fail outcome).
   */
  captureFunds(paymentIntentId: string, amountCents: number, metadata?: Record<string, any>): Promise<PayoutResult>;

  /**
   * Check the status of a transaction.
   */
  getTransactionStatus(providerTransactionId: string): Promise<PayoutStatus>;
}
