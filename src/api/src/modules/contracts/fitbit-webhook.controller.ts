import {
  Controller,
  Get,
  Post,
  Query,
  Req,
  Res,
  Logger,
  RawBodyRequest,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiExcludeEndpoint } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { Pool } from 'pg';
import { createHash, createHmac, timingSafeEqual } from 'crypto';
import { Public } from '../../common/decorators/current-user.decorator';
import { TruthLogService } from '../../../services/ledger/truth-log.service';
import {
  FitbitService,
  FitbitDataProvenance,
  FitbitReadinessState,
} from '../../../services/health/fitbit.service';
import { FitbitSyncService } from '../../../services/health/fitbit-sync.service';

interface FitbitNotification {
  collectionType?: string;
  date?: string;
  ownerId?: string;
  ownerType?: string;
  subscriptionId?: string;
}

const REPLAY_TTL_MS = 10 * 60 * 1000;
const REPLAY_CACHE_MAX = 1000;
const VERIFIED_SOURCE = 'fitbit-verified-webhook';

/**
 * Fitbit subscription-notification endpoint (Gate 02 hardware oracle).
 *
 * Notifications are authenticated by X-Fitbit-Signature —
 * BASE64(HMAC-SHA1(rawBody, client_secret + '&')) — never by a user session,
 * and carry only user/collection/date refs. All biometric values are fetched
 * server-side via FitbitSyncService, so no request body can inject data.
 */
@ApiTags('Contracts')
@Controller('webhooks/fitbit')
export class FitbitWebhookController {
  private readonly logger = new Logger(FitbitWebhookController.name);
  // Hashes of recently processed deliveries; a signed body replayed inside the
  // TTL is acknowledged but produces no side effects.
  private readonly recentDeliveries = new Map<string, number>();

  constructor(
    private readonly pool: Pool,
    private readonly fitbitService: FitbitService,
    private readonly fitbitSync: FitbitSyncService,
    private readonly truthLog: TruthLogService,
  ) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Fitbit subscriber endpoint verification (verify= challenge)' })
  @ApiExcludeEndpoint()
  verifySubscriber(@Query('verify') verify: string | undefined, @Res() res: Response) {
    const expected = process.env.FITBIT_SUBSCRIBER_VERIFICATION_CODE || '';
    if (!expected) {
      this.logger.error(
        'Fitbit subscriber verification invoked before FITBIT_SUBSCRIBER_VERIFICATION_CODE was configured',
      );
      return res.status(503).send();
    }
    // Fitbit's contract: 204 for the correct code, 404 for anything else.
    if (
      typeof verify === 'string' &&
      this.constantTimeEquals(Buffer.from(verify), Buffer.from(expected))
    ) {
      return res.status(204).send();
    }
    return res.status(404).send();
  }

  @Post()
  @Public()
  @ApiOperation({ summary: 'Handle signed Fitbit subscription notifications' })
  @ApiExcludeEndpoint()
  async handleNotifications(@Req() req: RawBodyRequest<Request>, @Res() res: Response) {
    const clientSecret = process.env.FITBIT_CLIENT_SECRET || '';
    if (!clientSecret) {
      this.logger.error('Fitbit webhook invoked before FITBIT_CLIENT_SECRET was configured');
      return res.status(503).json({ error: 'Webhook unavailable' });
    }

    const rawBody = req.rawBody;
    const signatureHeader = req.headers['x-fitbit-signature'];
    const signature = Array.isArray(signatureHeader) ? signatureHeader[0] : signatureHeader;

    if (!rawBody || !signature) {
      await this.rejectDelivery('MISSING_SIGNATURE', req);
      return res.status(401).json({ error: 'Missing signature' });
    }

    // Fitbit signs the raw body with HMAC-SHA1 keyed by `client_secret + '&'`
    // (OAuth 1.0a-style key) and base64-encodes the digest.
    const expected = createHmac('sha1', `${clientSecret}&`).update(rawBody).digest('base64');
    if (!this.constantTimeEquals(Buffer.from(signature), Buffer.from(expected))) {
      await this.rejectDelivery('INVALID_SIGNATURE', req);
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const deliveryHash = createHash('sha256').update(rawBody).digest('hex');
    if (this.isReplayedDelivery(deliveryHash)) {
      await this.truthLog.appendEvent('FITBIT_WEBHOOK_REPLAY_SKIPPED', {
        deliveryHash,
        receivedAt: new Date().toISOString(),
      });
      return res.status(204).send();
    }
    this.rememberDelivery(deliveryHash);

    let notifications: FitbitNotification[];
    try {
      const parsed = JSON.parse(rawBody.toString('utf8'));
      notifications = Array.isArray(parsed) ? parsed : [];
    } catch {
      await this.rejectDelivery('MALFORMED_BODY', req);
      return res.status(400).json({ error: 'Malformed notification body' });
    }

    for (const notification of notifications) {
      try {
        await this.processNotification(notification);
      } catch (err) {
        // A single bad notification must not poison the batch acknowledgement.
        this.logger.error(
          `Fitbit notification processing failed (${notification?.collectionType}/${notification?.date}): ${
            err instanceof Error ? err.message : 'unknown error'
          }`,
        );
      }
    }

    // Fitbit expects a 204 acknowledgement within its delivery window.
    return res.status(204).send();
  }

  private async processNotification(notification: FitbitNotification): Promise<void> {
    const ownerId = String(notification?.ownerId || '');
    const date = String(notification?.date || '');
    const collectionType = String(notification?.collectionType || '');

    if (!ownerId || !date) {
      this.logger.warn('Fitbit notification missing ownerId/date; skipping');
      return;
    }

    if (collectionType !== 'sleep') {
      this.logger.debug(`Fitbit collection '${collectionType}' not handled; skipping`);
      return;
    }

    const userId = await this.fitbitSync.resolveUserByFitbitId(ownerId);
    if (!userId) {
      await this.truthLog.appendEvent('FITBIT_WEBHOOK_UNKNOWN_OWNER', {
        fitbitUserId: ownerId,
        date,
        receivedAt: new Date().toISOString(),
      });
      return;
    }

    // Notifications carry only refs — the actual readiness data is fetched
    // server-side from Fitbit with our stored OAuth grant.
    const summary = await this.fitbitSync.fetchDailySummary(userId, date);
    const sleep = summary.deviceLoggedMainSleep;

    if (!sleep) {
      await this.truthLog.appendEvent(
        summary.manualSleepOnly ? 'FITBIT_MANUAL_SLEEP_REJECTED' : 'FITBIT_NO_DEVICE_DATA',
        {
          userId,
          fitbitUserId: ownerId,
          date,
          receivedAt: new Date().toISOString(),
        },
      );
      return;
    }

    const contracts = await this.pool.query(
      `SELECT id, oath_category FROM contracts
       WHERE user_id = $1 AND status = 'ACTIVE'`,
      [userId],
    );
    const recoveryContracts = contracts.rows.filter((row: { oath_category?: string }) =>
      String(row.oath_category || '').startsWith('RECOVERY_'),
    );

    for (const contract of recoveryContracts) {
      await this.fitbitService.processReadinessState({
        provenance: FitbitDataProvenance.VERIFIED_WEBHOOK,
        userId,
        contractId: contract.id,
        state: FitbitReadinessState.READY,
        sleepScore: sleep.efficiency,
        restingHeartRate: summary.restingHeartRate,
        recordedAt: new Date().toISOString(),
        source: VERIFIED_SOURCE,
      });
      await this.fitbitService.processSleepData({
        provenance: FitbitDataProvenance.VERIFIED_WEBHOOK,
        userId,
        contractId: contract.id,
        sleepMinutes: sleep.minutesAsleep,
        sleepDate: date,
        deepSleepMinutes: sleep.deepSleepMinutes,
        remSleepMinutes: sleep.remSleepMinutes,
        source: VERIFIED_SOURCE,
      });
    }
  }

  private async rejectDelivery(reason: string, req: Request): Promise<void> {
    this.logger.warn(`Fitbit webhook rejected: ${reason}`);
    await this.truthLog.appendEvent('FITBIT_WEBHOOK_REJECTED', {
      reason,
      ip: req.ip,
      receivedAt: new Date().toISOString(),
    });
  }

  private constantTimeEquals(a: Buffer, b: Buffer): boolean {
    if (a.length !== b.length) {
      return false;
    }
    return timingSafeEqual(a, b);
  }

  private isReplayedDelivery(hash: string): boolean {
    this.pruneReplayCache();
    return this.recentDeliveries.has(hash);
  }

  private rememberDelivery(hash: string): void {
    if (this.recentDeliveries.size >= REPLAY_CACHE_MAX) {
      const oldest = this.recentDeliveries.keys().next().value;
      if (oldest !== undefined) {
        this.recentDeliveries.delete(oldest);
      }
    }
    this.recentDeliveries.set(hash, Date.now());
  }

  private pruneReplayCache(): void {
    const cutoff = Date.now() - REPLAY_TTL_MS;
    for (const [hash, seenAt] of this.recentDeliveries) {
      if (seenAt < cutoff) {
        this.recentDeliveries.delete(hash);
      }
    }
  }
}
