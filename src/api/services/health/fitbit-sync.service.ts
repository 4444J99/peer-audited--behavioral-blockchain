import {
  Injectable,
  Logger,
  BadRequestException,
  ConflictException,
  NotFoundException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { Pool } from 'pg';

const FITBIT_TOKEN_URL = 'https://api.fitbit.com/oauth2/token';
const FITBIT_API_BASE = 'https://api.fitbit.com';
// Refresh slightly before expiry so an in-flight request never presents a stale token.
const ACCESS_TOKEN_EXPIRY_MARGIN_MS = 60_000;
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

interface FitbitTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  user_id: string;
  scope?: string;
}

export interface FitbitDeviceSleep {
  logId: string;
  minutesAsleep: number;
  efficiency?: number;
  deepSleepMinutes?: number;
  remSleepMinutes?: number;
}

export interface FitbitDailySummary {
  date: string;
  /** Device-detected main sleep for the date, or null when none exists. */
  deviceLoggedMainSleep: FitbitDeviceSleep | null;
  /** True when Fitbit has sleep logs for the date but ALL were typed in manually. */
  manualSleepOnly: boolean;
  restingHeartRate?: number;
}

/**
 * Server-side Fitbit OAuth2 + data-fetch client.
 *
 * Webhook notifications carry only user/collection/date refs; every biometric
 * value credited to a contract is fetched here, directly from Fitbit, using the
 * per-user grant stored at connect time. Nothing in a request body is trusted.
 */
@Injectable()
export class FitbitSyncService {
  private readonly logger = new Logger(FitbitSyncService.name);

  constructor(private readonly pool: Pool) {}

  private get clientId(): string {
    return process.env.FITBIT_CLIENT_ID || '';
  }

  private get clientSecret(): string {
    return process.env.FITBIT_CLIENT_SECRET || '';
  }

  isConfigured(): boolean {
    return Boolean(this.clientId && this.clientSecret);
  }

  private assertConfigured(): void {
    if (!this.isConfigured()) {
      throw new ServiceUnavailableException('Fitbit integration is not configured');
    }
  }

  /**
   * Exchange an OAuth2 authorization code for tokens, persist the grant, and
   * subscribe to sleep notifications for this user.
   */
  async connectUser(
    userId: string,
    code: string,
    redirectUri?: string,
  ): Promise<{ connected: true; fitbitUserId: string; scope: string | null; subscribed: boolean }> {
    this.assertConfigured();

    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: this.clientId,
      code,
    });
    const resolvedRedirectUri = redirectUri || process.env.FITBIT_REDIRECT_URI;
    if (resolvedRedirectUri) {
      params.set('redirect_uri', resolvedRedirectUri);
    }

    const token = await this.requestToken(params, 'authorization_code'); // allow-secret
    const expiresAt = new Date(Date.now() + token.expires_in * 1000).toISOString();

    try {
      await this.pool.query(
        `INSERT INTO fitbit_oauth_tokens
           (user_id, fitbit_user_id, access_token, access_token_expires_at, refresh_token, scope)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (user_id) DO UPDATE SET
           fitbit_user_id = EXCLUDED.fitbit_user_id,
           access_token = EXCLUDED.access_token,
           access_token_expires_at = EXCLUDED.access_token_expires_at,
           refresh_token = EXCLUDED.refresh_token,
           scope = EXCLUDED.scope,
           updated_at = NOW()`,
        [userId, token.user_id, token.access_token, expiresAt, token.refresh_token, token.scope ?? null],
      );
    } catch (err: any) {
      // Unique violation on fitbit_user_id: one wearable identity may back only
      // one account (anti-Sybil — the same device cannot attest for two users).
      if (err?.code === '23505') {
        throw new ConflictException('This Fitbit account is already linked to another user');
      }
      throw err;
    }

    const subscribed = await this.ensureSleepSubscription(token.access_token, userId);
    return { connected: true, fitbitUserId: token.user_id, scope: token.scope ?? null, subscribed };
  }

  /** Remove the stored grant (and best-effort the Fitbit-side subscription). */
  async disconnectUser(userId: string): Promise<{ disconnected: boolean }> {
    const existing = await this.pool.query(
      `SELECT user_id FROM fitbit_oauth_tokens WHERE user_id = $1`,
      [userId],
    );
    if (existing.rows.length === 0) {
      return { disconnected: false };
    }

    try {
      const { accessToken } = await this.getValidAccessToken(userId);
      await fetch(
        `${FITBIT_API_BASE}/1/user/-/sleep/apiSubscriptions/${encodeURIComponent(userId)}.json`,
        { method: 'DELETE', headers: { Authorization: `Bearer ${accessToken}` } },
      );
    } catch (err) {
      this.logger.warn(
        `Fitbit subscription teardown for user ${userId} failed: ${err instanceof Error ? err.message : 'unknown error'}`,
      );
    }

    await this.pool.query(`DELETE FROM fitbit_oauth_tokens WHERE user_id = $1`, [userId]);
    return { disconnected: true };
  }

  /** Map a Fitbit owner id (from a notification) to our user id, if linked. */
  async resolveUserByFitbitId(fitbitUserId: string): Promise<string | null> {
    const result = await this.pool.query(
      `SELECT user_id FROM fitbit_oauth_tokens WHERE fitbit_user_id = $1`,
      [fitbitUserId],
    );
    return result.rows.length > 0 ? result.rows[0].user_id : null;
  }

  /**
   * Return a live access token for the user, refreshing (and persisting the
   * rotated refresh token) when the stored one is expired or near expiry.
   */
  async getValidAccessToken(userId: string): Promise<{ accessToken: string; fitbitUserId: string }> {
    this.assertConfigured();

    const result = await this.pool.query(
      `SELECT fitbit_user_id, access_token, access_token_expires_at, refresh_token
       FROM fitbit_oauth_tokens WHERE user_id = $1`,
      [userId],
    );
    if (result.rows.length === 0) {
      throw new NotFoundException('Fitbit account is not connected for this user');
    }

    const row = result.rows[0];
    const expiresAtMs = row.access_token_expires_at
      ? new Date(row.access_token_expires_at).getTime()
      : 0;
    if (row.access_token && expiresAtMs - ACCESS_TOKEN_EXPIRY_MARGIN_MS > Date.now()) {
      return { accessToken: row.access_token, fitbitUserId: row.fitbit_user_id };
    }

    let token: FitbitTokenResponse; // allow-secret
    try {
      token = await this.requestToken( // allow-secret
        new URLSearchParams({ grant_type: 'refresh_token', refresh_token: row.refresh_token }),
        'refresh_token',
      );
    } catch {
      // A dead refresh token means the grant was revoked on Fitbit's side;
      // the user must re-run the connect flow.
      throw new UnauthorizedException(
        'Fitbit authorization expired; the user must reconnect their Fitbit account',
      );
    }

    // Fitbit rotates refresh tokens on every refresh — persisting the new one
    // is mandatory or the NEXT refresh fails.
    const newExpiresAt = new Date(Date.now() + token.expires_in * 1000).toISOString();
    await this.pool.query(
      `UPDATE fitbit_oauth_tokens
       SET access_token = $1, access_token_expires_at = $2, refresh_token = $3, updated_at = NOW()
       WHERE user_id = $4`,
      [token.access_token, newExpiresAt, token.refresh_token, userId],
    );

    return { accessToken: token.access_token, fitbitUserId: row.fitbit_user_id };
  }

  /**
   * Fetch the day's sleep (and best-effort resting heart rate) from Fitbit.
   *
   * Fitbit distinguishes device-detected sleep (logType 'auto_detected') from
   * entries typed into the app (logType 'manual'). Only device-detected logs
   * count toward hardware-oracle state — the Gate 02 invariant.
   */
  async fetchDailySummary(userId: string, date: string): Promise<FitbitDailySummary> {
    if (!ISO_DATE_PATTERN.test(date)) {
      throw new BadRequestException(`Invalid Fitbit notification date: ${date}`);
    }

    const { accessToken } = await this.getValidAccessToken(userId);

    const sleepBody = await this.fitbitGet(`/1.2/user/-/sleep/date/${date}.json`, accessToken);
    const logs: any[] = Array.isArray(sleepBody?.sleep) ? sleepBody.sleep : [];
    const deviceLogs = logs.filter((log) => String(log?.logType || '') !== 'manual');

    const main =
      deviceLogs.find((log) => log?.isMainSleep === true) ??
      (deviceLogs.length > 0
        ? deviceLogs.reduce((longest, log) =>
            Number(log?.minutesAsleep || 0) > Number(longest?.minutesAsleep || 0) ? log : longest,
          )
        : undefined);

    const summary: FitbitDailySummary = {
      date,
      deviceLoggedMainSleep: main
        ? {
            logId: String(main.logId ?? ''),
            minutesAsleep: Number(main.minutesAsleep || 0),
            efficiency: main.efficiency !== undefined ? Number(main.efficiency) : undefined,
            deepSleepMinutes:
              main.levels?.summary?.deep?.minutes !== undefined
                ? Number(main.levels.summary.deep.minutes)
                : undefined,
            remSleepMinutes:
              main.levels?.summary?.rem?.minutes !== undefined
                ? Number(main.levels.summary.rem.minutes)
                : undefined,
          }
        : null,
      manualSleepOnly: logs.length > 0 && deviceLogs.length === 0,
    };

    try {
      const heartBody = await this.fitbitGet(`/1/user/-/activities/heart/date/${date}/1d.json`, accessToken);
      const resting = heartBody?.['activities-heart']?.[0]?.value?.restingHeartRate;
      if (typeof resting === 'number') {
        summary.restingHeartRate = resting;
      }
    } catch (err) {
      // Heart-rate enrichment is best-effort; sleep alone decides readiness.
      this.logger.debug(
        `Fitbit heart-rate fetch for ${userId}/${date} skipped: ${err instanceof Error ? err.message : 'unknown error'}`,
      );
    }

    return summary;
  }

  private async ensureSleepSubscription(accessToken: string, userId: string): Promise<boolean> {
    try {
      const res = await fetch(
        `${FITBIT_API_BASE}/1/user/-/sleep/apiSubscriptions/${encodeURIComponent(userId)}.json`,
        { method: 'POST', headers: { Authorization: `Bearer ${accessToken}` } },
      );
      // 409 means a subscription already exists for this subscriber id.
      if (res.ok || res.status === 409) {
        return true;
      }
      this.logger.warn(`Fitbit sleep subscription for user ${userId} failed (${res.status})`);
      return false;
    } catch (err) {
      this.logger.warn(
        `Fitbit sleep subscription for user ${userId} errored: ${err instanceof Error ? err.message : 'unknown error'}`,
      );
      return false;
    }
  }

  private async requestToken(params: URLSearchParams, grantType: string): Promise<FitbitTokenResponse> {
    const res = await fetch(FITBIT_TOKEN_URL, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      this.logger.warn(
        `Fitbit ${grantType} token request failed (${res.status}): ${detail.slice(0, 200)}`,
      );
      throw new BadRequestException(`Fitbit ${grantType} token request failed (${res.status})`);
    }

    const body = (await res.json()) as FitbitTokenResponse;
    if (!body.access_token || !body.refresh_token || !body.user_id) {
      throw new BadRequestException('Fitbit token response is missing required fields');
    }
    return body;
  }

  private async fitbitGet(path: string, accessToken: string): Promise<any> {
    const res = await fetch(`${FITBIT_API_BASE}${path}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) {
      throw new ServiceUnavailableException(`Fitbit API request ${path} failed (${res.status})`);
    }
    return res.json();
  }
}
