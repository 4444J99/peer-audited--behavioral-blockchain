import { Injectable, Inject, Logger, NotFoundException } from "@nestjs/common";
import { Pool } from "pg";
import { randomBytes } from "crypto";
import { parseWaitlistAttribution } from "@styx/shared/libs/waitlist-attribution";
import { readFirstEnv, normalizeBaseUrl } from "../../config/runtime";
import { JoinBetaWaitlistDto } from "./dto";
import {
  BETA_WAITLIST_NOTIFIER,
  BetaWaitlistNotifier,
} from "./beta-waitlist.notifier";

export interface BetaWaitlistEntry {
  id: string;
  email: string;
  name: string | null;
  goal: string | null;
  platform: string;
  source: string;
  channel: string;
  intent: string | null;
  utmSource: string | null;
  utmCampaign: string | null;
  utmMedium: string | null;
  referrer: string | null;
  referralCode: string | null;
  status: "pending" | "confirmed" | "admitted";
  confirmedAt: Date | null;
  admittedAt: Date | null;
  createdAt: Date;
}

export interface BetaWaitlistSignupResult {
  status: BetaWaitlistEntry["status"];
  channel: string;
  /** True when this email had not signed up before (for conversion tracking). */
  isNew: boolean;
  /** True when the email was already confirmed/admitted on a prior visit. */
  alreadyConfirmed: boolean;
  confirmation: {
    method: "queue";
    url: string;
  };
}

export interface BetaWaitlistStats {
  total: number;
  confirmed: number;
  conversionRate: number;
  byChannel: Record<string, number>;
  byStatus: Record<string, number>;
}

@Injectable()
export class BetaWaitlistService {
  private readonly logger = new Logger(BetaWaitlistService.name);

  constructor(
    private readonly pool: Pool,
    @Inject(BETA_WAITLIST_NOTIFIER)
    private readonly notifier: BetaWaitlistNotifier,
  ) {}

  async signup(dto: JoinBetaWaitlistDto): Promise<BetaWaitlistSignupResult> {
    const attribution = parseWaitlistAttribution({
      source: dto.source,
      intent: dto.intent,
      utm_source: dto.utm_source,
      utm_campaign: dto.utm_campaign,
      utm_medium: dto.utm_medium,
      referrer: dto.referrer,
      ref: dto.ref,
      channel: dto.channel,
    });

    const email = dto.email.trim();
    const emailNormalized = email.toLowerCase();
    const platform = (dto.platform || "ios").trim().toLowerCase();
    const token = randomBytes(24).toString("hex"); // allow-secret

    const {
      rows: [row],
    } = await this.pool.query(
      `INSERT INTO beta_waitlist (
         email, email_normalized, name, goal, platform,
         source, channel, intent, utm_source, utm_campaign,
         utm_medium, referrer, referral_code, confirmation_token
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
       ON CONFLICT (email_normalized) DO UPDATE SET
         name = COALESCE(EXCLUDED.name, beta_waitlist.name),
         goal = COALESCE(EXCLUDED.goal, beta_waitlist.goal),
         updated_at = NOW()
       RETURNING *, (xmax = 0) AS inserted`,
      [
        email,
        emailNormalized,
        dto.name?.trim() || null,
        dto.goal?.trim() || null,
        platform,
        attribution.source,
        attribution.channel,
        attribution.intent,
        attribution.utmSource,
        attribution.utmCampaign,
        attribution.utmMedium,
        attribution.referrer,
        attribution.referralCode,
        token,
      ],
    );

    const entry = this.mapEntry(row);
    const isNew = row.inserted === true;
    const alreadyConfirmed = entry.status !== "pending";
    const confirmationUrl = this.buildConfirmationUrl(row.confirmation_token);

    // Only (re)send a confirmation while the entry is still awaiting it.
    if (!alreadyConfirmed) {
      await this.notifier.sendConfirmation({
        email: entry.email,
        name: entry.name,
        channel: entry.channel,
        confirmationUrl,
      });
    }

    this.logger.log(
      `Beta-waitlist signup ${isNew ? "created" : "refreshed"} for ${emailNormalized} (channel=${entry.channel}, status=${entry.status})`,
    );

    return {
      status: entry.status,
      channel: entry.channel,
      isNew,
      alreadyConfirmed,
      confirmation: { method: "queue", url: confirmationUrl },
    };
  }

  async confirm(token: string): Promise<BetaWaitlistEntry> {
    const trimmed = (token || "").trim();
    if (!trimmed) {
      throw new NotFoundException("Confirmation token is required");
    }

    const {
      rows: [updated],
    } = await this.pool.query(
      `UPDATE beta_waitlist
         SET status = 'confirmed',
             confirmed_at = COALESCE(confirmed_at, NOW()),
             updated_at = NOW()
       WHERE confirmation_token = $1 AND status = 'pending'
       RETURNING *`,
      [trimmed],
    );
    if (updated) return this.mapEntry(updated);

    // Idempotent: a token that already confirmed (or was admitted) is not an error.
    const {
      rows: [existing],
    } = await this.pool.query(
      "SELECT * FROM beta_waitlist WHERE confirmation_token = $1",
      [trimmed],
    );
    if (existing) return this.mapEntry(existing);

    throw new NotFoundException("Unknown confirmation token");
  }

  async list(filter: {
    channel?: string;
    status?: string;
    limit?: number;
  }): Promise<BetaWaitlistEntry[]> {
    const conditions: string[] = [];
    const params: unknown[] = [];
    if (filter.channel) {
      params.push(filter.channel);
      conditions.push(`channel = $${params.length}`);
    }
    if (filter.status) {
      params.push(filter.status);
      conditions.push(`status = $${params.length}`);
    }
    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const limit = Math.min(Math.max(filter.limit ?? 500, 1), 2000);
    params.push(limit);

    const { rows } = await this.pool.query(
      `SELECT * FROM beta_waitlist ${where} ORDER BY created_at DESC LIMIT $${params.length}`,
      params,
    );
    return rows.map((r: any) => this.mapEntry(r));
  }

  async stats(): Promise<BetaWaitlistStats> {
    const { rows } = await this.pool.query(
      "SELECT channel, status, COUNT(*)::int AS count FROM beta_waitlist GROUP BY channel, status",
    );

    const byChannel: Record<string, number> = {};
    const byStatus: Record<string, number> = {};
    let total = 0;
    let confirmed = 0;
    for (const r of rows) {
      const count = Number(r.count);
      total += count;
      byChannel[r.channel] = (byChannel[r.channel] ?? 0) + count;
      byStatus[r.status] = (byStatus[r.status] ?? 0) + count;
      if (r.status === "confirmed" || r.status === "admitted") confirmed += count;
    }

    return {
      total,
      confirmed,
      conversionRate: total === 0 ? 0 : confirmed / total,
      byChannel,
      byStatus,
    };
  }

  private buildConfirmationUrl(token: string): string {
    const path = `/beta/confirm?token=${encodeURIComponent(token)}`;
    const base = readFirstEnv(["STYX_WEB_PUBLIC_URL", "NEXT_PUBLIC_WEB_URL"]);
    return base ? `${normalizeBaseUrl(base)}${path}` : path;
  }

  private mapEntry(r: any): BetaWaitlistEntry {
    return {
      id: r.id,
      email: r.email,
      name: r.name ?? null,
      goal: r.goal ?? null,
      platform: r.platform,
      source: r.source,
      channel: r.channel,
      intent: r.intent ?? null,
      utmSource: r.utm_source ?? null,
      utmCampaign: r.utm_campaign ?? null,
      utmMedium: r.utm_medium ?? null,
      referrer: r.referrer ?? null,
      referralCode: r.referral_code ?? null,
      status: r.status,
      confirmedAt: r.confirmed_at ?? null,
      admittedAt: r.admitted_at ?? null,
      createdAt: r.created_at,
    };
  }
}
