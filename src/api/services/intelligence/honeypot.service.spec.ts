import { HoneypotInjectorService } from './honeypot.service';
import { FuryRouterService } from '../fury-router/fury-router.service';

describe('HoneypotInjectorService', () => {
  let honeypotService: HoneypotInjectorService;
  
  const mockRouter = {
    routeProof: jest.fn(),
  } as unknown as FuryRouterService;

  beforeEach(() => {
    honeypotService = new HoneypotInjectorService(mockRouter);
    jest.clearAllMocks();
  });

  describe('injectKnownFail', () => {
    it('should generate a secure fake proof ID and route it to the system oracle', async () => {
      (mockRouter.routeProof as jest.Mock).mockResolvedValueOnce('mock-job-123');

      const result = await honeypotService.injectKnownFail();
      
      expect(result).toBe('mock-job-123');

      const routeCallArgs = (mockRouter.routeProof as jest.Mock).mock.calls[0];
      const injectedProofId = routeCallArgs[0];
      const submitterId = routeCallArgs[1];
      const requiredReviewers = routeCallArgs[2];

      // Verify it constructed a Honeypot specific ID prefix
      expect(injectedProofId).toMatch(/^HONEYPOT_FAIL_[a-f0-9]{16}$/);
      
      // Verify it used the system submitter
      expect(submitterId).toBe('SYSTEM_HONEYPOT_ORACLE');
      
      // Verify it requested 3 reviewers to test
      expect(requiredReviewers).toBe(3);
    });
  });
});
