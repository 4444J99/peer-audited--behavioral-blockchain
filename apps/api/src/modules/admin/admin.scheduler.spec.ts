import { AdminScheduler } from './admin.scheduler';
import { TruthLogService } from '../../../services/ledger/truth-log.service';

describe('AdminScheduler', () => {
  let scheduler: AdminScheduler;
  let truthLog: jest.Mocked<TruthLogService>;

  beforeEach(() => {
    truthLog = {
      verifyChain: jest.fn(),
      appendEvent: jest.fn(),
    } as any;
    scheduler = new AdminScheduler(truthLog);
  });

  it('should log success when chain is valid', async () => {
    truthLog.verifyChain.mockResolvedValue({ valid: true, checked: 42, corrupted: [] });
    const logSpy = jest.spyOn((scheduler as any).logger, 'log').mockImplementation();

    await scheduler.verifyHashChain();

    expect(truthLog.verifyChain).toHaveBeenCalled();
    expect(logSpy).toHaveBeenCalledWith('Hash chain verified: 42 events, all valid');
  });

  it('should log error when corruption is detected', async () => {
    truthLog.verifyChain.mockResolvedValue({ valid: false, checked: 10, corrupted: ['id-1', 'id-2'] });
    const errorSpy = jest.spyOn((scheduler as any).logger, 'error').mockImplementation();

    await scheduler.verifyHashChain();

    expect(errorSpy).toHaveBeenCalledWith('HASH CHAIN CORRUPTION: 2 corrupted entries');
  });
});
