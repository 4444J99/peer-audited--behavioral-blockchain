import { Injectable, Logger } from "@nestjs/common";
import { Pool } from "pg";

export interface EnterpriseScope {
  id: string;
  enterpriseId: string;
  scopeKey: string;
  limitValue: number;
  currentUsage: number;
  resetPeriod: string;
}

export interface EnterpriseSeat {
  id: string;
  enterpriseId: string;
  userId: string | null;
  seatType: string;
  active: boolean;
}

@Injectable()
export class EnterpriseScopeService {
  private readonly logger = new Logger(EnterpriseScopeService.name);

  constructor(private readonly pool: Pool) {}

  async getScopes(enterpriseId: string): Promise<EnterpriseScope[]> {
    const { rows } = await this.pool.query(
      "SELECT * FROM enterprise_scopes WHERE enterprise_id = $1",
      [enterpriseId],
    );
    return rows.map((r: any) => ({
      id: r.id,
      enterpriseId: r.enterprise_id,
      scopeKey: r.scope_key,
      limitValue: r.limit_value,
      currentUsage: r.current_usage,
      resetPeriod: r.reset_period,
    }));
  }

  async checkScopeLimit(
    enterpriseId: string,
    scopeKey: string,
  ): Promise<{ allowed: boolean; remaining: number }> {
    const {
      rows: [scope],
    } = await this.pool.query(
      "SELECT limit_value, current_usage FROM enterprise_scopes WHERE enterprise_id = $1 AND scope_key = $2",
      [enterpriseId, scopeKey],
    );
    if (!scope) return { allowed: true, remaining: Infinity };
    const remaining = scope.limit_value - scope.current_usage;
    return { allowed: remaining > 0, remaining };
  }

  async recordUsage(
    enterpriseId: string,
    scopeKey: string,
    amount: number = 1,
  ): Promise<void> {
    await this.pool.query(
      `INSERT INTO enterprise_scopes (enterprise_id, scope_key, limit_value, current_usage)
       VALUES ($1, $2, 100, $3)
       ON CONFLICT (enterprise_id, scope_key) DO UPDATE SET current_usage = enterprise_scopes.current_usage + $3, updated_at = NOW()`,
      [enterpriseId, scopeKey, amount],
    );
    this.logger.log(
      `Scope usage: enterprise=${enterpriseId} scope=${scopeKey} amount=${amount}`,
    );
  }

  async getSeats(enterpriseId: string): Promise<EnterpriseSeat[]> {
    const { rows } = await this.pool.query(
      "SELECT * FROM enterprise_seats WHERE enterprise_id = $1",
      [enterpriseId],
    );
    return rows.map((r: any) => ({
      id: r.id,
      enterpriseId: r.enterprise_id,
      userId: r.user_id,
      seatType: r.seat_type,
      active: r.active,
    }));
  }

  async assignSeat(
    enterpriseId: string,
    userId: string,
    seatType: string = "MEMBER",
  ): Promise<EnterpriseSeat> {
    const {
      rows: [seat],
    } = await this.pool.query(
      `INSERT INTO enterprise_seats (enterprise_id, user_id, seat_type)
       VALUES ($1, $2, $3)
       ON CONFLICT (enterprise_id, user_id) DO UPDATE SET active = TRUE, seat_type = $3
       RETURNING *`,
      [enterpriseId, userId, seatType],
    );
    return {
      id: seat.id,
      enterpriseId: seat.enterprise_id,
      userId: seat.user_id,
      seatType: seat.seat_type,
      active: seat.active,
    };
  }
}
