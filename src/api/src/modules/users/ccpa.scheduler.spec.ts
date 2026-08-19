import { CcpaScheduler } from './ccpa.scheduler';
import { CcpaService } from './ccpa.service';

describe('CcpaScheduler', () => {
  let scheduler: CcpaScheduler;
  let mockCcpaService: { processPendingDeletions: jest.Mock };

  beforeEach(() => {
    mockCcpaService = { processPendingDeletions: jest.fn() };
    scheduler = new CcpaScheduler(mockCcpaService as unknown as CcpaService);
    jest.clearAllMocks();
  });

  it('should call ccpaService.processPendingDeletions', async () => {
    mockCcpaService.processPendingDeletions.mockResolvedValueOnce({
      processed: 0,
      skipped: 0,
    });

    await scheduler.processPendingDeletions();

    expect(mockCcpaService.processPendingDeletions).toHaveBeenCalledTimes(1);
  });

  it('should log when deletions are processed', async () => {
    mockCcpaService.processPendingDeletions.mockResolvedValueOnce({
      processed: 2,
      skipped: 1,
    });

    const logSpy = jest.spyOn((scheduler as any).logger, 'log');

    await scheduler.processPendingDeletions();

    expect(logSpy).toHaveBeenCalledWith(
      'CCPA erasure sweep: processed=2, skipped=1',
    );
  });

  it('should not log when no work was done', async () => {
    mockCcpaService.processPendingDeletions.mockResolvedValueOnce({
      processed: 0,
      skipped: 0,
    });

    const logSpy = jest.spyOn((scheduler as any).logger, 'log');

    await scheduler.processPendingDeletions();

    expect(logSpy).not.toHaveBeenCalled();
  });

  it('should log a sweep that only produced failures', async () => {
    // skipped > 0 with processed === 0 still has to surface — a sweep that
    // fails every row must not look identical to a sweep with nothing to do.
    mockCcpaService.processPendingDeletions.mockResolvedValueOnce({
      processed: 0,
      skipped: 4,
    });

    const logSpy = jest.spyOn((scheduler as any).logger, 'log');

    await scheduler.processPendingDeletions();

    expect(logSpy).toHaveBeenCalledWith(
      'CCPA erasure sweep: processed=0, skipped=4',
    );
  });
});
