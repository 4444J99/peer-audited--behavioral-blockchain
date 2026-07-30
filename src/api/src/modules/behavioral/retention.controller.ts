import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  Inject,
  Logger,
  NotFoundException,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import { Pool } from "pg";
import { AuthGuard } from "../../../guards/auth.guard";
import { DangerZoneService, DEFAULT_TIMEZONE, DangerWindow, ProtectionRecommendation } from "./danger-zone.service";
import { AccountabilityPartnerService, CheckIn } from "./accountability-partner.service";
import { ProgressDashboardService } from "./progress-dashboard.service";
import { EndowedProgressService } from "./endowed-progress.service";
import { NotificationComposerService } from "../notifications/notification-composer.service";
import { NotificationsService } from "../notifications/notifications.service";

// The bootstrap middleware sets req.id to a correlation ID, so the
// authenticated principal must be read from req.user (set by AuthGuard).
function resolveUserId(req: any): string {
  return req?.user?.id ?? req?.userId;
}

interface ContractDangerStatus {
  contractId: string;
  inDangerZone: boolean;
  windows: DangerWindow[];
  recommendations: ProtectionRecommendation[];
}

interface CheckInMembership {
  ownerId: string;
  partnerId: string | null;
  ownerAlias: string | null;
  partnerAlias: string | null;
}

@Controller("behavioral/retention")
@UseGuards(AuthGuard)
export class RetentionController {
  private readonly logger = new Logger(RetentionController.name);

  constructor(
    @Inject("DATABASE_POOL") private readonly pool: Pool,
    private readonly progressDashboard: ProgressDashboardService,
    private readonly endowedProgress: EndowedProgressService,
    private readonly dangerZone: DangerZoneService,
    private readonly partners: AccountabilityPartnerService,
    private readonly composer: NotificationComposerService,
    private readonly notifications: NotificationsService,
  ) {}

  @Get("progress-dashboard/:contractId")
  async getProgressDashboard(@Req() req: any, @Param("contractId") contractId: string) {
    const userId = resolveUserId(req);
    await this.assertContractOwnership(contractId, userId);
    return this.progressDashboard.getDashboardSummary(userId, contractId);
  }

  @Get("endowed-progress/:contractId")
  async getEndowedProgress(@Req() req: any, @Param("contractId") contractId: string) {
    const userId = resolveUserId(req);
    await this.assertContractOwnership(contractId, userId);
    const [state, downscaling] = await Promise.all([
      this.endowedProgress.getProgressState(contractId),
      this.endowedProgress.applyDynamicDownscaling(contractId),
    ]);
    return { ...state, downscaling };
  }

  @Get("danger-zone")
  async getDangerZoneStatus(@Req() req: any) {
    const userId = resolveUserId(req);
    const [contractsResult, timezone] = await Promise.all([
      this.pool.query(
        `SELECT id FROM contracts WHERE user_id = $1 AND status = 'ACTIVE'`,
        [userId],
      ),
      this.getUserTimezone(userId),
    ]);

    const contracts: ContractDangerStatus[] = [];
    for (const row of contractsResult.rows) {
      const windows = await this.dangerZone.evaluateDangerWindows(row.id, timezone);
      const recommendations = await this.dangerZone.getProtectionRecommendations(windows);
      contracts.push({
        contractId: row.id,
        inDangerZone: windows.length > 0,
        windows,
        recommendations,
      });
    }

    return {
      timezone,
      inDangerZone: contracts.some((c) => c.inDangerZone),
      contracts,
    };
  }

  @Post("partners/invite")
  async invitePartner(@Req() req: any, @Body() body: { categories?: unknown }) {
    const userId = resolveUserId(req);
    const categories = body?.categories;
    if (
      !Array.isArray(categories) ||
      categories.length === 0 ||
      !categories.every((c) => typeof c === "string" && c.trim().length > 0)
    ) {
      throw new BadRequestException("categories must be a non-empty array of oath category strings");
    }
    return this.partners.requestPartnerMatch(userId, categories as string[]);
  }

  @Post("partners/accept")
  async acceptPartnership(@Req() req: any, @Body() body: { contractId?: string }) {
    const userId = resolveUserId(req);
    const contractId = body?.contractId;
    if (typeof contractId !== "string" || contractId.length === 0) {
      throw new BadRequestException("contractId is required");
    }

    const { rows } = await this.pool.query(
      `SELECT user_id, status FROM contracts WHERE id = $1`,
      [contractId],
    );
    if (rows.length === 0) {
      throw new NotFoundException(`Contract ${contractId} not found`);
    }
    if (rows[0].user_id === userId) {
      throw new BadRequestException("You cannot be the accountability partner on your own contract");
    }
    if (rows[0].status !== "ACTIVE") {
      throw new BadRequestException("Partnerships can only be accepted on active contracts");
    }

    // Accepting a partnership schedules its first check-in with the accepting
    // user as the partner of record.
    return this.partners.scheduleCheckIn(contractId, userId, "SCHEDULED");
  }

  @Get("partners")
  async listPartners(@Req() req: any) {
    return this.partners.getActivePartnerships(resolveUserId(req));
  }

  @Get("partners/check-ins/:contractId")
  async getCheckInHistory(
    @Req() req: any,
    @Param("contractId") contractId: string,
    @Query("limit") limit?: string,
  ) {
    const userId = resolveUserId(req);
    await this.assertContractMembership(contractId, userId);

    const parsed = limit === undefined ? 20 : parseInt(limit, 10);
    if (!Number.isInteger(parsed) || parsed < 1 || parsed > 100) {
      throw new BadRequestException("limit must be an integer between 1 and 100");
    }
    return this.partners.getCheckInHistory(contractId, parsed);
  }

  @Post("partners/check-in")
  async completeCheckIn(@Req() req: any, @Body() body: { checkInId?: string; message?: string }) {
    const userId = resolveUserId(req);
    if (typeof body?.checkInId !== "string" || body.checkInId.length === 0) {
      throw new BadRequestException("checkInId is required");
    }
    if (typeof body?.message !== "string" || body.message.trim().length === 0) {
      throw new BadRequestException("message is required");
    }

    const membership = await this.getCheckInMembership(body.checkInId);
    if (membership.ownerId !== userId && membership.partnerId !== userId) {
      throw new ForbiddenException("You are not a participant in this check-in");
    }

    const checkIn = await this.partners.completeCheckIn(body.checkInId, body.message.trim());
    await this.notifyCounterpart(userId, membership, checkIn);
    return checkIn;
  }

  private async assertContractOwnership(contractId: string, userId: string): Promise<void> {
    const { rows } = await this.pool.query(
      `SELECT user_id FROM contracts WHERE id = $1`,
      [contractId],
    );
    if (rows.length === 0) {
      throw new NotFoundException(`Contract ${contractId} not found`);
    }
    if (rows[0].user_id !== userId) {
      throw new ForbiddenException("You do not own this contract");
    }
  }

  private async assertContractMembership(contractId: string, userId: string): Promise<void> {
    const { rows } = await this.pool.query(
      `SELECT c.user_id AS owner_id,
              EXISTS (
                SELECT 1 FROM partner_checkins pc
                WHERE pc.contract_id = c.id AND pc.partner_id = $2
              ) AS is_partner
       FROM contracts c
       WHERE c.id = $1`,
      [contractId, userId],
    );
    if (rows.length === 0) {
      throw new NotFoundException(`Contract ${contractId} not found`);
    }
    if (rows[0].owner_id !== userId && !rows[0].is_partner) {
      throw new ForbiddenException("You are not a participant on this contract");
    }
  }

  private async getCheckInMembership(checkInId: string): Promise<CheckInMembership> {
    const { rows } = await this.pool.query(
      `SELECT pc.partner_id, c.user_id AS owner_id,
              uo.alias AS owner_alias, up.alias AS partner_alias
       FROM partner_checkins pc
       JOIN contracts c ON c.id = pc.contract_id
       LEFT JOIN users uo ON uo.id = c.user_id
       LEFT JOIN users up ON up.id = pc.partner_id
       WHERE pc.id = $1`,
      [checkInId],
    );
    if (rows.length === 0) {
      throw new NotFoundException(`Check-in ${checkInId} not found`);
    }
    return {
      ownerId: rows[0].owner_id,
      partnerId: rows[0].partner_id ?? null,
      ownerAlias: rows[0].owner_alias ?? null,
      partnerAlias: rows[0].partner_alias ?? null,
    };
  }

  private async getUserTimezone(userId: string): Promise<string> {
    const { rows } = await this.pool.query(
      `SELECT COALESCE(timezone, $2) AS timezone FROM users WHERE id = $1`,
      [userId, DEFAULT_TIMEZONE],
    );
    return rows[0]?.timezone ?? DEFAULT_TIMEZONE;
  }

  private async notifyCounterpart(
    completerId: string,
    membership: CheckInMembership,
    checkIn: CheckIn,
  ): Promise<void> {
    const counterpartId = completerId === membership.ownerId ? membership.partnerId : membership.ownerId;
    if (!counterpartId) return;

    const completerAlias =
      (completerId === membership.ownerId ? membership.ownerAlias : membership.partnerAlias) ??
      `user-${completerId.slice(0, 8)}`;
    const composed = this.composer.compose({
      type: "PARTNER_CHECK_IN",
      userId: counterpartId,
      contractId: checkIn.contractId,
      metadata: { partnerAlias: completerAlias },
    });

    try {
      await this.notifications.create({
        userId: counterpartId,
        type: "PARTNER_CHECK_IN",
        title: composed.title,
        body: composed.body,
        metadata: { ...composed.data, checkInId: checkIn.id, priority: composed.priority },
      });
    } catch (err) {
      // Delivery is best-effort — completing the check-in must not fail on notify.
      this.logger.error(
        `Failed to notify counterpart ${counterpartId} for check-in ${checkIn.id}: ${err instanceof Error ? err.message : err}`,
      );
    }
  }
}
