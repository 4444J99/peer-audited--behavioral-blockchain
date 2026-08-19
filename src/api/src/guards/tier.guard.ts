import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { Pool } from "pg";
import { isTestMoneyModeEnabled } from "../config/runtime";

export enum AccessTier {
  FREE = "free",
  EARLY_ACCESS = "early_access",
  PRO = "pro",
}

const EARLY_ACCESS_MAX_ACTIVE_CONTRACTS = 3;
const EARLY_ACCESS_MAX_ESCROW_USD = 0;
const MVP_39_REFUNDABLE_STAKE_USD = 30;
const EARLY_ACCESS_199_REFUNDABLE_STAKE_USD = 199;

@Injectable()
export class TierGuard implements CanActivate {
  constructor(private readonly pool: Pool) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId = request.user?.id;

    if (!userId) {
      throw new ForbiddenException("Authentication required");
    }

    const userResult = await this.pool.query(
      "SELECT access_tier FROM users WHERE id = $1",
      [userId],
    );

    if (userResult.rows.length === 0) {
      throw new ForbiddenException("User account not found.");
    }

    const accessTier = this.normalizeAccessTier(userResult.rows[0].access_tier);

    if (accessTier === AccessTier.PRO) {
      return true;
    }

    if (accessTier === AccessTier.FREE) {
      throw new ForbiddenException(
        "Contract creation requires early access or pro access.",
      );
    }

    // Issue #905: the escrow ceiling caps an early-access user's REAL-money
    // exposure. On the test-money rail nothing moves outside money, so the
    // ceiling is skipped there (the active-contracts cap below stays
    // unconditional on both rails).
    const requestedEscrowUsd = this.resolveRequestedEscrowUsd(request.body);
    if (
      !isTestMoneyModeEnabled() &&
      requestedEscrowUsd > EARLY_ACCESS_MAX_ESCROW_USD &&
      !this.isEarlyAccessPaidPlan(request.body)
    ) {
      throw new ForbiddenException(
        "Early-access users are limited to $0 escrow contracts unless using an early-access pricing plan.",
      );
    }

    const activeContracts = await this.pool.query(
      `SELECT COUNT(*)::int AS count
       FROM contracts
       WHERE user_id = $1
         AND status = 'ACTIVE'`,
      [userId],
    );
    const activeCount = Number(activeContracts.rows[0]?.count ?? 0);

    if (activeCount >= EARLY_ACCESS_MAX_ACTIVE_CONTRACTS) {
      throw new ForbiddenException(
        `Early-access users are limited to ${EARLY_ACCESS_MAX_ACTIVE_CONTRACTS} active contracts.`,
      );
    }

    return true;
  }

  private normalizeAccessTier(value: unknown): AccessTier {
    if (
      value === AccessTier.FREE ||
      value === AccessTier.EARLY_ACCESS ||
      value === AccessTier.PRO
    ) {
      return value;
    }

    throw new ForbiddenException("User access tier is not recognized.");
  }

  private resolveRequestedEscrowUsd(body: any): number {
    if (body?.pricing?.plan === "MVP_39") {
      return MVP_39_REFUNDABLE_STAKE_USD;
    }
    if (this.isEarlyAccessPaidPlan(body)) {
      return EARLY_ACCESS_199_REFUNDABLE_STAKE_USD;
    }

    const amount = Number(body?.stakeAmount ?? 0);
    if (!Number.isFinite(amount)) {
      throw new BadRequestException("Valid stake amount is required.");
    }

    return amount;
  }

  private isEarlyAccessPaidPlan(body: any): boolean {
    return body?.pricing?.plan === "EARLY_ACCESS_199";
  }
}
