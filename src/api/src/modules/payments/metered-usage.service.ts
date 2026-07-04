import { Injectable, Logger } from "@nestjs/common";
import { Pool } from "pg";
import { BillingService, MeteredEventType } from "../b2b/billing.service";

@Injectable()
export class MeteredUsageService {
  private readonly logger = new Logger(MeteredUsageService.name);

  constructor(
    private readonly pool: Pool,
    private readonly billing: BillingService,
  ) {}

  async recordMeteredUsage(
    userId: string,
    eventType: MeteredEventType,
    eventId?: string,
    quantity: number = 1,
  ): Promise<void> {
    const enterpriseId = await this.resolveEnterpriseId(userId);
    const { rowCount } = await this.pool.query(
      `INSERT INTO usage_event (user_id, enterprise_id, event_type, quantity, idempotency_key)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (idempotency_key) DO NOTHING`,
      [userId, enterpriseId, eventType, quantity, eventId ?? null],
    );
    const inserted = (rowCount ?? 0) > 0;

    if (!inserted && eventId) {
      this.logger.debug(
        `Duplicate metered usage [${eventType}] for user ${userId} (eventId=${eventId}); skipping re-bill.`,
      );
      return;
    }

    this.logger.log(
      `Recorded metered usage [${eventType}] x${quantity} for user ${userId}` +
        (enterpriseId
          ? ` (enterprise ${enterpriseId})`
          : " (no enterprise; unattributed)"),
    );

    if (!enterpriseId) return;

    try {
      await this.billing.recordUsage(
        enterpriseId,
        eventType,
        quantity,
        eventId,
      );
    } catch (err) {
      this.logger.error(
        `Failed to forward metered usage [${eventType}] for enterprise ${enterpriseId} to Stripe: ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
    }
  }

  private async resolveEnterpriseId(userId: string): Promise<string | null> {
    const { rows } = await this.pool.query(
      "SELECT enterprise_id FROM users WHERE id = $1",
      [userId],
    );
    return rows[0]?.enterprise_id ?? null;
  }
}
