import { FuryRouterService } from './fury-router.service';
import { Queue } from 'bullmq';

describe('FuryRouterService', () => {
  let service: FuryRouterService;
  
  // Create a mock Queue object
  const mockQueue = {
    add: jest.fn(),
  } as unknown as Queue;

  beforeEach(() => {
    service = new FuryRouterService();
    // Inject mock queue to avoid attempting actual Redis connections during tests
    service.setQueue(mockQueue);
    jest.clearAllMocks();
  });

  describe('routeProof', () => {
    it('should enqueue a job with the correct parameters and exclude submitter logic params', async () => {
      // Mock the queue returning a job object with an ID
      (mockQueue.add as jest.Mock).mockResolvedValueOnce({ id: 'bullmq-job-999' });

      const proofId = 'proof-uuid-123';
      const submitterId = 'user-abc';
      
      const returnedJobId = await service.routeProof(proofId, submitterId, 3);
      
      expect(returnedJobId).toBe('bullmq-job-999');
      
      const addCall = (mockQueue.add as jest.Mock).mock.calls[0];
      // Arg 0: job name
      expect(addCall[0]).toBe('route-fury-review');
      // Arg 1: job payload
      expect(addCall[1].proofId).toBe(proofId);
      expect(addCall[1].submitterUserId).toBe(submitterId);
      expect(addCall[1].requiredReviewers).toBe(3);
      expect(addCall[1].dispatchedAt).toBeDefined();
      // Arg 2: job options
      expect(addCall[2].attempts).toBe(3);
    });
  });
});
