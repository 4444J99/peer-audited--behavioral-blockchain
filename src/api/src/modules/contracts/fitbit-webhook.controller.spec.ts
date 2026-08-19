import { Pool } from 'pg';
import { createHmac } from 'crypto';
import { FitbitWebhookController } from './fitbit-webhook.controller';
import { FitbitService, FitbitDataProvenance } from '../../../services/health/fitbit.service';
import { FitbitSyncService } from '../../../services/health/fitbit-sync.service';
import { TruthLogService } from '../../../services/ledger/truth-log.service';
import { IS_PUBLIC_KEY } from '../../../guards/auth.guard';

const CLIENT_SECRET = 'fitbit-secret'; // allow-secret
const VERIFY_CODE = 'subscriber-verify-code';

const sign = (body: Buffer) =>
  createHmac('sha1', `${CLIENT_SECRET}&`).update(body).digest('base64');

const makeReq = (body: Buffer | undefined, signature?: string) => ({
  rawBody: body,
  headers: signature !== undefined ? { 'x-fitbit-signature': signature } : {},
  ip: '203.0.113.7',
});

const makeRes = () => {
  const res: any = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
  };
  return res;
};

const notificationBody = (overrides: Record<string, unknown> = {}) =>
  Buffer.from(
    JSON.stringify([
      {
        collectionType: 'sleep',
        date: '2026-07-29',
        ownerId: 'FB123',
        ownerType: 'user',
        subscriptionId: 'user-1',
        ...overrides,
      },
    ]),
  );

const deviceSummary = (overrides: Record<string, unknown> = {}) => ({
  date: '2026-07-29',
  deviceLoggedMainSleep: {
    logId: 'log-1',
    minutesAsleep: 412,
    efficiency: 93,
    deepSleepMinutes: 80,
    remSleepMinutes: 100,
  },
  manualSleepOnly: false,
  restingHeartRate: 52,
  ...overrides,
});

describe('FitbitWebhookController', () => {
  let controller: FitbitWebhookController;
  let pool: { query: jest.Mock };
  let fitbitService: { processReadinessState: jest.Mock; processSleepData: jest.Mock };
  let fitbitSync: { resolveUserByFitbitId: jest.Mock; fetchDailySummary: jest.Mock };
  let truthLog: { appendEvent: jest.Mock };
  const originalEnv = {
    FITBIT_CLIENT_SECRET: process.env.FITBIT_CLIENT_SECRET,
    FITBIT_SUBSCRIBER_VERIFICATION_CODE: process.env.FITBIT_SUBSCRIBER_VERIFICATION_CODE,
  };

  beforeEach(() => {
    pool = { query: jest.fn() };
    fitbitService = {
      processReadinessState: jest
        .fn()
        .mockResolvedValue({ status: 'recorded', state: 'READY', attestationApplied: true }),
      processSleepData: jest.fn().mockResolvedValue({ accepted: true }),
    };
    fitbitSync = {
      resolveUserByFitbitId: jest.fn().mockResolvedValue('user-1'),
      fetchDailySummary: jest.fn().mockResolvedValue(deviceSummary()),
    };
    truthLog = { appendEvent: jest.fn().mockResolvedValue(undefined) };
    process.env.FITBIT_CLIENT_SECRET = CLIENT_SECRET; // allow-secret
    process.env.FITBIT_SUBSCRIBER_VERIFICATION_CODE = VERIFY_CODE;

    controller = new FitbitWebhookController(
      pool as unknown as Pool,
      fitbitService as unknown as FitbitService,
      fitbitSync as unknown as FitbitSyncService,
      truthLog as unknown as TruthLogService,
    );
  });

  afterEach(() => {
    for (const [key, value] of Object.entries(originalEnv)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });

  it('marks both webhook handlers @Public (signature auth, not session auth)', () => {
    expect(
      Reflect.getMetadata(IS_PUBLIC_KEY, FitbitWebhookController.prototype.handleNotifications),
    ).toBe(true);
    expect(
      Reflect.getMetadata(IS_PUBLIC_KEY, FitbitWebhookController.prototype.verifySubscriber),
    ).toBe(true);
  });

  describe('verifySubscriber (Fitbit verify= challenge)', () => {
    it('returns 204 for the correct verification code', () => {
      const res = makeRes();
      controller.verifySubscriber(VERIFY_CODE, res);
      expect(res.status).toHaveBeenCalledWith(204);
    });

    it('returns 404 for an incorrect code', () => {
      const res = makeRes();
      controller.verifySubscriber('wrong-code', res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('returns 404 when no code is supplied', () => {
      const res = makeRes();
      controller.verifySubscriber(undefined, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('returns 503 when the verification code is unconfigured', () => {
      delete process.env.FITBIT_SUBSCRIBER_VERIFICATION_CODE;
      const res = makeRes();
      controller.verifySubscriber(VERIFY_CODE, res);
      expect(res.status).toHaveBeenCalledWith(503);
    });
  });

  describe('handleNotifications — signature verification', () => {
    it('returns 503 when the client secret is unconfigured', async () => {
      delete process.env.FITBIT_CLIENT_SECRET;
      const body = notificationBody();
      const res = makeRes();

      await controller.handleNotifications(makeReq(body, sign(body)) as any, res);

      expect(res.status).toHaveBeenCalledWith(503);
      expect(fitbitSync.resolveUserByFitbitId).not.toHaveBeenCalled();
    });

    it('rejects an unsigned request with 401 and audit-logs it', async () => {
      const res = makeRes();

      await controller.handleNotifications(makeReq(notificationBody()) as any, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(truthLog.appendEvent).toHaveBeenCalledWith(
        'FITBIT_WEBHOOK_REJECTED',
        expect.objectContaining({ reason: 'MISSING_SIGNATURE', ip: '203.0.113.7' }),
      );
      expect(fitbitSync.resolveUserByFitbitId).not.toHaveBeenCalled();
      expect(fitbitService.processReadinessState).not.toHaveBeenCalled();
    });

    it('rejects an invalid signature with 401 and audit-logs it', async () => {
      const body = notificationBody();
      const res = makeRes();

      await controller.handleNotifications(
        makeReq(body, sign(Buffer.from('[{"tampered":true}]'))) as any,
        res,
      );

      expect(res.status).toHaveBeenCalledWith(401);
      expect(truthLog.appendEvent).toHaveBeenCalledWith(
        'FITBIT_WEBHOOK_REJECTED',
        expect.objectContaining({ reason: 'INVALID_SIGNATURE' }),
      );
      expect(fitbitSync.fetchDailySummary).not.toHaveBeenCalled();
      expect(fitbitService.processReadinessState).not.toHaveBeenCalled();
    });

    it('rejects a signature computed with a different secret', async () => {
      const body = notificationBody();
      const forged = createHmac('sha1', 'attacker-secret&').update(body).digest('base64');
      const res = makeRes();

      await controller.handleNotifications(makeReq(body, forged) as any, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(fitbitService.processReadinessState).not.toHaveBeenCalled();
    });

    it('acknowledges but skips a replayed signed delivery (no re-processing)', async () => {
      const body = notificationBody();
      const signature = sign(body);
      pool.query.mockResolvedValue({
        rows: [{ id: 'contract-1', oath_category: 'RECOVERY_SLEEP' }],
        rowCount: 1,
      });

      const firstRes = makeRes();
      await controller.handleNotifications(makeReq(body, signature) as any, firstRes);
      expect(firstRes.status).toHaveBeenCalledWith(204);
      expect(fitbitSync.fetchDailySummary).toHaveBeenCalledTimes(1);

      const replayRes = makeRes();
      await controller.handleNotifications(makeReq(body, signature) as any, replayRes);

      expect(replayRes.status).toHaveBeenCalledWith(204);
      // The replay produced no additional fetch or credit.
      expect(fitbitSync.fetchDailySummary).toHaveBeenCalledTimes(1);
      expect(fitbitService.processReadinessState).toHaveBeenCalledTimes(1);
      expect(truthLog.appendEvent).toHaveBeenCalledWith(
        'FITBIT_WEBHOOK_REPLAY_SKIPPED',
        expect.objectContaining({ deliveryHash: expect.any(String) }),
      );
    });

    it('rejects a validly signed but malformed JSON body with 400', async () => {
      const body = Buffer.from('not-json-at-all');
      const res = makeRes();

      await controller.handleNotifications(makeReq(body, sign(body)) as any, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(truthLog.appendEvent).toHaveBeenCalledWith(
        'FITBIT_WEBHOOK_REJECTED',
        expect.objectContaining({ reason: 'MALFORMED_BODY' }),
      );
    });
  });

  describe('handleNotifications — fetch-on-notify flow', () => {
    it('fetches data server-side and credits READY state for recovery contracts', async () => {
      const body = notificationBody();
      pool.query.mockResolvedValue({
        rows: [
          { id: 'contract-1', oath_category: 'RECOVERY_SLEEP' },
          { id: 'contract-2', oath_category: 'SOBRIETY_ALCOHOL' },
        ],
        rowCount: 2,
      });
      const res = makeRes();

      await controller.handleNotifications(makeReq(body, sign(body)) as any, res);

      expect(res.status).toHaveBeenCalledWith(204);
      expect(fitbitSync.resolveUserByFitbitId).toHaveBeenCalledWith('FB123');
      expect(fitbitSync.fetchDailySummary).toHaveBeenCalledWith('user-1', '2026-07-29');

      // Only the RECOVERY_ contract is credited, with verified provenance and
      // values from the SERVER-SIDE fetch (not the notification body).
      expect(fitbitService.processReadinessState).toHaveBeenCalledTimes(1);
      expect(fitbitService.processReadinessState).toHaveBeenCalledWith(
        expect.objectContaining({
          provenance: FitbitDataProvenance.VERIFIED_WEBHOOK,
          userId: 'user-1',
          contractId: 'contract-1',
          state: 'READY',
          sleepScore: 93,
          restingHeartRate: 52,
          source: 'fitbit-verified-webhook',
        }),
      );
      expect(fitbitService.processSleepData).toHaveBeenCalledWith(
        expect.objectContaining({
          provenance: FitbitDataProvenance.VERIFIED_WEBHOOK,
          contractId: 'contract-1',
          sleepMinutes: 412,
          sleepDate: '2026-07-29',
          deepSleepMinutes: 80,
          remSleepMinutes: 100,
        }),
      );
    });

    it('never credits when Fitbit only has manually-typed sleep for the day', async () => {
      fitbitSync.fetchDailySummary.mockResolvedValue(
        deviceSummary({ deviceLoggedMainSleep: null, manualSleepOnly: true, restingHeartRate: undefined }),
      );
      const body = notificationBody();
      const res = makeRes();

      await controller.handleNotifications(makeReq(body, sign(body)) as any, res);

      expect(res.status).toHaveBeenCalledWith(204);
      expect(fitbitService.processReadinessState).not.toHaveBeenCalled();
      expect(fitbitService.processSleepData).not.toHaveBeenCalled();
      expect(truthLog.appendEvent).toHaveBeenCalledWith(
        'FITBIT_MANUAL_SLEEP_REJECTED',
        expect.objectContaining({ userId: 'user-1', date: '2026-07-29' }),
      );
    });

    it('audit-logs and skips notifications for unlinked Fitbit owners', async () => {
      fitbitSync.resolveUserByFitbitId.mockResolvedValue(null);
      const body = notificationBody({ ownerId: 'FB999' });
      const res = makeRes();

      await controller.handleNotifications(makeReq(body, sign(body)) as any, res);

      expect(res.status).toHaveBeenCalledWith(204);
      expect(fitbitSync.fetchDailySummary).not.toHaveBeenCalled();
      expect(truthLog.appendEvent).toHaveBeenCalledWith(
        'FITBIT_WEBHOOK_UNKNOWN_OWNER',
        expect.objectContaining({ fitbitUserId: 'FB999' }),
      );
    });

    it('skips non-sleep collections without resolving the owner', async () => {
      const body = notificationBody({ collectionType: 'foods' });
      const res = makeRes();

      await controller.handleNotifications(makeReq(body, sign(body)) as any, res);

      expect(res.status).toHaveBeenCalledWith(204);
      expect(fitbitSync.resolveUserByFitbitId).not.toHaveBeenCalled();
      expect(fitbitService.processReadinessState).not.toHaveBeenCalled();
    });

    it('still acknowledges the batch when one notification fails to process', async () => {
      fitbitSync.fetchDailySummary.mockRejectedValue(new Error('fitbit down'));
      const body = notificationBody();
      const res = makeRes();

      await controller.handleNotifications(makeReq(body, sign(body)) as any, res);

      expect(res.status).toHaveBeenCalledWith(204);
      expect(fitbitService.processReadinessState).not.toHaveBeenCalled();
    });
  });
});
