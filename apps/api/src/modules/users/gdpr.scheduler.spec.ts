import { GdprScheduler } from './gdpr.scheduler';
import { GdprService } from './gdpr.service';

describe('GdprScheduler', () => {
  let scheduler: GdprScheduler;
  let mockGdprService: { processPendingDeletions: jest.Mock };

  beforeEach(() => {
    mockGdprService = { processPendingDeletions: jest.fn() };
    scheduler = new GdprScheduler(mockGdprService as unknown as GdprService);
    jest.clearAllMocks();
  });

  it('should call gdprService.processPendingDeletions', async () => {
    mockGdprService.processPendingDeletions.mockResolvedValueOnce({
      processed: 0,
      skipped: 0,
    });

    await scheduler.processPendingDeletions();

    expect(mockGdprService.processPendingDeletions).toHaveBeenCalledTimes(1);
  });

  it('should log when deletions are processed', async () => {
    mockGdprService.processPendingDeletions.mockResolvedValueOnce({
      processed: 3,
      skipped: 1,
    });

    const logSpy = jest.spyOn((scheduler as any).logger, 'log');

    await scheduler.processPendingDeletions();

    expect(logSpy).toHaveBeenCalledWith(
      'GDPR erasure sweep: processed=3, skipped=1',
    );
  });

  it('should not log when no work was done', async () => {
    mockGdprService.processPendingDeletions.mockResolvedValueOnce({
      processed: 0,
      skipped: 0,
    });

    const logSpy = jest.spyOn((scheduler as any).logger, 'log');

    await scheduler.processPendingDeletions();

    expect(logSpy).not.toHaveBeenCalled();
  });
});
