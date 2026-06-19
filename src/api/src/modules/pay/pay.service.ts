import { ForbiddenException, Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import { BillingService } from '../b2b/billing.service';
import {
  MONTHLY_SUBSCRIPTION_PRICE,
  TICKET_PRICE_BASE,
  processIAP,
} from '../../../services/billing';
import { StripeFboService } from '../../../services/escrow/stripe.service';
import { LedgerService } from '../../../services/ledger/ledger.service';
import { TruthLogService } from '../../../services/ledger/truth-log.service';
import { RecordMeteredUsageDto } from './dto';

export interface PayPriceList {
  currency: 'USD';
  monthlySubscriptionCents: number;
  ticketPriceCents: number;
}

@Injectable()
export class PayService {
  constructor(
    private readonly pool: Pool,
    private readonly stripe: StripeFboService,
    private readonly ledger: LedgerService,
    private readonly truthLog: TruthLogService,
    private readonly billing: BillingService,
  ) {}

  getPrices(): PayPriceList {
    return {
      currency: 'USD',
      monthlySubscriptionCents: MONTHLY_SUBSCRIPTION_PRICE,
      ticketPriceCents: TICKET_PRICE_BASE,
    };
  }

  purchaseTicket(userId: string, contractId: string) {
    return processIAP(
      this.pool,
      this.stripe,
      this.ledger,
      this.truthLog,
      userId,
      contractId,
    );
  }

  async recordMeteredUsage(userId: string, dto: RecordMeteredUsageDto) {
    await this.assertEnterpriseAdmin(userId, dto.enterpriseId);
    const quantity = dto.quantity ?? 1;

    await this.billing.recordUsage(
      dto.enterpriseId,
      dto.metric,
      quantity,
      dto.eventId,
    );

    return {
      status: 'recorded',
      enterpriseId: dto.enterpriseId,
      metric: dto.metric,
      quantity,
    };
  }

  async getMeteredUsageSummary(userId: string, enterpriseId: string) {
    await this.assertEnterpriseAdmin(userId, enterpriseId);
    return this.billing.getUsageSummary(enterpriseId);
  }

  private async assertEnterpriseAdmin(userId: string, enterpriseId: string): Promise<void> {
    if (!enterpriseId) {
      throw new ForbiddenException('enterpriseId is required');
    }

    const result = await this.pool.query(
      'SELECT enterprise_id, role FROM users WHERE id = $1',
      [userId],
    );

    if (result.rows.length === 0) {
      throw new ForbiddenException('User not found');
    }

    const { enterprise_id: callerEnterpriseId, role } = result.rows[0];
    if (!callerEnterpriseId || callerEnterpriseId !== enterpriseId) {
      throw new ForbiddenException('Not authorized for this enterprise');
    }
    if (String(role || '').toUpperCase() !== 'ADMIN') {
      throw new ForbiddenException('Enterprise admin role required');
    }
  }
}
