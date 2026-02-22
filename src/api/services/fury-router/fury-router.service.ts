import { Injectable, OnModuleInit } from '@nestjs/common';
import { Queue } from 'bullmq';
import { FURY_ROUTER_QUEUE_NAME, getDefaultQueueOptions } from '../../config/queue.config';

@Injectable()
export class FuryRouterService implements OnModuleInit {
  private queue: Queue;

  onModuleInit() {
    this.queue = new Queue(FURY_ROUTER_QUEUE_NAME, getDefaultQueueOptions());
  }

  // Expose setter for dependency injection / mocking in tests
  setQueue(mockQueue: Queue) {
    this.queue = mockQueue;
  }

  /**
   * Routes a submitted proof video to N random anonymous reviewers.
   * Ensures the original submitter cannot review their own proof.
   */
  async routeProof(
    proofId: string, 
    submitterUserId: string, 
    requiredReviewers: number = 3
  ): Promise<string> {
    
    // In the real worker implementation, this job will query the database 
    // to find N staked/eligible furies where fury_id != submitterUserId, 
    // and then create review_assignments. We enqueue the intent here.
    
    const jobData = {
      proofId,
      submitterUserId,
      requiredReviewers,
      dispatchedAt: new Date().toISOString()
    };

    const job = await this.queue.add('route-fury-review', jobData, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 }
    });

    return job.id ? job.id.toString() : 'fallback-job-id';
  }
}
