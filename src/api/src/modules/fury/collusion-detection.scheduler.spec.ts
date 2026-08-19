import { CollusionDetectionScheduler } from './collusion-detection.scheduler';
import {
  CollusionDetectionService,
  CollusionRing,
} from '../../../services/security/collusion-detection.service';

function ring(overrides: Partial<CollusionRing> = {}): CollusionRing {
  return {
    ringId: 'ring-1-1700000000000',
    furyIds: ['fury-a', 'fury-b'],
    confidence: 0.9,
    signals: [
      {
        pairKey: 'fury-a::fury-b',
        furyIds: ['fury-a', 'fury-b'],
        signalType: 'COORDINATED_VOTE',
        score: 0.95,
        evidence: {},
      },
      {
        pairKey: 'fury-a::fury-b',
        furyIds: ['fury-a', 'fury-b'],
        signalType: 'VERDICT_SYNC',
        score: 0.92,
        evidence: {},
      },
    ],
    recommendedAction: 'SANCTION',
    ...overrides,
  };
}

describe('CollusionDetectionScheduler', () => {
  let scheduler: CollusionDetectionScheduler;
  let collusion: { analyzeWindow: jest.Mock; sanctionRing: jest.Mock };

  beforeEach(() => {
    collusion = {
      analyzeWindow: jest.fn(),
      sanctionRing: jest.fn(),
    };
    scheduler = new CollusionDetectionScheduler(
      collusion as unknown as CollusionDetectionService,
    );
    jest.clearAllMocks();
  });

  it('analyzes a 24h window requiring corroboration from two signals', async () => {
    collusion.analyzeWindow.mockResolvedValue([]);

    await scheduler.sweepForCollusionRings();

    expect(collusion.analyzeWindow).toHaveBeenCalledWith(24, 2);
  });

  it('files SANCTION rings as enforcement cases', async () => {
    collusion.analyzeWindow.mockResolvedValue([ring()]);
    collusion.sanctionRing.mockResolvedValue(['case-1', 'case-2']);

    await scheduler.sweepForCollusionRings();

    expect(collusion.sanctionRing).toHaveBeenCalledTimes(1);
    expect(collusion.sanctionRing).toHaveBeenCalledWith(
      expect.objectContaining({ ringId: 'ring-1-1700000000000' }),
    );
  });

  it('files INVESTIGATE rings too — a case is a queue entry, not a penalty', async () => {
    collusion.analyzeWindow.mockResolvedValue([
      ring({ recommendedAction: 'INVESTIGATE', confidence: 0.75 }),
    ]);
    collusion.sanctionRing.mockResolvedValue(['case-1']);

    await scheduler.sweepForCollusionRings();

    expect(collusion.sanctionRing).toHaveBeenCalledTimes(1);
  });

  it('does not file MONITOR rings', async () => {
    collusion.analyzeWindow.mockResolvedValue([
      ring({ recommendedAction: 'MONITOR', confidence: 0.4 }),
    ]);

    await scheduler.sweepForCollusionRings();

    expect(collusion.sanctionRing).not.toHaveBeenCalled();
  });

  it('does not call sanctionRing when nothing was detected', async () => {
    collusion.analyzeWindow.mockResolvedValue([]);

    await scheduler.sweepForCollusionRings();

    expect(collusion.sanctionRing).not.toHaveBeenCalled();
  });

  it('keeps sweeping when one ring fails to file', async () => {
    collusion.analyzeWindow.mockResolvedValue([
      ring({ ringId: 'ring-bad' }),
      ring({ ringId: 'ring-good', furyIds: ['fury-c', 'fury-d'] }),
    ]);
    collusion.sanctionRing
      .mockRejectedValueOnce(new Error('insert exploded'))
      .mockResolvedValueOnce(['case-3']);
    const errorSpy = jest
      .spyOn((scheduler as any).logger, 'error')
      .mockImplementation();

    await scheduler.sweepForCollusionRings();

    expect(collusion.sanctionRing).toHaveBeenCalledTimes(2);
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('ring-bad'),
    );
  });

  it('swallows an analysis failure so the cron does not crash the scheduler', async () => {
    collusion.analyzeWindow.mockRejectedValue(new Error('pg down'));
    const errorSpy = jest
      .spyOn((scheduler as any).logger, 'error')
      .mockImplementation();

    await expect(scheduler.sweepForCollusionRings()).resolves.toBeUndefined();

    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('pg down'),
    );
    expect(collusion.sanctionRing).not.toHaveBeenCalled();
  });

  it('reports a re-detected ring as filed-zero rather than counting it again', async () => {
    collusion.analyzeWindow.mockResolvedValue([ring()]);
    // sanctionRing is idempotent per reviewer: a ring already awaiting review
    // returns no new case ids.
    collusion.sanctionRing.mockResolvedValue([]);
    const warnSpy = jest
      .spyOn((scheduler as any).logger, 'warn')
      .mockImplementation();

    await scheduler.sweepForCollusionRings();

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('0 filed, 0 enforcement case(s) opened'),
    );
  });
});
