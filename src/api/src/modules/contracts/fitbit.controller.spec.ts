import { GUARDS_METADATA } from '@nestjs/common/constants';
import { FitbitController } from './fitbit.controller';
import { FitbitService, FitbitDataProvenance } from '../../../services/health/fitbit.service';
import { FitbitSyncService } from '../../../services/health/fitbit-sync.service';
import { AuthGuard, IS_PUBLIC_KEY } from '../../../guards/auth.guard';

describe('FitbitController', () => {
  let controller: FitbitController;
  let fitbitService: { recordManualEntry: jest.Mock; processReadinessState: jest.Mock };
  let fitbitSync: { connectUser: jest.Mock; disconnectUser: jest.Mock };

  beforeEach(() => {
    fitbitService = {
      recordManualEntry: jest.fn().mockResolvedValue({
        status: 'recorded',
        provenance: FitbitDataProvenance.MANUAL,
        attestationApplied: false,
      }),
      processReadinessState: jest.fn(),
    };
    fitbitSync = {
      connectUser: jest.fn().mockResolvedValue({
        connected: true,
        fitbitUserId: 'FB123',
        scope: 'sleep',
        subscribed: true,
      }),
      disconnectUser: jest.fn().mockResolvedValue({ disconnected: true }),
    };
    controller = new FitbitController(
      fitbitService as unknown as FitbitService,
      fitbitSync as unknown as FitbitSyncService,
    );
  });

  it('applies AuthGuard at class level and exposes no @Public routes', () => {
    const guards = Reflect.getMetadata(GUARDS_METADATA, FitbitController) ?? [];
    expect(guards).toContain(AuthGuard);

    for (const handler of [
      FitbitController.prototype.connectFitbit,
      FitbitController.prototype.disconnectFitbit,
      FitbitController.prototype.submitManualEntry,
    ]) {
      expect(Reflect.getMetadata(IS_PUBLIC_KEY, handler)).toBeUndefined();
    }
  });

  it('no longer exposes the spoofable authenticated readiness self-POST', () => {
    // Gate 02: the old submitFitbitReadiness handler let the authenticated
    // user post their own "Fitbit" JSON and credit attestations. It must not
    // exist in any form on this controller.
    expect((FitbitController.prototype as any).submitFitbitReadiness).toBeUndefined();
    expect((controller as any).submitFitbitReadiness).toBeUndefined();
  });

  describe('connectFitbit', () => {
    it('delegates the OAuth code exchange to FitbitSyncService for the session user', async () => {
      const result = await controller.connectFitbit({ id: 'user-1' }, {
        code: 'auth-code',
        redirectUri: 'https://app.example/cb',
      } as any);

      expect(fitbitSync.connectUser).toHaveBeenCalledWith(
        'user-1',
        'auth-code',
        'https://app.example/cb',
      );
      expect(result.connected).toBe(true);
    });
  });

  describe('disconnectFitbit', () => {
    it('delegates to FitbitSyncService for the session user', async () => {
      const result = await controller.disconnectFitbit({ id: 'user-1' });
      expect(fitbitSync.disconnectUser).toHaveBeenCalledWith('user-1');
      expect(result).toEqual({ disconnected: true });
    });
  });

  describe('submitManualEntry', () => {
    it('records a journal entry that NEVER credits attestations', async () => {
      const result = await controller.submitManualEntry('contract-1', { id: 'user-1' }, {
        readinessScore: 100,
        sleepMinutes: 480,
        note: 'manual claim',
      } as any);

      expect(result.attestationApplied).toBe(false);
      expect(result.provenance).toBe(FitbitDataProvenance.MANUAL);

      // The manual route can only reach recordManualEntry — there is no
      // parameter through which provenance or state could be injected.
      expect(fitbitService.recordManualEntry).toHaveBeenCalledWith({
        contractId: 'contract-1',
        userId: 'user-1',
        readinessScore: 100,
        sleepScore: undefined,
        restingHeartRate: undefined,
        hrv: undefined,
        sleepMinutes: 480,
        note: 'manual claim',
      });
      expect(fitbitService.processReadinessState).not.toHaveBeenCalled();
    });
  });
});
