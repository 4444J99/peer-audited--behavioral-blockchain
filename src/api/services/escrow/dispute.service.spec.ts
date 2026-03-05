import { DisputeService } from './dispute.service';
import { StripeFboService } from './stripe.service';
import { HttpException, HttpStatus } from '@nestjs/common';
import { Pool } from 'pg';
import { LedgerService } from '../ledger/ledger.service';
import { TruthLogService } from '../ledger/truth-log.service';

describe('DisputeService', () => {
  let disputeService: DisputeService;

  let mockStripeService: any;
  let mockPool: any;
  let mockTruthLog: any;
  let mockLedger: any;

  beforeEach(() => {
    mockStripeService = {
      holdStake: jest.fn(),
      captureStake: jest.fn(),
      cancelHold: jest.fn(),
      refundStake: jest.fn(),
      transferBounty: jest.fn(),
    };

    mockPool = {
      query: jest.fn(),
      connect: jest.fn(),
    };

    mockTruthLog = {
      appendEvent: jest.fn(),
    };

    mockLedger = {
      recordTransaction: jest.fn(),
    };

    const stripeMock = {
      holdStake: jest.fn(),
      captureStake: jest.fn(),
      cancelHold: jest.fn(),
      refundStake: jest.fn(),
      transferBounty: jest.fn(),
    } as unknown as StripeFboService;

    mockStripeService = stripeMock;

    disputeService = new DisputeService(
      mockPool as unknown as Pool,
      stripeMock,
      mockTruthLog as any,
      mockLedger as any,
    );
    jest.clearAllMocks();
  });

  describe('initiateAppeal', () => {
    it('should successfully initiate an appeal if the $5 fee holds', async () => {
      (mockStripeService.holdStake as jest.Mock).mockResolvedValueOnce({
        id: 'pi_test_appeal_fee',
        status: 'requires_capture',
      });

      const result = await disputeService.initiateAppeal('user-1', 'proof-1', 'cus_123');

      expect(result.appealStatus).toBe('FEE_AUTHORIZED_PENDING_REVIEW');
      expect(result.paymentIntentId).toBe('pi_test_appeal_fee');

      const holdCallArgs = (mockStripeService.holdStake as jest.Mock).mock.calls[0];
      expect(holdCallArgs[0]).toBe('cus_123');
      expect(holdCallArgs[1]).toBe(500); // Asserts the APPEAL_FEE_AMOUNT is 500 cents ($5.00)
    });

    it('should throw HttpException (402) if the appeal fee cannot be authorized', async () => {
      (mockStripeService.holdStake as jest.Mock).mockRejectedValue(new Error('Card declined'));

      const promise = disputeService.initiateAppeal('user-2', 'proof-2', 'cus_456');
      await expect(promise).rejects.toThrow(HttpException);
      await expect(promise).rejects.toThrow(/Could not authorize the \$5\.00 appeal fee/);
    });

    it('should return 500 and attempt compensation when DB persistence fails after fee authorization', async () => {
      (mockStripeService.holdStake as jest.Mock).mockResolvedValueOnce({
        id: 'pi_appeal_tx_1',
        status: 'requires_capture',
      });
      (mockStripeService.cancelHold as jest.Mock).mockResolvedValueOnce({ id: 'pi_appeal_tx_1' });

      const client = {
        query: jest.fn()
          .mockResolvedValueOnce({ rows: [] }) // BEGIN
          .mockRejectedValueOnce(new Error('db unavailable')) // dispute insert
          .mockResolvedValueOnce({ rows: [] }), // ROLLBACK
        release: jest.fn(),
      };
      mockPool.connect.mockResolvedValueOnce(client);

      let caught: HttpException | null = null;
      try {
        await disputeService.initiateAppeal('user-1', 'proof-1', 'cus_123');
      } catch (err) {
        caught = err as HttpException;
      }

      expect(caught).toBeInstanceOf(HttpException);
      expect(caught?.getStatus()).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(mockStripeService.cancelHold).toHaveBeenCalledWith('pi_appeal_tx_1');
      expect(client.query).toHaveBeenCalledWith('ROLLBACK');
    });
  });

  describe('getDisputeQueue', () => {
    it('should return pending disputes ordered by creation date', async () => {
      const rows = [
        { id: 'dispute-1', proof_id: 'proof-1', user_id: 'user-1', appeal_status: 'FEE_AUTHORIZED_PENDING_REVIEW', created_at: '2026-03-01' },
        { id: 'dispute-2', proof_id: 'proof-2', user_id: 'user-2', appeal_status: 'IN_REVIEW', created_at: '2026-03-02' },
      ];
      mockPool.query.mockResolvedValueOnce({ rows });

      const result = await disputeService.getDisputeQueue();

      expect(result).toEqual(rows);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('FEE_AUTHORIZED_PENDING_REVIEW'),
      );
    });

    it('should return empty array when no pending disputes', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] });

      const result = await disputeService.getDisputeQueue();

      expect(result).toEqual([]);
    });
  });

  describe('getDisputeDetail', () => {
    it('should return full dispute detail with fury votes', async () => {
      mockPool.query
        .mockResolvedValueOnce({
          rows: [{
            id: 'dispute-1',
            proof_id: 'proof-1',
            contract_id: 'contract-1',
            user_id: 'user-1',
            user_email: 'user@styx.app',
            oath_category: 'DEEP_WORK_FOCUS',
            proof_status: 'DISPUTED',
            media_uri: 'proofs/123.mp4',
            submitted_at: '2026-03-01',
            appeal_status: 'FEE_AUTHORIZED_PENDING_REVIEW',
            judge_user_id: null,
            judge_notes: null,
            resolved_at: null,
          }],
        })
        .mockResolvedValueOnce({
          rows: [
            { furyUserId: 'fury-1', verdict: 'FAIL', reviewedAt: '2026-03-01' },
            { furyUserId: 'fury-2', verdict: 'PASS', reviewedAt: '2026-03-01' },
          ],
        });

      const result = await disputeService.getDisputeDetail('dispute-1');

      expect(result.id).toBe('dispute-1');
      expect(result.proofId).toBe('proof-1');
      expect(result.contractId).toBe('contract-1');
      expect(result.userEmail).toBe('user@styx.app');
      expect(result.furyVotes).toHaveLength(2);
    });

    it('should throw NotFoundException when dispute does not exist', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] });

      await expect(disputeService.getDisputeDetail('nonexistent'))
        .rejects
        .toThrow('Dispute not found');
    });
  });

  describe('getAuditTrail', () => {
    it('should compose dispute detail with event log and ledger entries', async () => {
      // Mock getDisputeDetail (two queries: dispute + fury votes)
      mockPool.query
        .mockResolvedValueOnce({
          rows: [{
            id: 'dispute-1',
            proof_id: 'proof-1',
            contract_id: 'contract-1',
            user_id: 'user-1',
            user_email: 'user@styx.app',
            oath_category: 'DEEP_WORK_FOCUS',
            proof_status: 'DISPUTED',
            media_uri: null,
            submitted_at: '2026-03-01',
            appeal_status: 'FEE_AUTHORIZED_PENDING_REVIEW',
            judge_user_id: null,
            judge_notes: null,
            resolved_at: null,
          }],
        })
        .mockResolvedValueOnce({ rows: [] }) // fury votes
        .mockResolvedValueOnce({
          rows: [
            { id: 'evt-1', event_type: 'APPEAL_INITIATED', payload: { proofId: 'proof-1' }, created_at: '2026-03-01' },
          ],
        }) // event_log
        .mockResolvedValueOnce({
          rows: [
            { id: 'entry-1', amount: 500, debit_account: 'user-acct', credit_account: 'escrow', created_at: '2026-03-01', metadata: null },
          ],
        }); // ledger entries

      const result = await disputeService.getAuditTrail('dispute-1');

      expect(result.dispute.id).toBe('dispute-1');
      expect(result.timeline).toHaveLength(1);
      expect(result.timeline[0].type).toBe('EVENT');
      expect(result.timeline[0].eventType).toBe('APPEAL_INITIATED');
      expect(result.ledger).toHaveLength(1);
      expect(result.ledger[0].type).toBe('LEDGER');
      expect(result.ledger[0].amount).toBe(500);
    });

    it('should propagate NotFoundException if dispute does not exist', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] });

      await expect(disputeService.getAuditTrail('nonexistent'))
        .rejects
        .toThrow('Dispute not found');
    });
  });

  describe('resolveDispute', () => {
    it('should queue appeal-fee capture in outbox and avoid Stripe call inside resolution transaction', async () => {
      const client = {
        query: jest.fn()
          .mockResolvedValueOnce({ rows: [] }) // BEGIN
          .mockResolvedValueOnce({
            rows: [{
              id: 'dispute-1',
              proof_id: 'proof-1',
              user_id: 'user-1',
              payment_intent_id: 'pi_appeal_1',
              contract_id: 'contract-1',
            }],
          }) // SELECT dispute
          .mockResolvedValueOnce({ rows: [] }) // UPDATE disputes
          .mockResolvedValueOnce({ rows: [] }) // UPDATE proofs
          .mockResolvedValueOnce({ rows: [] }) // INSERT outbox
          .mockResolvedValueOnce({ rows: [] }), // COMMIT
        release: jest.fn(),
      };
      mockPool.connect.mockResolvedValueOnce(client);
      mockTruthLog.appendEvent.mockResolvedValueOnce('event-1');

      const result = await disputeService.resolveDispute(
        'dispute-1',
        'judge-1',
        'UPHELD',
        'Original verdict stands',
      );

      expect(result.status).toBe('RESOLVED_UPHELD');
      expect(mockStripeService.captureStake).not.toHaveBeenCalled();
      expect(mockStripeService.cancelHold).not.toHaveBeenCalled();

      const outboxInsertCall = client.query.mock.calls.find(
        ([sql]: [string]) => typeof sql === 'string' && sql.includes('INSERT INTO contract_resolution_side_effects'),
      );
      expect(outboxInsertCall).toBeDefined();
      expect(outboxInsertCall?.[1][2]).toBe('STRIPE_CAPTURE_APPEAL_FEE');
      expect(outboxInsertCall?.[1][3]).toContain('dispute-resolution:dispute-1:UPHELD:stripe');
    });
  });
});
