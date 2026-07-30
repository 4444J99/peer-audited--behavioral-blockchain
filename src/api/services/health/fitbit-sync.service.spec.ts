import { Pool } from 'pg';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { FitbitSyncService } from './fitbit-sync.service';

const jsonResponse = (status: number, body: unknown) => ({
  ok: status >= 200 && status < 300,
  status,
  json: jest.fn().mockResolvedValue(body),
  text: jest.fn().mockResolvedValue(JSON.stringify(body)),
});

const tokenBody = (overrides: Record<string, unknown> = {}) => ({
  access_token: 'access-1',
  refresh_token: 'refresh-1',
  expires_in: 28800,
  user_id: 'FB123',
  scope: 'sleep heartrate',
  ...overrides,
});

describe('FitbitSyncService', () => {
  let service: FitbitSyncService;
  let pool: jest.Mocked<Pool>;
  let fetchMock: jest.Mock;
  const originalFetch = (global as any).fetch;
  const originalEnv = {
    FITBIT_CLIENT_ID: process.env.FITBIT_CLIENT_ID,
    FITBIT_CLIENT_SECRET: process.env.FITBIT_CLIENT_SECRET,
    FITBIT_REDIRECT_URI: process.env.FITBIT_REDIRECT_URI,
  };

  beforeEach(() => {
    pool = { query: jest.fn() } as any;
    fetchMock = jest.fn();
    (global as any).fetch = fetchMock;
    process.env.FITBIT_CLIENT_ID = 'client-id';
    process.env.FITBIT_CLIENT_SECRET = 'client-secret'; // allow-secret
    delete process.env.FITBIT_REDIRECT_URI;
    service = new FitbitSyncService(pool);
  });

  afterEach(() => {
    (global as any).fetch = originalFetch;
    for (const [key, value] of Object.entries(originalEnv)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });

  const freshTokenRow = (overrides: Record<string, unknown> = {}) => ({
    fitbit_user_id: 'FB123',
    access_token: 'stored-access',
    access_token_expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    refresh_token: 'stored-refresh',
    ...overrides,
  });

  describe('connectUser', () => {
    it('exchanges the code with Basic auth, persists the grant, and subscribes', async () => {
      fetchMock
        .mockResolvedValueOnce(jsonResponse(200, tokenBody()))
        .mockResolvedValueOnce(jsonResponse(200, {}));
      pool.query.mockResolvedValueOnce({ rows: [], rowCount: 1 } as any);

      const result = await service.connectUser('user-1', 'auth-code', 'https://app.example/cb');

      expect(result).toEqual({
        connected: true,
        fitbitUserId: 'FB123',
        scope: 'sleep heartrate',
        subscribed: true,
      });

      const [tokenUrl, tokenInit] = fetchMock.mock.calls[0];
      expect(tokenUrl).toBe('https://api.fitbit.com/oauth2/token');
      expect(tokenInit.method).toBe('POST');
      expect(tokenInit.headers.Authorization).toBe(
        `Basic ${Buffer.from('client-id:client-secret').toString('base64')}`,
      );
      expect(tokenInit.body).toContain('grant_type=authorization_code');
      expect(tokenInit.body).toContain('code=auth-code');
      expect(tokenInit.body).toContain(`redirect_uri=${encodeURIComponent('https://app.example/cb')}`);

      const [insertSql, insertParams] = (pool.query as jest.Mock).mock.calls[0];
      expect(insertSql).toContain('INSERT INTO fitbit_oauth_tokens');
      expect(insertParams[0]).toBe('user-1');
      expect(insertParams[1]).toBe('FB123');
      expect(insertParams[2]).toBe('access-1');
      expect(insertParams[4]).toBe('refresh-1');

      const [subUrl, subInit] = fetchMock.mock.calls[1];
      expect(subUrl).toBe('https://api.fitbit.com/1/user/-/sleep/apiSubscriptions/user-1.json');
      expect(subInit.method).toBe('POST');
    });

    it('reports subscribed: false when the subscription call fails', async () => {
      fetchMock
        .mockResolvedValueOnce(jsonResponse(200, tokenBody()))
        .mockResolvedValueOnce(jsonResponse(500, {}));
      pool.query.mockResolvedValueOnce({ rows: [], rowCount: 1 } as any);

      const result = await service.connectUser('user-1', 'auth-code');
      expect(result.subscribed).toBe(false);
    });

    it('maps a fitbit_user_id unique violation to ConflictException (anti-Sybil)', async () => {
      fetchMock.mockResolvedValueOnce(jsonResponse(200, tokenBody()));
      pool.query.mockRejectedValueOnce(Object.assign(new Error('duplicate key'), { code: '23505' }));

      await expect(service.connectUser('user-2', 'auth-code')).rejects.toThrow(ConflictException);
    });

    it('rejects a failed token exchange', async () => {
      fetchMock.mockResolvedValueOnce(jsonResponse(400, { errors: [{ errorType: 'invalid_grant' }] }));

      await expect(service.connectUser('user-1', 'bad-code')).rejects.toThrow(BadRequestException);
      expect(pool.query).not.toHaveBeenCalled();
    });

    it('throws ServiceUnavailableException when credentials are unconfigured', async () => {
      delete process.env.FITBIT_CLIENT_ID;

      await expect(service.connectUser('user-1', 'auth-code')).rejects.toThrow(
        ServiceUnavailableException,
      );
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });

  describe('getValidAccessToken', () => {
    it('returns the stored token when still fresh without calling Fitbit', async () => {
      pool.query.mockResolvedValueOnce({ rows: [freshTokenRow()], rowCount: 1 } as any);

      const result = await service.getValidAccessToken('user-1');

      expect(result).toEqual({ accessToken: 'stored-access', fitbitUserId: 'FB123' });
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('refreshes an expired token and persists the ROTATED refresh token', async () => {
      pool.query
        .mockResolvedValueOnce({
          rows: [freshTokenRow({ access_token_expires_at: new Date(Date.now() - 1000).toISOString() })],
          rowCount: 1,
        } as any)
        .mockResolvedValueOnce({ rows: [], rowCount: 1 } as any);
      fetchMock.mockResolvedValueOnce(
        jsonResponse(200, tokenBody({ access_token: 'access-2', refresh_token: 'refresh-2' })),
      );

      const result = await service.getValidAccessToken('user-1');

      expect(result.accessToken).toBe('access-2');
      const [, tokenInit] = fetchMock.mock.calls[0];
      expect(tokenInit.body).toContain('grant_type=refresh_token');
      expect(tokenInit.body).toContain('refresh_token=stored-refresh');

      const [updateSql, updateParams] = (pool.query as jest.Mock).mock.calls[1];
      expect(updateSql).toContain('UPDATE fitbit_oauth_tokens');
      expect(updateParams[0]).toBe('access-2');
      expect(updateParams[2]).toBe('refresh-2');
      expect(updateParams[3]).toBe('user-1');
    });

    it('throws UnauthorizedException when the refresh grant is rejected', async () => {
      pool.query.mockResolvedValueOnce({
        rows: [freshTokenRow({ access_token: null, access_token_expires_at: null })],
        rowCount: 1,
      } as any);
      fetchMock.mockResolvedValueOnce(jsonResponse(401, { errors: [{ errorType: 'invalid_grant' }] }));

      await expect(service.getValidAccessToken('user-1')).rejects.toThrow(UnauthorizedException);
    });

    it('throws NotFoundException when the user has no stored grant', async () => {
      pool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

      await expect(service.getValidAccessToken('user-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('fetchDailySummary', () => {
    it('rejects malformed dates before any network call', async () => {
      await expect(
        service.fetchDailySummary('user-1', '2026-07-29/../../evil'),
      ).rejects.toThrow(BadRequestException);
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('parses device-detected main sleep and resting heart rate', async () => {
      pool.query.mockResolvedValueOnce({ rows: [freshTokenRow()], rowCount: 1 } as any);
      fetchMock
        .mockResolvedValueOnce(
          jsonResponse(200, {
            sleep: [
              {
                logId: 987654321,
                isMainSleep: true,
                logType: 'auto_detected',
                minutesAsleep: 412,
                efficiency: 93,
                levels: { summary: { deep: { minutes: 80 }, rem: { minutes: 100 } } },
              },
              { logId: 1, isMainSleep: false, logType: 'manual', minutesAsleep: 45 },
            ],
          }),
        )
        .mockResolvedValueOnce(
          jsonResponse(200, {
            'activities-heart': [{ dateTime: '2026-07-29', value: { restingHeartRate: 52 } }],
          }),
        );

      const summary = await service.fetchDailySummary('user-1', '2026-07-29');

      expect(summary).toEqual({
        date: '2026-07-29',
        deviceLoggedMainSleep: {
          logId: '987654321',
          minutesAsleep: 412,
          efficiency: 93,
          deepSleepMinutes: 80,
          remSleepMinutes: 100,
        },
        manualSleepOnly: false,
        restingHeartRate: 52,
      });

      const [sleepUrl, sleepInit] = fetchMock.mock.calls[0];
      expect(sleepUrl).toBe('https://api.fitbit.com/1.2/user/-/sleep/date/2026-07-29.json');
      expect(sleepInit.headers.Authorization).toBe('Bearer stored-access');
    });

    it('flags manual-only sleep and returns no device sleep', async () => {
      pool.query.mockResolvedValueOnce({ rows: [freshTokenRow()], rowCount: 1 } as any);
      fetchMock
        .mockResolvedValueOnce(
          jsonResponse(200, {
            sleep: [{ logId: 2, isMainSleep: true, logType: 'manual', minutesAsleep: 480 }],
          }),
        )
        .mockResolvedValueOnce(jsonResponse(200, { 'activities-heart': [] }));

      const summary = await service.fetchDailySummary('user-1', '2026-07-29');

      expect(summary.deviceLoggedMainSleep).toBeNull();
      expect(summary.manualSleepOnly).toBe(true);
      expect(summary.restingHeartRate).toBeUndefined();
    });

    it('falls back to the longest device log when none is flagged main', async () => {
      pool.query.mockResolvedValueOnce({ rows: [freshTokenRow()], rowCount: 1 } as any);
      fetchMock
        .mockResolvedValueOnce(
          jsonResponse(200, {
            sleep: [
              { logId: 3, isMainSleep: false, logType: 'auto_detected', minutesAsleep: 60 },
              { logId: 4, isMainSleep: false, logType: 'auto_detected', minutesAsleep: 300 },
            ],
          }),
        )
        .mockResolvedValueOnce(jsonResponse(200, { 'activities-heart': [] }));

      const summary = await service.fetchDailySummary('user-1', '2026-07-29');
      expect(summary.deviceLoggedMainSleep?.logId).toBe('4');
      expect(summary.deviceLoggedMainSleep?.minutesAsleep).toBe(300);
    });

    it('tolerates a failed heart-rate fetch (sleep alone decides readiness)', async () => {
      pool.query.mockResolvedValueOnce({ rows: [freshTokenRow()], rowCount: 1 } as any);
      fetchMock
        .mockResolvedValueOnce(
          jsonResponse(200, {
            sleep: [{ logId: 5, isMainSleep: true, logType: 'auto_detected', minutesAsleep: 400 }],
          }),
        )
        .mockResolvedValueOnce(jsonResponse(500, {}));

      const summary = await service.fetchDailySummary('user-1', '2026-07-29');
      expect(summary.deviceLoggedMainSleep?.minutesAsleep).toBe(400);
      expect(summary.restingHeartRate).toBeUndefined();
    });

    it('surfaces a failed sleep fetch as ServiceUnavailableException', async () => {
      pool.query.mockResolvedValueOnce({ rows: [freshTokenRow()], rowCount: 1 } as any);
      fetchMock.mockResolvedValueOnce(jsonResponse(502, {}));

      await expect(service.fetchDailySummary('user-1', '2026-07-29')).rejects.toThrow(
        ServiceUnavailableException,
      );
    });
  });

  describe('resolveUserByFitbitId', () => {
    it('returns the mapped user id', async () => {
      pool.query.mockResolvedValueOnce({ rows: [{ user_id: 'user-1' }], rowCount: 1 } as any);
      await expect(service.resolveUserByFitbitId('FB123')).resolves.toBe('user-1');
    });

    it('returns null for unknown fitbit users', async () => {
      pool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);
      await expect(service.resolveUserByFitbitId('FB999')).resolves.toBeNull();
    });
  });

  describe('disconnectUser', () => {
    it('returns disconnected: false when no grant exists', async () => {
      pool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

      await expect(service.disconnectUser('user-1')).resolves.toEqual({ disconnected: false });
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('removes the grant even when subscription teardown fails', async () => {
      pool.query
        // existence check
        .mockResolvedValueOnce({ rows: [{ user_id: 'user-1' }], rowCount: 1 } as any)
        // getValidAccessToken lookup
        .mockResolvedValueOnce({ rows: [freshTokenRow()], rowCount: 1 } as any)
        // DELETE row
        .mockResolvedValueOnce({ rows: [], rowCount: 1 } as any);
      fetchMock.mockRejectedValueOnce(new Error('network down'));

      await expect(service.disconnectUser('user-1')).resolves.toEqual({ disconnected: true });

      const deleteCall = (pool.query as jest.Mock).mock.calls[2];
      expect(String(deleteCall[0])).toContain('DELETE FROM fitbit_oauth_tokens');
      expect(deleteCall[1]).toEqual(['user-1']);
    });
  });
});
