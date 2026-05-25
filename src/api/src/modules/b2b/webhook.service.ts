import { Injectable, Logger } from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'crypto';

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;
// Reject signatures whose signed timestamp is older/newer than this skew window
// to defeat replay of captured webhook deliveries.
const MAX_TIMESTAMP_SKEW_SECONDS = 5 * 60;

function requireWebhookSecret(): string {
  const secret = process.env.STYX_WEBHOOK_SECRET; // allow-secret
  if (!secret) {
    throw new Error('STYX_WEBHOOK_SECRET must be set');
  }
  return secret;
}

export interface WebhookDeliveryResult {
  success: boolean;
  attempts: number;
  statusCode?: number;
  error?: string;
}

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);
  // Resolved lazily (not in a field initializer) so a missing STYX_WEBHOOK_SECRET
  // fails webhook signing/verification at use-time rather than crashing app boot.
  private get webhookSecret(): string {
    return requireWebhookSecret(); // allow-secret
  }

  /**
   * Pushes anonymized behavioral velocity changes to an enterprise CRM endpoint.
   * Signs the payload with HMAC-SHA256 and retries with exponential backoff.
   */
  async dispatchEnterpriseMetricEvent(
    webhookUrl: string,
    payload: Record<string, unknown>,
  ): Promise<boolean> {
    const result = await this.deliverWithRetry(webhookUrl, payload);
    if (!result.success) {
      this.logger.error(
        `Webhook delivery failed after ${result.attempts} attempts to [${webhookUrl}]: ${result.error}`,
      );
    }
    return result.success;
  }

  async deliverWithRetry(
    url: string,
    payload: Record<string, unknown>,
  ): Promise<WebhookDeliveryResult> {
    this.assertSafeWebhookUrl(url);

    const body = JSON.stringify(payload);
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const signature = this.sign(timestamp, body);

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Styx-Signature': signature,
            'X-Styx-Timestamp': timestamp,
          },
          body,
          signal: AbortSignal.timeout(10_000),
        });

        if (response.ok) {
          this.logger.log(
            `Webhook delivered to [${url}] on attempt ${attempt} (${response.status})`,
          );
          return { success: true, attempts: attempt, statusCode: response.status };
        }

        // Non-retryable client errors (4xx except 429)
        if (response.status >= 400 && response.status < 500 && response.status !== 429) {
          return {
            success: false,
            attempts: attempt,
            statusCode: response.status,
            error: `HTTP ${response.status}`,
          };
        }

        this.logger.warn(
          `Webhook attempt ${attempt}/${MAX_RETRIES} to [${url}] failed: HTTP ${response.status}`,
        );
      } catch (error: any) {
        this.logger.warn(
          `Webhook attempt ${attempt}/${MAX_RETRIES} to [${url}] error: ${error.message}`,
        );
        if (attempt === MAX_RETRIES) {
          return { success: false, attempts: attempt, error: error.message };
        }
      }

      // Exponential backoff before retry
      if (attempt < MAX_RETRIES) {
        await this.delay(BASE_DELAY_MS * Math.pow(2, attempt - 1));
      }
    }

    return { success: false, attempts: MAX_RETRIES, error: 'Max retries exhausted' };
  }

  /**
   * Generate HMAC-SHA256 signature: sign(timestamp + "." + body)
   */
  sign(timestamp: string, body: string): string {
    const message = `${timestamp}.${body}`;
    return createHmac('sha256', this.webhookSecret).update(message).digest('hex');
  }

  /**
   * Verify an incoming webhook signature (for consumers to validate).
   * Rejects stale/replayed deliveries outside the allowed timestamp skew and
   * compares the HMAC in constant time.
   */
  verify(timestamp: string, body: string, signature: string): boolean {
    // Reject deliveries whose signed timestamp is too far from now (replay guard).
    const ts = Number(timestamp);
    if (!Number.isFinite(ts)) {
      return false;
    }
    const nowSeconds = Math.floor(Date.now() / 1000);
    if (Math.abs(nowSeconds - ts) > MAX_TIMESTAMP_SKEW_SECONDS) {
      return false;
    }

    const expected = this.sign(timestamp, body);
    const expectedBuf = Buffer.from(expected);
    const providedBuf = Buffer.from(signature);
    // timingSafeEqual requires equal-length buffers.
    if (expectedBuf.length !== providedBuf.length) {
      return false;
    }
    return timingSafeEqual(expectedBuf, providedBuf);
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private assertSafeWebhookUrl(rawUrl: string): void {
    let parsed: URL;
    try {
      parsed = new URL(rawUrl);
    } catch {
      throw new Error('Invalid webhook URL');
    }

    if (!['https:', 'http:'].includes(parsed.protocol)) {
      throw new Error('Webhook URL protocol must be http or https');
    }

    if (parsed.username || parsed.password) {
      throw new Error('Webhook URL must not include credentials');
    }

    const host = parsed.hostname.toLowerCase();
    if (this.isLocalOrPrivateHost(host)) {
      throw new Error('Webhook URL must not target localhost or private network addresses');
    }
  }

  private isLocalOrPrivateHost(hostname: string): boolean {
    if (
      hostname === 'localhost' ||
      hostname === '0.0.0.0' ||
      hostname === '::1' ||
      hostname.endsWith('.local')
    ) {
      return true;
    }

    if (/^127\./.test(hostname)) return true;
    if (/^10\./.test(hostname)) return true;
    if (/^192\.168\./.test(hostname)) return true;
    if (/^169\.254\./.test(hostname)) return true;
    if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(hostname)) return true;

    // Common IPv6 local ranges
    if (hostname.startsWith('fc') || hostname.startsWith('fd') || hostname.startsWith('fe80:')) {
      return true;
    }

    return false;
  }
}
