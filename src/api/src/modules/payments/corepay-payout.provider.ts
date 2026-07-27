import { Injectable, Logger } from '@nestjs/common';
import { PayoutProvider, PayoutResult, PayoutStatus } from '../../common/interfaces/payout-provider.interface';

@Injectable()
export class CorepayPayoutProvider implements PayoutProvider {
  private readonly logger = new Logger(CorepayPayoutProvider.name);

  async releaseFunds(paymentIntentId: string, amountCents: number, metadata?: Record<string, any>): Promise<PayoutResult> {
    if (!process.env.COREPAY_API_KEY) {
      this.logger.warn('COREPAY_API_KEY not set — using dev fallback (no-op release)');
      return {
        status: PayoutStatus.SUCCESS,
        providerTransactionId: `cp_dev_release_${paymentIntentId}`,
      };
    }

    try {
      const response = await fetch(`${this.getBaseUrl()}/transactions/${paymentIntentId}/release`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ amount: amountCents, currency: 'USD', metadata }),
      });

      return this.handleResponse(response, 'release');
    } catch (err: any) {
      this.logger.error(`Corepay release failed: ${err.message}`);
      return { status: PayoutStatus.FAILED, error: err.message };
    }
  }

  async captureFunds(paymentIntentId: string, amountCents: number, metadata?: Record<string, any>): Promise<PayoutResult> {
    if (!process.env.COREPAY_API_KEY) {
      this.logger.warn('COREPAY_API_KEY not set — using dev fallback (no-op capture)');
      return {
        status: PayoutStatus.SUCCESS,
        providerTransactionId: `cp_dev_capture_${paymentIntentId}`,
      };
    }

    try {
      const response = await fetch(`${this.getBaseUrl()}/transactions/${paymentIntentId}/capture`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ amount: amountCents, currency: 'USD', metadata }),
      });

      return this.handleResponse(response, 'capture');
    } catch (err: any) {
      this.logger.error(`Corepay capture failed: ${err.message}`);
      return { status: PayoutStatus.FAILED, error: err.message };
    }
  }

  async getTransactionStatus(providerTransactionId: string): Promise<PayoutStatus> {
    if (!process.env.COREPAY_API_KEY) {
      return PayoutStatus.SUCCESS;
    }

    try {
      const response = await fetch(
        `${this.getBaseUrl()}/transactions/${providerTransactionId}`,
        { headers: this.getHeaders() },
      );

      if (!response.ok) return PayoutStatus.FAILED;

      const data = await response.json() as { status?: string };
      switch (data.status) {
        case 'COMPLETED':
        case 'SETTLED':
          return PayoutStatus.SUCCESS;
        case 'PENDING':
        case 'PROCESSING':
          return PayoutStatus.PENDING;
        default:
          return PayoutStatus.FAILED;
      }
    } catch {
      return PayoutStatus.FAILED;
    }
  }

  private getBaseUrl(): string {
    return process.env.COREPAY_API_URL || 'https://api.corepay.com/v1';
  }

  private getHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.COREPAY_API_KEY || ''}`,
    };
  }

  private async handleResponse(response: Response, action: string): Promise<PayoutResult> {
    if (!response.ok) {
      const text = await response.text();
      this.logger.error(`Corepay ${action} failed: HTTP ${response.status} — ${text}`);
      return { status: PayoutStatus.FAILED, error: `HTTP ${response.status}: ${text}` };
    }

    const data = await response.json() as { transactionId?: string };
    return {
      status: PayoutStatus.SUCCESS,
      providerTransactionId: data.transactionId,
      rawResponse: data,
    };
  }
}
