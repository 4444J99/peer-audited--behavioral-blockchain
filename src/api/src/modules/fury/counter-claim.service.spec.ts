import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { CounterClaimService } from './counter-claim.service';

describe('CounterClaimService (Issue #81)', () => {
  let service: CounterClaimService;
  let mockPool: any;
  let mockTruthLog: any;

  beforeEach(() => {
    mockPool = {
      query: jest.fn().mockResolvedValue({ rows: [] }),
    };
    mockTruthLog = {
      appendEvent: jest.fn().mockResolvedValue(true),
    };
    service = new CounterClaimService(mockPool, mockTruthLog);
  });

  it('files a counter-claim with $1.00 filing fee and logs event', async () => {
    const claim = await service.fileCounterClaim('user-1', {
      assignmentId: 'asgn-101',
      targetAuditorId: 'auditor-99',
      claimType: 'HARASSMENT',
      reason: 'Auditor repeatedly left hostile comments rejecting valid GPS proof',
      evidenceUrls: ['https://storage.styx.com/evidence-1.jpg'],
    });

    expect(claim.id).toMatch(/^ccl_/);
    expect(claim.claimantUserId).toBe('user-1');
    expect(claim.targetAuditorId).toBe('auditor-99');
    expect(claim.claimType).toBe('HARASSMENT');
    expect(claim.status).toBe('PENDING_JUDGE_REVIEW');
    expect(claim.filingFeeCents).toBe(100);
    expect(mockTruthLog.appendEvent).toHaveBeenCalledWith(
      'FURY_COUNTER_CLAIM_FILED',
      expect.objectContaining({
        claimId: claim.id,
        claimantUserId: 'user-1',
        targetAuditorId: 'auditor-99',
        claimType: 'HARASSMENT',
        filingFeeCents: 100,
      }),
    );
  });

  it('rejects frivolous or empty reason', async () => {
    await expect(
      service.fileCounterClaim('user-1', {
        claimType: 'BIAS',
        reason: 'too short',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('prevents duplicate pending claims on the same assignment', async () => {
    await service.fileCounterClaim('user-1', {
      assignmentId: 'asgn-same',
      claimType: 'RUBBER_STAMPING',
      reason: 'Auditor accepted proof without reviewing actual photos',
    });

    await expect(
      service.fileCounterClaim('user-1', {
        assignmentId: 'asgn-same',
        claimType: 'RUBBER_STAMPING',
        reason: 'Auditor accepted proof without reviewing actual photos',
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('substantiates claim, slashes auditor, and updates truth log', async () => {
    const claim = await service.fileCounterClaim('user-1', {
      targetAuditorId: 'bad-auditor-1',
      claimType: 'COLLUSION',
      reason: 'Auditor approved obvious fake proof for personal friend in pod',
    });

    const resolution = await service.adjudicateCounterClaim(claim.id, 'judge-42', {
      decision: 'SUBSTANTIATED',
      judgeNotes: 'Evidence confirms collusion; auditor confirmed acquaintance with subject',
      slashStakeAmountCents: 2500,
      integrityPenalty: 25,
    });

    expect(resolution.status).toBe('SUBSTANTIATED');
    expect(resolution.judgeUserId).toBe('judge-42');
    expect(resolution.resolvedAt).not.toBeNull();
    expect(mockTruthLog.appendEvent).toHaveBeenCalledWith(
      'FURY_AUDITOR_SLASHED_COUNTER_CLAIM',
      expect.objectContaining({
        claimId: claim.id,
        auditorId: 'bad-auditor-1',
        slashedCents: 2500,
        integrityPenalty: 25,
        judgeUserId: 'judge-42',
      }),
    );
  });

  it('dismisses frivolous claim and forfeits user filing fee', async () => {
    const claim = await service.fileCounterClaim('user-1', {
      claimType: 'BIAS',
      reason: 'Auditor rejected my dark photo even though rules say good lighting required',
    });

    const resolution = await service.adjudicateCounterClaim(claim.id, 'judge-42', {
      decision: 'DISMISSED_FRIVOLOUS',
      judgeNotes: 'Photo was completely black, auditor followed guideline correctly',
    });

    expect(resolution.status).toBe('DISMISSED_FRIVOLOUS');
    expect(mockTruthLog.appendEvent).toHaveBeenCalledWith(
      'FURY_COUNTER_CLAIM_DISMISSED_FRIVOLOUS',
      expect.objectContaining({
        claimId: claim.id,
        claimantUserId: 'user-1',
        forfeitedFeeCents: 100,
      }),
    );
  });

  it('triggers automatic investigation when auditor accumulates 3 or more adverse claims', async () => {
    const auditor = 'repeat-offender-auditor';

    for (let i = 0; i < 3; i++) {
      await service.fileCounterClaim(`claimant-${i}`, {
        targetAuditorId: auditor,
        claimType: 'RUBBER_STAMPING',
        reason: `Complaint ${i} showing auditor approving invalid timestamped receipts`,
      });
    }

    const history = await service.getAuditorCounterClaimHistory(auditor);
    expect(history.totalCounterClaims).toBe(3);
    expect(history.pendingClaims).toBe(3);
    expect(history.automaticInvestigationTriggered).toBe(true);
  });
});
