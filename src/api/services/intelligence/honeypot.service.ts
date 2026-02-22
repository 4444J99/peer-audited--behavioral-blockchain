import { Injectable } from '@nestjs/common';
import { FuryRouterService } from '../fury-router/fury-router.service';
import { FRAUD_PENALTY } from '../../../shared/libs/integrity';
import * as crypto from 'crypto';

@Injectable()
export class HoneypotInjectorService {
  constructor(private readonly furyRouter: FuryRouterService) {}

  /**
   * Generates a Known-Fail proof payload meant to artificially trigger 
   * a peer-auditor review. If a reviewer approves this proof, they receive
   * a hard FRAUD_PENALTY deduction to their integrity score.
   */
  async injectKnownFail(): Promise<string> {
    // 1. Generate a cryptographically secure fake proof ID so reviewers can't guess it's a test
    const fakeProofId = `HONEYPOT_FAIL_${crypto.randomBytes(8).toString('hex')}`;
    
    // 2. The submitter is a system admin / ghost account
    const systemSubmitterId = 'SYSTEM_HONEYPOT_ORACLE';

    // 3. Route it onto the queue exactly like a real proof
    const jobId = await this.furyRouter.routeProof(fakeProofId, systemSubmitterId, 3);
    
    // 4. In production, this stores the expected 'FAIL' verdict into the DB 
    // alongside the fakeProofId so the worker knows it's grading a test.

    return jobId;
  }
}
