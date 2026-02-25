import { HoneypotService } from './honeypot.service';
import { FuryRouterService } from '../fury-router/fury-router.service';

describe('HoneypotInjectorService', () => {
  let honeypotService: HoneypotService;

  const mockRouter = {
    routeProof: jest.fn(),
  } as unknown as FuryRouterService;

  const mockPool = { query: jest.fn(), connect: jest.fn() };
  const mockTruthLog = { appendEvent: jest.fn() };

  beforeEach(() => {
    honeypotService = new HoneypotService(mockPool as any, mockRouter, mockTruthLog as any);
    jest.clearAllMocks();
  });

  describe('injectHoneypot', () => {
    it('should query for furies and inject honeypot proof', async () => {
      (mockPool.query as jest.Mock).mockResolvedValueOnce({ rows: [{ count: '10' }] });
      (mockPool.query as jest.Mock).mockResolvedValueOnce({ rows: [{ id: 'contract-abc', user_id: 'user-xyz' }] });
      (mockPool.query as jest.Mock).mockResolvedValueOnce({ rows: [{ id: 'proof-hp-123' }] });
      (mockRouter.routeProof as jest.Mock).mockResolvedValueOnce('mock-job-123');

      await honeypotService.injectHoneypot();

      expect(mockRouter.routeProof).toHaveBeenCalledWith('proof-hp-123', 'user-xyz', 3);
      expect(mockTruthLog.appendEvent).toHaveBeenCalledWith('HONEYPOT_INJECTED', expect.any(Object));
    });

    it('should skip injection if not enough furies', async () => {
      (mockPool.query as jest.Mock).mockResolvedValueOnce({ rows: [{ count: '1' }] });

      await honeypotService.injectHoneypot();

      expect(mockRouter.routeProof).not.toHaveBeenCalled();
    });
  });
});
