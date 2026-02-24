import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { ContractsService, CreateContractInput } from './contracts.service';
import { LedgerService } from '../../../services/ledger/ledger.service';
import { TruthLogService } from '../../../services/ledger/truth-log.service';
import { StripeFboService } from '../../../services/escrow/stripe.service';
import { DisputeService } from '../../../services/escrow/dispute.service';
import { FuryRouterService } from '../../../services/fury-router/fury-router.service';
import { AegisProtocolService } from '../../../services/health/aegis.service';
import { RecoveryProtocolService } from '../../../services/health/recovery-protocol.service';
import { AnomalyService } from '../../../services/anomaly/anomaly.service';
import { OathCategory, VerificationMethod, FAILURE_COOL_OFF_DAYS, DOWNSCALE_STRIKE_THRESHOLD } from '../../../../shared/libs/behavioral-logic';
import { Pool } from 'pg';

describe('ContractsService — Behavioral Physics', () => {
  let service: ContractsService;
  let mockPool: { query: jest.Mock };

  const mockLedger = { recordTransaction: jest.fn().mockResolvedValue('entry-id') } as unknown as LedgerService;
  const mockTruthLog = { appendEvent: jest.fn().mockResolvedValue('log-id') } as unknown as TruthLogService;
  const mockStripe = {
    holdStake: jest.fn().mockResolvedValue({ id: 'pi_test_123' }),
    captureStake: jest.fn().mockResolvedValue({ id: 'pi_test_123' }),
    cancelHold: jest.fn().mockResolvedValue({ id: 'pi_test_123' }),
  } as unknown as StripeFboService;
  const mockFuryRouter = { routeProof: jest.fn().mockResolvedValue('job-id-1') } as unknown as FuryRouterService;
  const mockDispute = { initiateAppeal: jest.fn() } as unknown as DisputeService;
  const mockAegis = { validateHealthMetrics: jest.fn() } as unknown as AegisProtocolService;
  const mockRecovery = { validateRecoveryContract: jest.fn() } as unknown as RecoveryProtocolService;
  const mockAnomaly = { analyze: jest.fn().mockResolvedValue({ rejected: false, flags: [] }) } as unknown as AnomalyService;

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
    stakeAmount: 15,
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

  // ── Cool-off period ──────────────────────────────────────────

  describe('cool-off period', () => {
    it('should reject contract creation when user has a recent failure', async () => {
      // User lookup
      mockPool.query.mockResolvedValueOnce({ rows: [activeUser] });
      // Cool-off query: 1 recent failure
      mockPool.query.mockResolvedValueOnce({ rows: [{ count: 1 }] });

      await expect(service.createContract(validDto)).rejects.toThrow(
        expect.objectContaining({
          constructor: ForbiddenException,
          message: expect.stringMatching(/Cool-off period active/),
        }),
      );
    });

    it('should allow contract creation when no recent failures', async () => {
      // User lookup
      mockPool.query.mockResolvedValueOnce({ rows: [activeUser] });
      // Cool-off query: no recent failures
      mockPool.query.mockResolvedValueOnce({ rows: [{ count: 0 }] });
      // Total failures (downscaling check)
      mockPool.query.mockResolvedValueOnce({ rows: [{ count: 0 }] });
      // Contract insert
      mockPool.query.mockResolvedValueOnce({ rows: [{ id: 'contract-1' }] });
      // Prior contracts (onboarding)
      mockPool.query.mockResolvedValueOnce({ rows: [{ count: 1 }] });
      // Escrow lookup
      mockPool.query.mockResolvedValueOnce({ rows: [{ id: 'escrow-acct' }] });

      const result = await service.createContract(validDto);
      expect(result.contractId).toBe('contract-1');
    });
  });

  // ── Stake tier limits ────────────────────────────────────────

  describe('stake tier limits', () => {
    it('should reject stake exceeding tier max for TIER_2_STANDARD', async () => {
      // Score 50 → tiers = [TIER_1_MICRO_STAKES, TIER_2_STANDARD] → max $100
      const dto = { ...validDto, stakeAmount: 150 };
      mockPool.query.mockResolvedValueOnce({ rows: [activeUser] });
      // Cool-off: no recent failures
      mockPool.query.mockResolvedValueOnce({ rows: [{ count: 0 }] });

      await expect(service.createContract(dto)).rejects.toThrow(
        expect.objectContaining({
          constructor: BadRequestException,
          message: expect.stringMatching(/exceeds tier limit/),
        }),
      );
    });

    it('should allow stake within tier limit', async () => {
      const dto = { ...validDto, stakeAmount: 80 }; // under $100 TIER_2 limit
      mockPool.query.mockResolvedValueOnce({ rows: [activeUser] });
      // Cool-off: no failures
      mockPool.query.mockResolvedValueOnce({ rows: [{ count: 0 }] });
      // Total failures (downscaling)
      mockPool.query.mockResolvedValueOnce({ rows: [{ count: 0 }] });
      // Contract insert
      mockPool.query.mockResolvedValueOnce({ rows: [{ id: 'contract-2' }] });
      // Prior contracts
      mockPool.query.mockResolvedValueOnce({ rows: [{ count: 1 }] });
      // Escrow lookup
      mockPool.query.mockResolvedValueOnce({ rows: [{ id: 'escrow-acct' }] });

      const result = await service.createContract(dto);
      expect(result.contractId).toBe('contract-2');
    });
  });

  // ── Dynamic downscaling ──────────────────────────────────────

  describe('dynamic downscaling', () => {
    it('should reject high stake after 3+ failures', async () => {
      const dto = { ...validDto, stakeAmount: 80 }; // Under tier max (100) but over downscaled max
      mockPool.query.mockResolvedValueOnce({ rows: [activeUser] });
      // Cool-off: no recent failures (failures are older than 7 days)
      mockPool.query.mockResolvedValueOnce({ rows: [{ count: 0 }] });
      // Total failures: 3 → downscale factor = 0.5^1 = 0.5 → max = 100 * 0.5 = 50
      mockPool.query.mockResolvedValueOnce({ rows: [{ count: 3 }] });

      await expect(service.createContract(dto)).rejects.toThrow(
        expect.objectContaining({
          constructor: BadRequestException,
          message: expect.stringMatching(/Dynamic downscaling/),
        }),
      );
    });

    it('should allow stake within downscaled limit', async () => {
      const dto = { ...validDto, stakeAmount: 10 }; // Well under downscaled max of $50
      mockPool.query.mockResolvedValueOnce({ rows: [activeUser] });
      // Cool-off
      mockPool.query.mockResolvedValueOnce({ rows: [{ count: 0 }] });
      // Total failures: 3 → max = 50
      mockPool.query.mockResolvedValueOnce({ rows: [{ count: 3 }] });
      // Contract insert
      mockPool.query.mockResolvedValueOnce({ rows: [{ id: 'contract-3' }] });
      // Prior contracts
      mockPool.query.mockResolvedValueOnce({ rows: [{ count: 1 }] });
      // Escrow lookup
      mockPool.query.mockResolvedValueOnce({ rows: [{ id: 'escrow-acct' }] });

      const result = await service.createContract(dto);
      expect(result.contractId).toBe('contract-3');
    });

    it('should apply exponential downscaling for 6+ failures', async () => {
      const dto = { ...validDto, stakeAmount: 30 }; // 6 failures → 0.5^2 = 0.25 → max = 100 * 0.25 = 25
      mockPool.query.mockResolvedValueOnce({ rows: [activeUser] });
      mockPool.query.mockResolvedValueOnce({ rows: [{ count: 0 }] }); // Cool-off
      mockPool.query.mockResolvedValueOnce({ rows: [{ count: 6 }] }); // Total failures

      await expect(service.createContract(dto)).rejects.toThrow(
        expect.objectContaining({
          constructor: BadRequestException,
          message: expect.stringMatching(/Dynamic downscaling/),
        }),
      );
    });
  });

  // ── Recovery contracts ─────────────────────────────────────

  describe('recovery contracts', () => {
    const recoveryDto: CreateContractInput = {
      userId: 'user-1',
      oathCategory: OathCategory.NO_CONTACT_BOUNDARY,
      verificationMethod: VerificationMethod.DAILY_ATTESTATION,
      stakeAmount: 15,
      durationDays: 14,
      recoveryMetadata: {
        accountabilityPartnerEmail: 'friend@example.com',
        noContactIdentifiers: ['hash_abc'],
        acknowledgments: {
          voluntary: true,
          noMinors: true,
          noDependents: true,
          noLegalObligations: true,
        },
      },
    };

    function mockSuccessfulRecoveryFlow() {
      mockPool.query.mockResolvedValueOnce({ rows: [activeUser] }); // User lookup
      mockPool.query.mockResolvedValueOnce({ rows: [{ count: 0 }] }); // Cool-off
      mockPool.query.mockResolvedValueOnce({ rows: [{ count: 0 }] }); // Total failures
      mockPool.query.mockResolvedValueOnce({ rows: [{ id: 'contract-r1' }] }); // Contract insert
      mockPool.query.mockResolvedValueOnce({ rows: [] }); // AP insert
      mockPool.query.mockResolvedValueOnce({ rows: [{ count: 1 }] }); // Prior contracts
      mockPool.query.mockResolvedValueOnce({ rows: [{ id: 'escrow-acct' }] }); // Escrow lookup
    }

    it('should call RecoveryProtocolService.validateRecoveryContract for RECOVERY_ oaths', async () => {
      mockSuccessfulRecoveryFlow();

      await service.createContract(recoveryDto);

      expect(mockRecovery.validateRecoveryContract).toHaveBeenCalledWith(
        'RECOVERY_NOCONTACT',
        14,
        recoveryDto.recoveryMetadata,
      );
    });

    it('should create accountability partner row for RECOVERY contracts', async () => {
      mockSuccessfulRecoveryFlow();

      await service.createContract(recoveryDto);

      // The AP insert is the 5th query call (index 4)
      const apInsertCall = mockPool.query.mock.calls.find(
        ([sql]: [string]) => typeof sql === 'string' && sql.includes('accountability_partners'),
      );
      expect(apInsertCall).toBeDefined();
      expect(apInsertCall![1]).toContain('friend@example.com');
    });

    it('should store recovery metadata in contract JSONB column', async () => {
      mockSuccessfulRecoveryFlow();

      await service.createContract(recoveryDto);

      // The contract insert is the 4th query call (index 3)
      const insertCall = mockPool.query.mock.calls.find(
        ([sql]: [string]) => typeof sql === 'string' && sql.includes('INSERT INTO contracts'),
      );
      expect(insertCall).toBeDefined();
      const metadataParam = insertCall![1][8]; // 9th parameter ($9)
      const parsed = JSON.parse(metadataParam);
      expect(parsed.recovery.noContactIdentifiers).toEqual(['hash_abc']);
      expect(parsed.recovery.acknowledgments.voluntary).toBe(true);
    });

    it('should not call RecoveryProtocolService for non-RECOVERY oaths', async () => {
      // Standard flow for COGNITIVE oath
      mockPool.query.mockResolvedValueOnce({ rows: [activeUser] });
      mockPool.query.mockResolvedValueOnce({ rows: [{ count: 0 }] });
      mockPool.query.mockResolvedValueOnce({ rows: [{ count: 0 }] });
      mockPool.query.mockResolvedValueOnce({ rows: [{ id: 'contract-c1' }] });
      mockPool.query.mockResolvedValueOnce({ rows: [{ count: 1 }] });
      mockPool.query.mockResolvedValueOnce({ rows: [{ id: 'escrow-acct' }] });

      await service.createContract(validDto);

      expect(mockRecovery.validateRecoveryContract).not.toHaveBeenCalled();
    });

    it('should reject RECOVERY oath with invalid category', async () => {
      const dto = { ...recoveryDto, oathCategory: 'RECOVERY_INVALID' };

      await expect(service.createContract(dto)).rejects.toThrow(BadRequestException);
    });

    it('should reject RECOVERY oath with wrong verification method', async () => {
      const dto = {
        ...recoveryDto,
        verificationMethod: VerificationMethod.HARDWARE_HEALTHKIT,
      };

      await expect(service.createContract(dto)).rejects.toThrow(BadRequestException);
    });

    it('should propagate RecoveryProtocol 406 errors', async () => {
      const { HttpException, HttpStatus } = require('@nestjs/common');
      (mockRecovery.validateRecoveryContract as jest.Mock).mockImplementationOnce(() => {
        throw new HttpException('Recovery Protocol: Duration exceeded', HttpStatus.NOT_ACCEPTABLE);
      });

      mockPool.query.mockResolvedValueOnce({ rows: [activeUser] });
      mockPool.query.mockResolvedValueOnce({ rows: [{ count: 0 }] });
      mockPool.query.mockResolvedValueOnce({ rows: [{ count: 0 }] });

      await expect(service.createContract(recoveryDto)).rejects.toThrow(HttpException);
    });

    it('should create contract with 30-day cap for RECOVERY_SUBSTANCE', async () => {
      const dto: CreateContractInput = {
        ...recoveryDto,
        oathCategory: OathCategory.SUBSTANCE_ABSTINENCE,
        verificationMethod: VerificationMethod.FURY_CONSENSUS,
        durationDays: 21,
      };
      mockPool.query.mockResolvedValueOnce({ rows: [activeUser] });
      mockPool.query.mockResolvedValueOnce({ rows: [{ count: 0 }] });
      mockPool.query.mockResolvedValueOnce({ rows: [{ count: 0 }] });
      mockPool.query.mockResolvedValueOnce({ rows: [{ id: 'contract-r2' }] });
      mockPool.query.mockResolvedValueOnce({ rows: [] }); // AP insert
      mockPool.query.mockResolvedValueOnce({ rows: [{ count: 1 }] });
      mockPool.query.mockResolvedValueOnce({ rows: [{ id: 'escrow-acct' }] });

      const result = await service.createContract(dto);
      expect(result.contractId).toBe('contract-r2');
    });
  });
});
