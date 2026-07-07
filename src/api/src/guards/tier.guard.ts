import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { Pool } from "pg";

export enum AccessTier {
  FREE = "free",
  EARLY_ACCESS = "early_access",
  PRO = "pro",
}

const EARLY_ACCESS_MAX_ACTIVE_CONTRACTS = 3;
const EARLY_ACCESS_MAX_ESCROW_USD = 0;
const MVP_39_REFUNDABLE_STAKE_USD = 30;

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

    const accessTier = this.normalizeAccessTier(
      userResult.rows[0].access_tier,
    );

    if (accessTier === AccessTier.PRO) {
      return true;
    }

    if (accessTier === AccessTier.FREE) {
      throw new ForbiddenException(
        "Contract creation requires early access or pro access.",
      );
    }

    const requestedEscrowUsd = this.resolveRequestedEscrowUsd(request.body);
    if (requestedEscrowUsd > EARLY_ACCESS_MAX_ESCROW_USD) {
      throw new ForbiddenException(
        "Early-access users are limited to $0 escrow contracts.",
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

    const amount = Number(body?.stakeAmount ?? 0);
    if (!Number.isFinite(amount)) {
      throw new BadRequestException("Valid stake amount is required.");
    }

    return amount;
  }
}
