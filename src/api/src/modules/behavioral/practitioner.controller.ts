import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  Inject,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import { Pool } from "pg";
import { AuthGuard } from "../../../guards/auth.guard";
import { RoleGuard, Roles } from "../../common/guards/role.guard";
import {
  JournalAlert,
  PractitionerIntelligenceService,
} from "./practitioner-intelligence.service";

// The bootstrap middleware sets req.id to a correlation ID, so the
// authenticated principal must be read from req.user (set by AuthGuard).
function resolveUserId(req: any): string {
  return req?.user?.id ?? req?.userId;
}

function clampInt(raw: string | undefined, fallback: number, min: number, max: number): number {
  const parsed = parseInt(raw ?? "", 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

@Controller("practitioner")
@UseGuards(AuthGuard, RoleGuard)
@Roles("PRACTITIONER", "ADMIN")
export class PractitionerController {
  constructor(
    private readonly intelligence: PractitionerIntelligenceService,
    @Inject("DATABASE_POOL") private readonly pool: Pool,
  ) {}

  @Get("dashboard")
  async dashboard(@Req() req: any) {
    return this.intelligence.getPractitionerDashboard(resolveUserId(req));
  }

  @Get("clients/:clientId/risk-profile")
  async riskProfile(@Req() req: any, @Param("clientId") clientId: string) {
    await this.assertClientAccess(resolveUserId(req), clientId);
    return this.intelligence.getClientRiskProfile(clientId);
  }

  @Get("clients/:clientId/risk-trend")
  async riskTrend(
    @Req() req: any,
    @Param("clientId") clientId: string,
    @Query("days") days?: string,
  ) {
    await this.assertClientAccess(resolveUserId(req), clientId);
    const window = clampInt(days, 30, 1, 90);
    return {
      clientId,
      days: window,
      trend: await this.intelligence.getRiskTrend(clientId, window),
    };
  }

  @Get("clients/:clientId/alerts")
  async alerts(
    @Req() req: any,
    @Param("clientId") clientId: string,
    @Query("limit") limit?: string,
  ) {
    await this.assertClientAccess(resolveUserId(req), clientId);
    const cap = clampInt(limit, 20, 1, 100);
    const result = await this.pool.query(
      `SELECT id, user_id, alert_type, excerpt, severity, created_at
       FROM practitioner_alerts
       WHERE client_id = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [clientId, cap],
    );
    const mapped: JournalAlert[] = result.rows.map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      alertType: row.alert_type,
      excerpt: row.excerpt,
      severity: row.severity,
      createdAt: new Date(row.created_at),
    }));
    return { clientId, alerts: mapped };
  }

  // Scans a journal entry for rationalization / distress / crisis language and
  // persists every resulting alert so it shows up in the client's alert feed.
  @Post("clients/:clientId/journal-scan")
  async scanJournalEntry(
    @Req() req: any,
    @Param("clientId") clientId: string,
    @Body() body: { entryText: string },
  ) {
    if (!body?.entryText || typeof body.entryText !== "string") {
      throw new BadRequestException("entryText is required");
    }
    const practitionerId = resolveUserId(req);
    await this.assertClientAccess(practitionerId, clientId);

    const alerts = await this.intelligence.analyzeJournalEntry(clientId, body.entryText);
    for (const alert of alerts) {
      await this.intelligence.sendPractitionerAlert(practitionerId, clientId, alert);
    }
    return { clientId, alerts, persisted: alerts.length };
  }

  @Get("clients/:clientId/adherence")
  async adherence(@Req() req: any, @Param("clientId") clientId: string) {
    await this.assertClientAccess(resolveUserId(req), clientId);
    const contract = await this.pool.query(
      `SELECT id FROM contracts WHERE user_id = $1 AND status = 'ACTIVE' LIMIT 1`,
      [clientId],
    );
    const contractId: string = contract.rows[0]?.id ?? "";
    const adherenceRate = await this.intelligence.calculateAdherenceRate(clientId, contractId);
    return { clientId, contractId: contractId || null, adherenceRate };
  }

  // Practitioners may only see clients assigned to them; ADMINs may see any
  // client. The admin check reads the CURRENT role from the DB (same
  // fail-closed posture as RoleGuard) rather than trusting the JWT claim.
  private async assertClientAccess(practitionerId: string, clientId: string): Promise<void> {
    const assignment = await this.pool.query(
      `SELECT 1 FROM practitioner_client_assignments
       WHERE practitioner_id = $1 AND client_id = $2 AND active = true`,
      [practitionerId, clientId],
    );
    if (assignment.rows.length > 0) return;

    const role = await this.pool.query(
      `SELECT role FROM users WHERE id = $1`,
      [practitionerId],
    );
    if (String(role.rows[0]?.role || "").toUpperCase() === "ADMIN") return;

    throw new ForbiddenException("Client is not assigned to this practitioner");
  }
}
