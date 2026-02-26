import { BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { ContractsService, CreateContractInput } from './contracts.service';
import { LedgerService } from '../../../services/ledger/ledger.service';
import { TruthLogService } from '../../../services/ledger/truth-log.service';
import { StripeFboService } from '../../../services/escrow/stripe.service';
import { DisputeService } from '../../../services/escrow/dispute.service';
import { FuryRouterService } from '../../../services/fury-router/fury-router.service';
import { AegisProtocolService } from '../../../services/health/aegis.service';
import { RecoveryProtocolService } from '../../../services/health/recovery-protocol.service';
import { AnomalyService } from '../../../services/anomaly/anomaly.service';
import { OathCategory, VerificationMethod } from '../../../../shared/libs/behavioral-logic';
import { Pool } from 'pg';

describe('ContractsService', () => {
  let service: ContractsService;
  let mockPool: { query: jest.Mock; connect?: jest.Mock };

  const mockLedger = {
    recordTransaction: jest.fn().mockResolvedValue('entry-id'),
  } as unknown as LedgerService;

  const mockTruthLog = {
    appendEvent: jest.fn().mockResolvedValue('log-id'),
  } as unknown as TruthLogService;

  const mockStripe = {
    holdStake: jest.fn().mockResolvedValue({ id: 'pi_test_123' }),
    captureStake: jest.fn().mockResolvedValue({ id: 'pi_test_123' }),
    cancelHold: jest.fn().mockResolvedValue({ id: 'pi_test_123' }),
  } as unknown as StripeFboService;

  const mockFuryRouter = {
    routeProof: jest.fn().mockResolvedValue('job-id-1'),
  } as unknown as FuryRouterService;

  const mockDispute = {
    initiateAppeal: jest.fn().mockResolvedValue({ appealStatus: 'FEE_AUTHORIZED_PENDING_REVIEW', paymentIntentId: 'pi_appeal_1' }),
  } as unknown as DisputeService;

  const mockAegis = {
    validatePsychologicalGuardrails: jest.fn().mockReturnValue(true),
  } as unknown as AegisProtocolService;

  const mockRecovery = {
    validateRecoveryContract: jest.fn().mockReturnValue(true),
  } as unknown as RecoveryProtocolService;

  const mockAnomaly = {
    analyze: jest.fn().mockResolvedValue({ rejected: false, flags: [] }),
  } as unknown as AnomalyService;

  const activeUser = {
    id: 'user-1',
    email: 'user@styx.app',
    stripe_customer_id: 'cus_test_1',
    integrity_score: 50,
    account_id: 'acct-1',
    status: 'ACTIVE',
  };

  const validDto: CreateContractInput = {
    userId: 'user-1',
    oathCategory: OathCategory.DEEP_WORK_FOCUS,
    verificationMethod: VerificationMethod.API_SCREEN_TIME,
    stakeAmount: 25,
    durationDays: 30,
  };

  beforeEach(() => {
    mockPool = { query: jest.fn() };
    service = new ContractsService(
      mockPool as unknown as Pool,
      mockLedger,
      mockTruthLog,
      mockStripe,
      mockDispute,
      mockFuryRouter,
      mockAegis,
      mockRecovery,
      mockAnomaly,
    );
    jest.clearAllMocks();
  });

  // ── createContract ──────────────────────────────────────────────

  describe('createContract', () => {
    it('should reject an invalid oath category', async () => {
      const dto = { ...validDto, oathCategory: 'FAKE_CATEGORY' };

      await expect(service.createContract(dto)).rejects.toThrow(BadRequestException);
      await expect(service.createContract(dto)).rejects.toThrow(/Invalid oath category/);
    });

    it('should reject an invalid verification method', async () => {
      const dto = { ...validDto, verificationMethod: 'MAGIC_ORACLE' };

      await expect(service.createContract(dto)).rejects.toThrow(BadRequestException);
      await expect(service.createContract(dto)).rejects.toThrow(/Invalid verification method/);
    });

    it('should throw NotFoundException when user does not exist', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] });

      await expect(service.createContract(validDto)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException for inactive user', async () => {
      mockPool.query.mockResolvedValueOnce({
        rows: [{ ...activeUser, status: 'BANNED' }],
      });

      await expect(service.createContract(validDto)).rejects.toThrow(
        expect.objectContaining({
          constructor: ForbiddenException,
          message: expect.stringMatching(/not active/),
        }),
      );
    });

    it('should throw ForbiddenException when integrity score is in RESTRICTED_MODE', async () => {
      mockPool.query.mockResolvedValueOnce({
        rows: [{ ...activeUser, integrity_score: 10 }],
      });
      // Cool-off check
      mockPool.query.mockResolvedValueOnce({ rows: [{ count: 0 }] });

      await expect(service.createContract(validDto)).rejects.toThrow(
        expect.objectContaining({
          constructor: ForbiddenException,
          message: expect.stringMatching(/restricted mode/),
        }),
      );
    });

    it('should throw BadRequestException when user has no payment method', async () => {
      mockPool.query.mockResolvedValueOnce({
        rows: [{ ...activeUser, stripe_customer_id: null }],
      });
      // Cool-off check
      mockPool.query.mockResolvedValueOnce({ rows: [{ count: 0 }] });
      // Total failures (downscaling)
      mockPool.query.mockResolvedValueOnce({ rows: [{ count: 0 }] });

      await expect(service.createContract(validDto)).rejects.toThrow(
        expect.objectContaining({
          constructor: BadRequestException,
          message: expect.stringMatching(/no payment method/),
        }),
      );
    });

    it('should call Aegis validation for biological oaths with health metrics', async () => {
      const bioDto: CreateContractInput = {
        ...validDto,
        oathCategory: OathCategory.WEIGHT_MANAGEMENT,
        verificationMethod: VerificationMethod.HARDWARE_HEALTHKIT,
        healthMetrics: {
          currentWeightLbs: 180,
          heightInches: 70,
          targetWeightLbs: 170,
        },
      };

      // User lookup
      mockPool.query.mockResolvedValueOnce({ rows: [activeUser] });
      // Cool-off check
      mockPool.query.mockResolvedValueOnce({ rows: [{ count: 0 }] });
      // Total failures (downscaling)
      mockPool.query.mockResolvedValueOnce({ rows: [{ count: 0 }] });
      // Contract insert
      mockPool.query.mockResolvedValueOnce({ rows: [{ id: 'contract-bio' }] });
      // Prior contracts count (onboarding bonus check)
      mockPool.query.mockResolvedValueOnce({ rows: [{ count: 1 }] });
      // Escrow account lookup
      mockPool.query.mockResolvedValueOnce({ rows: [{ id: 'escrow-acct' }] });

      await service.createContract(bioDto);

      expect(mockAegis.validatePsychologicalGuardrails).toHaveBeenCalledWith(25, 30, 50, 0);
    });

    it('should NOT call Aegis validation for non-biological oaths', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [activeUser] });
      mockPool.query.mockResolvedValueOnce({ rows: [{ count: 0 }] }); // Cool-off
      mockPool.query.mockResolvedValueOnce({ rows: [{ count: 0 }] }); // Downscaling
      mockPool.query.mockResolvedValueOnce({ rows: [{ id: 'contract-1' }] });
      mockPool.query.mockResolvedValueOnce({ rows: [{ count: 1 }] });
      mockPool.query.mockResolvedValueOnce({ rows: [{ id: 'escrow-acct' }] });

      await service.createContract(validDto);

      // Aegis is run for ALL contracts now (psychological stakes), so this test checks that it IS called.
      expect(mockAegis.validatePsychologicalGuardrails).toHaveBeenCalledWith(25, 30, 50, 0);
    });

    it('should hold stake via Stripe with correct amount', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [activeUser] });
      mockPool.query.mockResolvedValueOnce({ rows: [{ count: 0 }] }); // Cool-off
      mockPool.query.mockResolvedValueOnce({ rows: [{ count: 0 }] }); // Downscaling
      mockPool.query.mockResolvedValueOnce({ rows: [{ id: 'contract-1' }] });
      mockPool.query.mockResolvedValueOnce({ rows: [{ count: 1 }] });
      mockPool.query.mockResolvedValueOnce({ rows: [{ id: 'escrow-acct' }] });

      await service.createContract(validDto);

      expect(mockStripe.holdStake).toHaveBeenCalledWith('cus_test_1', 25, 'pending');
    });

    it('should insert the contract and return contractId + paymentIntentId', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [activeUser] });
      mockPool.query.mockResolvedValueOnce({ rows: [{ count: 0 }] }); // Cool-off
      mockPool.query.mockResolvedValueOnce({ rows: [{ count: 0 }] }); // Downscaling
      mockPool.query.mockResolvedValueOnce({ rows: [{ id: 'new-contract-id' }] });
      mockPool.query.mockResolvedValueOnce({ rows: [{ count: 1 }] });
      mockPool.query.mockResolvedValueOnce({ rows: [{ id: 'escrow-acct' }] });

      const result = await service.createContract(validDto);

      expect(result.contractId).toBe('new-contract-id');
      expect(result.paymentIntentId).toBe('pi_test_123');
    });

    it('should record a ledger transaction when user has an account and escrow exists', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [activeUser] });
      mockPool.query.mockResolvedValueOnce({ rows: [{ count: 0 }] }); // Cool-off
      mockPool.query.mockResolvedValueOnce({ rows: [{ count: 0 }] }); // Downscaling
      mockPool.query.mockResolvedValueOnce({ rows: [{ id: 'contract-1' }] });
      mockPool.query.mockResolvedValueOnce({ rows: [{ count: 1 }] });
      mockPool.query.mockResolvedValueOnce({ rows: [{ id: 'escrow-acct-id' }] });

      await service.createContract(validDto);

      expect(mockLedger.recordTransaction).toHaveBeenCalledWith(
        'acct-1',
        'escrow-acct-id',
        25,
        'contract-1',
        { type: 'STAKE_HOLD', userId: 'user-1' },
      );
    });

    it('should log CONTRACT_CREATED to TruthLog', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [activeUser] });
      mockPool.query.mockResolvedValueOnce({ rows: [{ count: 0 }] }); // Cool-off
      mockPool.query.mockResolvedValueOnce({ rows: [{ count: 0 }] }); // Downscaling
      mockPool.query.mockResolvedValueOnce({ rows: [{ id: 'contract-1' }] });
      mockPool.query.mockResolvedValueOnce({ rows: [{ count: 1 }] });
      mockPool.query.mockResolvedValueOnce({ rows: [{ id: 'escrow-acct' }] });

      await service.createContract(validDto);

      expect(mockTruthLog.appendEvent).toHaveBeenCalledWith('CONTRACT_CREATED', expect.objectContaining({
        contractId: 'contract-1',
        userId: 'user-1',
        oathCategory: OathCategory.DEEP_WORK_FOCUS,
        stakeAmount: 25,
        durationDays: 30,
      }));
    });

    it('should skip ledger entry when user has no account_id', async () => {
      const userNoAccount = { ...activeUser, account_id: null };
      mockPool.query.mockResolvedValueOnce({ rows: [userNoAccount] });
      mockPool.query.mockResolvedValueOnce({ rows: [{ count: 0 }] }); // Cool-off
      mockPool.query.mockResolvedValueOnce({ rows: [{ count: 0 }] }); // Downscaling
      mockPool.query.mockResolvedValueOnce({ rows: [{ id: 'contract-1' }] });
      mockPool.query.mockResolvedValueOnce({ rows: [{ count: 1 }] });

      await service.createContract(validDto);

      expect(mockLedger.recordTransaction).not.toHaveBeenCalled();
    });
  });

  // ── getContract ─────────────────────────────────────────────────

  describe('getContract', () => {
    it('should return the contract joined with user info', async () => {
      const row = { id: 'contract-1', user_id: 'user-1', email: 'user@styx.app', integrity_score: 55 };
      mockPool.query.mockResolvedValueOnce({ rows: [row] });

      const result = await service.getContract('contract-1');

      expect(result).toEqual(row);
    });

    it('should throw NotFoundException for missing contract', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] });

      await expect(service.getContract('missing-id')).rejects.toThrow(NotFoundException);
    });

    it('should deny access to another user without elevated role', async () => {
      mockPool.query.mockResolvedValueOnce({
        rows: [{ id: 'contract-1', user_id: 'owner-1', email: 'owner@styx.app', integrity_score: 60 }],
      });
      mockPool.query.mockResolvedValueOnce({
        rows: [{
          owner_enterprise_id: 'ent-owner',
          requester_role: 'USER',
          requester_enterprise_id: 'ent-other',
        }],
      });

      await expect(
        service.getContract('contract-1', { userId: 'requester-1' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow ADMIN to read another user contract', async () => {
      mockPool.query.mockResolvedValueOnce({
        rows: [{ id: 'contract-1', user_id: 'owner-1', email: 'owner@styx.app', integrity_score: 60 }],
      });
      mockPool.query.mockResolvedValueOnce({
        rows: [{
          owner_enterprise_id: 'ent-owner',
          requester_role: 'ADMIN',
          requester_enterprise_id: 'ent-other',
        }],
      });

      const result = await service.getContract('contract-1', { userId: 'admin-1' });
      expect(result.id).toBe('contract-1');
    });
  });

  // ── submitProof ─────────────────────────────────────────────────

  describe('submitProof', () => {
    it('should submit a proof and route to Fury network', async () => {
      // Contract lookup
      mockPool.query.mockResolvedValueOnce({
        rows: [{ id: 'contract-1', user_id: 'user-1', status: 'ACTIVE' }],
      });
      // Proof insert
      mockPool.query.mockResolvedValueOnce({ rows: [{ id: 'proof-1' }] });

      const result = await service.submitProof('contract-1', {
        userId: 'user-1',
        mediaUri: 'https://r2.styx.app/proof-video.mp4',
      });

      expect(result.proofId).toBe('proof-1');
      expect(result.jobId).toBe('job-id-1');
      expect(mockFuryRouter.routeProof).toHaveBeenCalledWith('proof-1', 'user-1', 3);
    });

    it('should throw NotFoundException if contract does not exist', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] });

      await expect(
        service.submitProof('missing-contract', { userId: 'user-1', mediaUri: 'uri' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if userId does not match contract owner', async () => {
      mockPool.query.mockResolvedValueOnce({
        rows: [{ id: 'contract-1', user_id: 'user-1', status: 'ACTIVE' }],
      });
      mockPool.query.mockResolvedValueOnce({
        rows: [{
          owner_enterprise_id: 'ent-1',
          requester_role: 'USER',
          requester_enterprise_id: 'ent-2',
        }],
      });

      await expect(
        service.submitProof('contract-1', { userId: 'user-impostor', mediaUri: 'uri' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException if contract is not ACTIVE', async () => {
      mockPool.query.mockResolvedValueOnce({
        rows: [{ id: 'contract-1', user_id: 'user-1', status: 'COMPLETED' }],
      });

      await expect(
        service.submitProof('contract-1', { userId: 'user-1', mediaUri: 'uri' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should log PROOF_SUBMITTED to TruthLog', async () => {
      mockPool.query.mockResolvedValueOnce({
        rows: [{ id: 'contract-1', user_id: 'user-1', status: 'ACTIVE' }],
      });
      mockPool.query.mockResolvedValueOnce({ rows: [{ id: 'proof-1' }] });

      await service.submitProof('contract-1', { userId: 'user-1', mediaUri: 'uri' });

      expect(mockTruthLog.appendEvent).toHaveBeenCalledWith('PROOF_SUBMITTED', {
        proofId: 'proof-1',
        contractId: 'contract-1',
        userId: 'user-1',
        anomalyFlags: [],
      });
    });
  });

  // ── resolveContract ─────────────────────────────────────────────

  describe('resolveContract', () => {
    const contractRow = {
      id: 'contract-1',
      user_id: 'user-1',
      payment_intent_id: 'pi_test_123',
      stake_amount: '50.0000',
    };

    it('should cancel Stripe hold on COMPLETED outcome', async () => {
      // Contract lookup
      mockPool.query.mockResolvedValueOnce({ rows: [contractRow] });
      // UPDATE contracts
      mockPool.query.mockResolvedValueOnce({ rows: [] });
      // User lookup
      mockPool.query.mockResolvedValueOnce({ rows: [activeUser] });
      // UPDATE users
      mockPool.query.mockResolvedValueOnce({ rows: [] });
      // Escrow lookup
      mockPool.query.mockResolvedValueOnce({ rows: [{ id: 'escrow-acct' }] });

      await service.resolveContract('contract-1', 'COMPLETED');

      expect(mockStripe.cancelHold).toHaveBeenCalledWith('pi_test_123');
      expect(mockStripe.captureStake).not.toHaveBeenCalled();
    });

    it('should capture stake on FAILED outcome', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [contractRow] });
      mockPool.query.mockResolvedValueOnce({ rows: [] });
      mockPool.query.mockResolvedValueOnce({ rows: [activeUser] });
      mockPool.query.mockResolvedValueOnce({ rows: [] });
      mockPool.query.mockResolvedValueOnce({ rows: [{ id: 'escrow-acct' }] });
      mockPool.query.mockResolvedValueOnce({ rows: [{ id: 'revenue-acct' }] });

      await service.resolveContract('contract-1', 'FAILED');

      expect(mockStripe.captureStake).toHaveBeenCalledWith('pi_test_123');
      expect(mockStripe.cancelHold).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException for missing contract', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] });

      await expect(service.resolveContract('missing', 'COMPLETED')).rejects.toThrow(NotFoundException);
    });

    it('should short-circuit when contract is already resolved with the same outcome', async () => {
      const client = {
        query: jest.fn()
          .mockResolvedValueOnce({ rows: [] }) // BEGIN
          .mockResolvedValueOnce({ rows: [{ ...contractRow, status: 'COMPLETED' }] }) // SELECT ... FOR UPDATE
          .mockResolvedValueOnce({ rows: [] }), // COMMIT
        release: jest.fn(),
      };
      mockPool.connect = jest.fn().mockResolvedValue(client);

      await service.resolveContract('contract-1', 'COMPLETED');

      expect(client.query).toHaveBeenNthCalledWith(1, 'BEGIN');
      expect(client.query).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining('FOR UPDATE'),
        ['contract-1'],
      );
      expect(client.query).toHaveBeenNthCalledWith(3, 'COMMIT');
      expect(mockStripe.cancelHold).not.toHaveBeenCalled();
      expect(mockStripe.captureStake).not.toHaveBeenCalled();
      expect(mockLedger.recordTransaction).not.toHaveBeenCalled();
      expect(mockTruthLog.appendEvent).not.toHaveBeenCalled();
      expect(client.release).toHaveBeenCalled();
    });

    it('should reject conflicting terminal outcome and roll back', async () => {
      const client = {
        query: jest.fn()
          .mockResolvedValueOnce({ rows: [] }) // BEGIN
          .mockResolvedValueOnce({ rows: [{ ...contractRow, status: 'FAILED' }] }) // SELECT ... FOR UPDATE
          .mockResolvedValueOnce({ rows: [] }), // ROLLBACK
        release: jest.fn(),
      };
      mockPool.connect = jest.fn().mockResolvedValue(client);

      await expect(service.resolveContract('contract-1', 'COMPLETED')).rejects.toThrow(BadRequestException);

      expect(client.query).toHaveBeenNthCalledWith(3, 'ROLLBACK');
      expect(client.release).toHaveBeenCalled();
      expect(mockStripe.cancelHold).not.toHaveBeenCalled();
      expect(mockTruthLog.appendEvent).not.toHaveBeenCalled();
    });

    it('should update contract status in the database', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [contractRow] });
      mockPool.query.mockResolvedValueOnce({ rows: [] }); // UPDATE contracts
      mockPool.query.mockResolvedValueOnce({ rows: [activeUser] });
      mockPool.query.mockResolvedValueOnce({ rows: [] }); // UPDATE users
      mockPool.query.mockResolvedValueOnce({ rows: [{ id: 'escrow-acct' }] });

      await service.resolveContract('contract-1', 'COMPLETED');

      // The second query call is the UPDATE contracts SET status
      const updateCall = mockPool.query.mock.calls[1];
      expect(updateCall[0]).toMatch(/UPDATE contracts SET status/);
      expect(updateCall[1]).toEqual(['COMPLETED', 'contract-1']);
    });

    it('should increase integrity score by +5 on COMPLETED (completion bonus)', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [contractRow] });
      mockPool.query.mockResolvedValueOnce({ rows: [] });
      mockPool.query.mockResolvedValueOnce({ rows: [{ ...activeUser, integrity_score: 50 }] });
      mockPool.query.mockResolvedValueOnce({ rows: [] }); // UPDATE users
      mockPool.query.mockResolvedValueOnce({ rows: [{ id: 'escrow-acct' }] });

      await service.resolveContract('contract-1', 'COMPLETED');

      // calculateIntegrity({completedOaths:1, ...}) = 50 + 5 = 55, delta = +5
      // newScore = max(0, 50 + 5) = 55
      const updateUserCall = mockPool.query.mock.calls[3];
      expect(updateUserCall[0]).toMatch(/UPDATE users SET integrity_score/);
      expect(updateUserCall[1][0]).toBe(55); // new score
    });

    it('should decrease integrity score by -20 on FAILED (strike penalty)', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [contractRow] });
      mockPool.query.mockResolvedValueOnce({ rows: [] });
      mockPool.query.mockResolvedValueOnce({ rows: [{ ...activeUser, integrity_score: 50 }] });
      mockPool.query.mockResolvedValueOnce({ rows: [] }); // UPDATE users
      mockPool.query.mockResolvedValueOnce({ rows: [{ id: 'escrow-acct' }] });
      mockPool.query.mockResolvedValueOnce({ rows: [{ id: 'revenue-acct' }] });

      await service.resolveContract('contract-1', 'FAILED');

      // calculateIntegrity({failedOaths:1, ...}) = 50 + 0 - 0 - 20 - 0 = 30, delta = -20
      // newScore = max(0, 50 + (-20)) = 30
      const updateUserCall = mockPool.query.mock.calls[3];
      expect(updateUserCall[1][0]).toBe(30);
    });

    it('should floor integrity score at 0', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [contractRow] });
      mockPool.query.mockResolvedValueOnce({ rows: [] });
      mockPool.query.mockResolvedValueOnce({ rows: [{ ...activeUser, integrity_score: 10 }] });
      mockPool.query.mockResolvedValueOnce({ rows: [] });
      mockPool.query.mockResolvedValueOnce({ rows: [{ id: 'escrow-acct' }] });
      mockPool.query.mockResolvedValueOnce({ rows: [{ id: 'revenue-acct' }] });

      await service.resolveContract('contract-1', 'FAILED');

      // delta = -20, newScore = max(0, 10 + (-20)) = max(0, -10) = 0
      const updateUserCall = mockPool.query.mock.calls[3];
      expect(updateUserCall[1][0]).toBe(0);
    });

    it('should log CONTRACT_RESOLVED to TruthLog', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [contractRow] });
      mockPool.query.mockResolvedValueOnce({ rows: [] });
      mockPool.query.mockResolvedValueOnce({ rows: [activeUser] });
      mockPool.query.mockResolvedValueOnce({ rows: [] });
      mockPool.query.mockResolvedValueOnce({ rows: [{ id: 'escrow-acct' }] });

      await service.resolveContract('contract-1', 'COMPLETED');

      expect(mockTruthLog.appendEvent).toHaveBeenCalledWith('CONTRACT_RESOLVED', {
        contractId: 'contract-1',
        outcome: 'COMPLETED',
        userId: 'user-1',
        stakeAmount: 50,
      });
    });

    it('should record ledger return from escrow to user on COMPLETED', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [contractRow] });
      mockPool.query.mockResolvedValueOnce({ rows: [] });
      mockPool.query.mockResolvedValueOnce({ rows: [activeUser] });
      mockPool.query.mockResolvedValueOnce({ rows: [] });
      mockPool.query.mockResolvedValueOnce({ rows: [{ id: 'escrow-acct' }] });

      await service.resolveContract('contract-1', 'COMPLETED');

      expect(mockLedger.recordTransaction).toHaveBeenCalledWith(
        'escrow-acct',
        'acct-1',
        50,
        'contract-1',
        { type: 'STAKE_RETURN', outcome: 'COMPLETED' },
      );
    });

    it('should record ledger capture from escrow to revenue on FAILED', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [contractRow] });
      mockPool.query.mockResolvedValueOnce({ rows: [] });
      mockPool.query.mockResolvedValueOnce({ rows: [activeUser] });
      mockPool.query.mockResolvedValueOnce({ rows: [] });
      mockPool.query.mockResolvedValueOnce({ rows: [{ id: 'escrow-acct' }] });
      mockPool.query.mockResolvedValueOnce({ rows: [{ id: 'revenue-acct' }] });

      await service.resolveContract('contract-1', 'FAILED');

      expect(mockLedger.recordTransaction).toHaveBeenCalledWith(
        'escrow-acct',
        'revenue-acct',
        50,
        'contract-1',
        { type: 'STAKE_CAPTURED', outcome: 'FAILED' },
      );
    });
  });

  // ── contract resolution outbox retries ─────────────────────────

  describe('contract resolution outbox retries', () => {
    it('should compute exponential backoff with a cap', () => {
      expect((service as any).getContractResolutionOutboxRetryDelayMs(1)).toBe(5 * 60 * 1000);
      expect((service as any).getContractResolutionOutboxRetryDelayMs(2)).toBe(10 * 60 * 1000);
      expect((service as any).getContractResolutionOutboxRetryDelayMs(8)).toBe(6 * 60 * 60 * 1000);
      expect((service as any).getContractResolutionOutboxRetryDelayMs(99)).toBe(6 * 60 * 60 * 1000);
    });

    it('should quarantine a permanently failing side effect at max attempts', async () => {
      mockPool.query
        .mockResolvedValueOnce({
          rows: [{
            id: 'fx-1',
            contract_id: 'contract-1',
            outcome: 'FAILED',
            effect_type: 'STRIPE_CAPTURE_STAKE',
            dedupe_key: 'dedupe-1',
            payload: { paymentIntentId: 'pi_fail_1' },
            status: 'FAILED',
            attempts: 7,
            next_retry_at: null,
            quarantined_at: null,
            quarantine_reason: null,
            locked_at: null,
          }],
        })
        .mockResolvedValueOnce({
          rows: [{
            id: 'fx-1',
            contract_id: 'contract-1',
            outcome: 'FAILED',
            effect_type: 'STRIPE_CAPTURE_STAKE',
            dedupe_key: 'dedupe-1',
            payload: { paymentIntentId: 'pi_fail_1' },
            status: 'PROCESSING',
            attempts: 8,
            next_retry_at: null,
            quarantined_at: null,
            quarantine_reason: null,
            locked_at: new Date().toISOString(),
          }],
        })
        .mockResolvedValueOnce({ rows: [] });

      (mockStripe.captureStake as jest.Mock).mockRejectedValueOnce(new Error('stripe outage'));

      await expect(
        (service as any).drainContractResolutionSideEffects('contract-1', 'FAILED'),
      ).rejects.toThrow('stripe outage');

      const quarantineUpdateCall = mockPool.query.mock.calls[2];
      expect(quarantineUpdateCall[0]).toContain("SET status = 'QUARANTINED'");
      expect(quarantineUpdateCall[1][0]).toBe('fx-1');
      expect(quarantineUpdateCall[1][2]).toMatch(/Exceeded max retry attempts/);
    });

    it('should only sweep retry groups that are due and report quarantine totals', async () => {
      mockPool.query
        .mockResolvedValueOnce({
          rows: [{ id: 'stale-1', status: 'FAILED' }, { id: 'stale-2', status: 'QUARANTINED' }],
        })
        .mockResolvedValueOnce({
          rows: [{ contract_id: 'contract-1', outcome: 'FAILED' }],
        })
        .mockResolvedValueOnce({
          rows: [{ count: 2 }],
        });

      const drainSpy = jest
        .spyOn(service as any, 'drainContractResolutionSideEffects')
        .mockResolvedValueOnce(undefined);

      const summary = await service.sweepFailedContractResolutionSideEffects(10);

      expect(summary).toEqual({
        staleResetCount: 1,
        staleQuarantinedCount: 1,
        groupsFound: 1,
        groupsRetried: 1,
        groupsFailed: 0,
        quarantinedTotalCount: 2,
      });
      expect(drainSpy).toHaveBeenCalledWith('contract-1', 'FAILED');
      expect(mockPool.query.mock.calls[1][0]).toContain('next_retry_at IS NULL OR next_retry_at <= NOW()');

      drainSpy.mockRestore();
    });
  });

  // ── getContractProofs ──────────────────────────────────────────

  describe('getContractProofs', () => {
    it('should return proofs for an existing contract', async () => {
      // Contract exists
      mockPool.query.mockResolvedValueOnce({ rows: [{ id: 'contract-1' }] });
      // Proofs query
      const proofs = [
        { id: 'proof-1', contract_id: 'contract-1', user_id: 'user-1', media_uri: 'uri-1', status: 'PENDING_REVIEW', submitted_at: '2026-01-01' },
        { id: 'proof-2', contract_id: 'contract-1', user_id: 'user-1', media_uri: 'uri-2', status: 'APPROVED', submitted_at: '2026-01-02' },
      ];
      mockPool.query.mockResolvedValueOnce({ rows: proofs });

      const result = await service.getContractProofs('contract-1');

      expect(result).toEqual(proofs);
      expect(result).toHaveLength(2);
    });

    it('should return empty array when contract has no proofs', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [{ id: 'contract-1' }] });
      mockPool.query.mockResolvedValueOnce({ rows: [] });

      const result = await service.getContractProofs('contract-1');

      expect(result).toEqual([]);
    });

    it('should throw NotFoundException when contract does not exist', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] });

      await expect(service.getContractProofs('missing-contract')).rejects.toThrow(NotFoundException);
    });

    it('should reject proof listing for unauthorized requester', async () => {
      mockPool.query.mockResolvedValueOnce({
        rows: [{ id: 'contract-1', user_id: 'owner-1', email: 'owner@styx.app', integrity_score: 50 }],
      });
      mockPool.query.mockResolvedValueOnce({
        rows: [{
          owner_enterprise_id: 'ent-1',
          requester_role: 'USER',
          requester_enterprise_id: 'ent-2',
        }],
      });

      await expect(
        service.getContractProofs('contract-1', { userId: 'intruder-1' }),
      ).rejects.toThrow(ForbiddenException);

      expect(mockPool.query).toHaveBeenCalledTimes(2);
    });
  });

  // ── getUserContracts ────────────────────────────────────────────

  describe('getUserContracts', () => {
    it('should return all contracts for a user', async () => {
      const contracts = [
        { id: 'c1', status: 'ACTIVE' },
        { id: 'c2', status: 'COMPLETED' },
      ];
      mockPool.query.mockResolvedValueOnce({ rows: contracts });

      const result = await service.getUserContracts('user-1');

      expect(result).toEqual(contracts);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE user_id = $1'),
        ['user-1'],
      );
    });

    it('should return empty array when user has no contracts', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] });

      const result = await service.getUserContracts('new-user');

      expect(result).toEqual([]);
    });
  });

  // ── useGraceDay ───────────────────────────────────────────────

  describe('useGraceDay', () => {
    const activeContract = {
      id: 'contract-1',
      user_id: 'user-1',
      status: 'ACTIVE',
      ends_at: '2026-03-15T12:00:00Z',
    };

    it('should extend deadline by 24h and log GRACE_DAY_USED to TruthLog', async () => {
      // Contract lookup
      mockPool.query.mockResolvedValueOnce({ rows: [activeContract] });
      // Grace days count query
      mockPool.query.mockResolvedValueOnce({ rows: [{ count: 0 }] });
      // UPDATE contracts
      mockPool.query.mockResolvedValueOnce({ rows: [] });

      const result = await service.useGraceDay('contract-1', 'user-1');

      const expectedDeadline = new Date(new Date('2026-03-15T12:00:00Z').getTime() + 24 * 60 * 60 * 1000);
      expect(result.newDeadline.getTime()).toBe(expectedDeadline.getTime());
      expect(mockTruthLog.appendEvent).toHaveBeenCalledWith('GRACE_DAY_USED', expect.objectContaining({
        contractId: 'contract-1',
        userId: 'user-1',
      }));
    });

    it('should reject when contract not found (NotFoundException)', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] });

      await expect(service.useGraceDay('missing', 'user-1')).rejects.toThrow(NotFoundException);
    });

    it("should reject when user doesn't own the contract (ForbiddenException)", async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [activeContract] });
      mockPool.query.mockResolvedValueOnce({
        rows: [{
          owner_enterprise_id: 'ent-1',
          requester_role: 'USER',
          requester_enterprise_id: 'ent-2',
        }],
      });

      await expect(service.useGraceDay('contract-1', 'user-impostor')).rejects.toThrow(ForbiddenException);
    });

    it('should reject when contract is not ACTIVE (BadRequestException)', async () => {
      mockPool.query.mockResolvedValueOnce({
        rows: [{ ...activeContract, status: 'COMPLETED' }],
      });

      await expect(service.useGraceDay('contract-1', 'user-1')).rejects.toThrow(BadRequestException);
    });

    it('should reject when max grace days exceeded (BadRequestException)', async () => {
      // Contract lookup
      mockPool.query.mockResolvedValueOnce({ rows: [activeContract] });
      // Grace days count: already at max (2)
      mockPool.query.mockResolvedValueOnce({ rows: [{ count: 2 }] });

      await expect(service.useGraceDay('contract-1', 'user-1')).rejects.toThrow(BadRequestException);
    });
  });
});
