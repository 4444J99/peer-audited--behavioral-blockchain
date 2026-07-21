import { Injectable } from '@nestjs/common';
import { Pool } from 'pg';

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
  ): Promise<void> {
    await this.pool.query(
      `INSERT INTO push_deliveries
        (push_token_id, user_id, notification_type, title, body, payload, provider, status, provider_result, error_message, delivered_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CASE WHEN $8 IN ('SENT', 'UNREGISTERED') THEN NOW() ELSE NULL END)`,
      [
        pushTokenId, userId, notificationType, title, body,
        payload ? JSON.stringify(payload) : null,
        provider, status, providerResult ?? null, errorMessage ?? null,
      ],
    );
  }
}
