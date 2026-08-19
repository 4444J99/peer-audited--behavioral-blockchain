import { Injectable } from '@nestjs/common';
import { Pool } from 'pg';

export interface PendingReceiptDelivery {
  id: string;
  push_token_id: string | null;
  user_id: string;
  provider_ticket_id: string;
  receipt_attempts: number;
}

@Injectable()
export class PushTokensService {
  constructor(private readonly pool: Pool) {}

  async registerToken(
    userId: string,
    token: string,
    platform: string,
    deviceIdentifier?: string,
  ): Promise<void> {
    // Deactivate any existing token for this device
    await this.pool.query(
      `UPDATE push_tokens
       SET is_active = FALSE
       WHERE user_id = $1 AND token = $2`,
      [userId, token],
    );

    // Upsert the token
    await this.pool.query(
      `INSERT INTO push_tokens (user_id, platform, token, device_identifier, is_active, last_seen_at)
       VALUES ($1, $2, $3, $4, TRUE, NOW())
       ON CONFLICT (token)
       DO UPDATE SET
         user_id = EXCLUDED.user_id,
         platform = EXCLUDED.platform,
         device_identifier = COALESCE(EXCLUDED.device_identifier, push_tokens.device_identifier),
         is_active = TRUE,
         last_seen_at = NOW()`,
      [userId, platform, token, deviceIdentifier ?? null],
    );
  }

  async unregisterToken(userId: string, token: string): Promise<void> {
    await this.pool.query(
      `UPDATE push_tokens
       SET is_active = FALSE
       WHERE user_id = $1 AND token = $2`,
      [userId, token],
    );
  }

  async getActiveTokens(userId: string): Promise<Array<{
    id: string;
    token: string;
    platform: string;
  }>> {
    const result = await this.pool.query(
      `SELECT id, token, platform
       FROM push_tokens
       WHERE user_id = $1 AND is_active = TRUE
       ORDER BY last_seen_at DESC`,
      [userId],
    );
    return result.rows;
  }

  async markDelivery(
    pushTokenId: string,
    userId: string,
    notificationType: string,
    title: string,
    body: string | null,
    payload: Record<string, unknown> | null,
    provider: string,
    status: string,
    providerResult?: string,
    errorMessage?: string,
    ticketId?: string,
  ): Promise<void> {
    // A ticket id is what makes this row resolvable in phase two, so it is also
    // the only thing that puts the row into the receipt sweep's target set.
    await this.pool.query(
      `INSERT INTO push_deliveries
        (push_token_id, user_id, notification_type, title, body, payload, provider, status, provider_result, error_message, provider_ticket_id, receipt_status, delivered_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, CASE WHEN $11 IS NULL THEN NULL ELSE 'PENDING' END, CASE WHEN $8 IN ('SENT', 'UNREGISTERED') THEN NOW() ELSE NULL END)`,
      [
        pushTokenId, userId, notificationType, title, body,
        payload ? JSON.stringify(payload) : null,
        provider, status, providerResult ?? null, errorMessage ?? null,
        ticketId ?? null,
      ],
    );
  }

  /**
   * Tickets still awaiting a verdict, oldest first.
   *
   * `minAgeSeconds` keeps the sweep from asking about a ticket Expo has not had
   * time to resolve — a too-early poll just returns nothing and burns an
   * attempt against the ceiling.
   */
  async getDeliveriesAwaitingReceipt(
    limit: number,
    minAgeSeconds: number,
  ): Promise<PendingReceiptDelivery[]> {
    const result = await this.pool.query(
      `SELECT id, push_token_id, user_id, provider_ticket_id, receipt_attempts
       FROM push_deliveries
       WHERE receipt_status = 'PENDING'
         AND provider_ticket_id IS NOT NULL
         AND created_at < NOW() - ($2 * INTERVAL '1 second')
       ORDER BY created_at ASC
       LIMIT $1`,
      [limit, minAgeSeconds],
    );
    return result.rows.map((row: PendingReceiptDelivery) => ({
      ...row,
      receipt_attempts: Number(row.receipt_attempts),
    }));
  }

  /**
   * Record a resolved receipt. `deliveryStatus` restates the delivery's own
   * outcome because a row that read 'SENT' on its ticket may be a failure once
   * the receipt lands — that correction is the whole point of phase two.
   */
  async recordReceiptOutcome(
    deliveryId: string,
    receiptStatus: 'OK' | 'ERROR',
    deliveryStatus: string,
    errorCode?: string,
    errorMessage?: string,
  ): Promise<void> {
    await this.pool.query(
      `UPDATE push_deliveries
       SET receipt_status = $2,
           receipt_error_code = $3,
           receipt_checked_at = NOW(),
           receipt_attempts = receipt_attempts + 1,
           status = $4,
           error_message = COALESCE($5, error_message)
       WHERE id = $1`,
      [deliveryId, receiptStatus, errorCode ?? null, deliveryStatus, errorMessage ?? null],
    );
  }

  /**
   * No receipt this round. Under the ceiling the row stays PENDING for a later
   * sweep; at the ceiling it becomes UNAVAILABLE, because Expo drops receipts
   * after roughly a day and a ticket that old will never resolve.
   */
  async markReceiptUnresolved(deliveryId: string, giveUp: boolean): Promise<void> {
    await this.pool.query(
      `UPDATE push_deliveries
       SET receipt_attempts = receipt_attempts + 1,
           receipt_checked_at = NOW(),
           receipt_status = CASE WHEN $2 THEN 'UNAVAILABLE' ELSE receipt_status END
       WHERE id = $1`,
      [deliveryId, giveUp],
    );
  }

  /**
   * Deactivate by push_tokens id — the receipt path knows which delivery row it
   * is resolving, not the raw token string that {@link unregisterToken} takes.
   */
  async deactivateTokenById(pushTokenId: string): Promise<void> {
    await this.pool.query(
      `UPDATE push_tokens
       SET is_active = FALSE
       WHERE id = $1`,
      [pushTokenId],
    );
  }
}
