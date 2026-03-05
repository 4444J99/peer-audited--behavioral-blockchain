import { ContractsController } from './contracts.controller';
import { ContractsService } from './contracts.service';
import { DisputeService } from '../../../services/escrow/dispute.service';
import { StripeFboService } from '../../../services/escrow/stripe.service';
import { LedgerService } from '../../../services/ledger/ledger.service';
import { TruthLogService } from '../../../services/ledger/truth-log.service';
import { Pool } from 'pg';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreateContractDto, SubmitProofDto } from './dto';

const mockContractsService = {
  getUserContracts: jest.fn(),
  createContract: jest.fn(),
  getCohortSnapshot: jest.fn(),
  getContract: jest.fn(),
  getContractProofs: jest.fn(),
  submitProof: jest.fn(),
  useGraceDay: jest.fn(),
  fileDispute: jest.fn(),
  getAttestationStatus: jest.fn(),
  submitAttestation: jest.fn(),
  submitWhoopScoredState: jest.fn(),
  claimBounty: jest.fn(),
} as unknown as ContractsService;

const mockDisputeService = {} as unknown as DisputeService;
const mockPool = {} as unknown as Pool;
const mockStripe = {} as unknown as StripeFboService;
const mockLedger = {} as unknown as LedgerService;
const mockTruthLog = {} as unknown as TruthLogService;

describe('ContractsController', () => {
  let controller: ContractsController;
  const testUser = { id: 'user-1' };

  beforeEach(() => {
    controller = new ContractsController(
      mockContractsService,
      {} as any, // mockMedicalExemption
      mockDisputeService,
      mockPool,
      mockStripe,
      mockLedger,
      mockTruthLog,
    );
    jest.clearAllMocks();
  });

  describe('GET /contracts', () => {
    it('should call contractsService.getUserContracts with user ID', async () => {
      const mockContracts = { contracts: [{ id: 'c1', status: 'ACTIVE' }] };
      (mockContractsService.getUserContracts as jest.Mock).mockResolvedValue(mockContracts);

      const result = await controller.findByUser(testUser);

      expect(mockContractsService.getUserContracts).toHaveBeenCalledWith('user-1');
      expect(result).toEqual(mockContracts);
    });

    it('should propagate service errors', async () => {
      (mockContractsService.getUserContracts as jest.Mock).mockRejectedValue(new Error('DB error'));

      await expect(controller.findByUser(testUser)).rejects.toThrow('DB error');
    });
  });

  describe('POST /contracts', () => {
    const validDto: CreateContractDto = {
      oathCategory: 'Biological',
      verificationMethod: 'photo',
      stakeAmount: 50,
      durationDays: 30,
    };

    it('should call contractsService.createContract with userId merged into DTO', async () => {
      const mockContract = { id: 'c-new', status: 'PENDING' };
      (mockContractsService.createContract as jest.Mock).mockResolvedValue(mockContract);

      const result = await controller.create(testUser, validDto);

      expect(mockContractsService.createContract).toHaveBeenCalledWith({
        ...validDto,
        userId: 'user-1',
      });
      expect(result).toEqual(mockContract);
    });

    it('should propagate service errors for invalid stake', async () => {
      (mockContractsService.createContract as jest.Mock).mockRejectedValue(
        new Error('Stake exceeds tier limit'),
      );

      await expect(controller.create(testUser, validDto)).rejects.toThrow('Stake exceeds tier limit');
    });
  });

  describe('GET /contracts/:id', () => {
    it('should call contractsService.getContract with ID and user context', async () => {
      const mockContract = { id: 'c1', status: 'ACTIVE', userId: 'user-1' };
      (mockContractsService.getContract as jest.Mock).mockResolvedValue(mockContract);

      const result = await controller.findOne('c1', testUser);

      expect(mockContractsService.getContract).toHaveBeenCalledWith('c1', { userId: 'user-1' });
      expect(result).toEqual(mockContract);
    });

    it('should propagate NotFoundException', async () => {
      (mockContractsService.getContract as jest.Mock).mockRejectedValue(
        new Error('Contract not found'),
      );

      await expect(controller.findOne('nonexistent', testUser)).rejects.toThrow('Contract not found');
    });
  });

  describe('GET /contracts/cohorts/:cohortId/snapshot', () => {
    it('should call contractsService.getCohortSnapshot with cohortId and userId', async () => {
      const mockSnapshot = {
        cohortId: 'launch-2026-03-a',
        participantCount: 2,
        activeCount: 1,
        outCount: 1,
        participants: [],
      };
      (mockContractsService.getCohortSnapshot as jest.Mock).mockResolvedValue(mockSnapshot);

      const result = await controller.getCohortSnapshot('launch-2026-03-a', testUser);

      expect(mockContractsService.getCohortSnapshot).toHaveBeenCalledWith(
        'launch-2026-03-a',
        'user-1',
      );
      expect(result).toEqual(mockSnapshot);
    });
  });

  describe('GET /contracts/:id/proofs', () => {
    it('should call contractsService.getContractProofs with contract ID and user context', async () => {
      const mockProofs = [{ id: 'p1', mediaUri: 'r2://proof.jpg' }];
      (mockContractsService.getContractProofs as jest.Mock).mockResolvedValue(mockProofs);

      const result = await controller.getProofs('c1', testUser);

      expect(mockContractsService.getContractProofs).toHaveBeenCalledWith('c1', { userId: 'user-1' });
      expect(result).toEqual(mockProofs);
    });
  });

  describe('POST /contracts/:id/proof', () => {
    const proofDto: SubmitProofDto = {
      mediaUri: 'r2://styx-proofs/abc123.jpg',
    };

    it('should call contractsService.submitProof with userId merged into DTO', async () => {
      const mockResult = { proofId: 'proof-1', status: 'SUBMITTED' };
      (mockContractsService.submitProof as jest.Mock).mockResolvedValue(mockResult);

      const result = await controller.submitProof('c1', testUser, proofDto);

      expect(mockContractsService.submitProof).toHaveBeenCalledWith('c1', {
        mediaUri: 'r2://styx-proofs/abc123.jpg',
        userId: 'user-1',
      });
      expect(result).toEqual(mockResult);
    });

    it('should propagate service errors for invalid proof', async () => {
      (mockContractsService.submitProof as jest.Mock).mockRejectedValue(
        new Error('Contract is not active'),
      );

      await expect(controller.submitProof('c1', testUser, proofDto)).rejects.toThrow('Contract is not active');
    });
  });

  describe('POST /contracts/:id/grace-day', () => {
    it('should call contractsService.useGraceDay with contractId and userId', async () => {
      const mockResult = { graceDaysUsed: 1, graceDaysMax: 2 };
      (mockContractsService.useGraceDay as jest.Mock).mockResolvedValue(mockResult);

      const result = await controller.useGraceDay('c1', testUser);

      expect(mockContractsService.useGraceDay).toHaveBeenCalledWith('c1', 'user-1');
      expect(result).toEqual(mockResult);
    });

    it('should propagate error when grace days exhausted', async () => {
      (mockContractsService.useGraceDay as jest.Mock).mockRejectedValue(
        new Error('No grace days remaining'),
      );

      await expect(controller.useGraceDay('c1', testUser)).rejects.toThrow('No grace days remaining');
    });
  });

  describe('POST /contracts/:id/dispute', () => {
    it('should call contractsService.fileDispute with userId and contractId', async () => {
      const mockResult = { appealStatus: 'FEE_AUTHORIZED_PENDING_REVIEW' };
      (mockContractsService.fileDispute as jest.Mock).mockResolvedValue(mockResult);

      const result = await controller.disputeVerdict('c1', testUser);

      expect(mockContractsService.fileDispute).toHaveBeenCalledWith('user-1', 'c1');
      expect(result).toEqual(mockResult);
    });
  });

  describe('GET /contracts/:id/attestation', () => {
    it('should call contractsService.getAttestationStatus with contractId and userId', async () => {
      const mockStatus = {
        contractId: 'c1',
        oathCategory: 'RECOVERY_NO_CONTACT_TEXT',
        streakDays: 5,
        daysRemaining: 25,
        graceDaysAvailable: 2,
        todayAttested: false,
        totalStrikes: 0,
      };
      (mockContractsService.getAttestationStatus as jest.Mock).mockResolvedValue(mockStatus);

      const result = await controller.getAttestationStatus('c1', testUser);

      expect(mockContractsService.getAttestationStatus).toHaveBeenCalledWith('c1', 'user-1');
      expect(result).toEqual(mockStatus);
    });

    it('should propagate NotFoundException for non-existent contract', async () => {
      (mockContractsService.getAttestationStatus as jest.Mock).mockRejectedValue(
        new Error('Contract not found'),
      );

      await expect(controller.getAttestationStatus('bad-id', testUser)).rejects.toThrow('Contract not found');
    });

    it('should propagate ForbiddenException for non-owner', async () => {
      (mockContractsService.getAttestationStatus as jest.Mock).mockRejectedValue(
        new Error('Not authorized'),
      );

      await expect(controller.getAttestationStatus('c1', { id: 'other-user' })).rejects.toThrow('Not authorized');
    });
  });

  describe('POST /contracts/:id/attestation', () => {
    it('should call contractsService.submitAttestation with contractId and userId', async () => {
      const mockResult = { status: 'attested' };
      (mockContractsService.submitAttestation as jest.Mock).mockResolvedValue(mockResult);

      const result = await controller.submitAttestation('c1', testUser);

      expect(mockContractsService.submitAttestation).toHaveBeenCalledWith('c1', 'user-1');
      expect(result).toEqual(mockResult);
    });

    it('should propagate error for already-attested today', async () => {
      (mockContractsService.submitAttestation as jest.Mock).mockRejectedValue(
        new Error('Already attested today'),
      );

      await expect(controller.submitAttestation('c1', testUser)).rejects.toThrow('Already attested today');
    });

    it('should propagate BadRequestException for non-recovery contract', async () => {
      (mockContractsService.submitAttestation as jest.Mock).mockRejectedValue(
        new Error('Attestation only available for recovery contracts'),
      );

      await expect(controller.submitAttestation('c1', testUser)).rejects.toThrow('Attestation only available for recovery contracts');
    });
  });

  describe('POST /contracts/:id/whoop/scored', () => {
    it('should call contractsService.submitWhoopScoredState with contractId + userId', async () => {
      const whoopDto = { state: 'SCORED', source: 'whoop-webhook-v1' };
      const mockResult = { status: 'recorded', state: 'SCORED', attestationApplied: true };
      (mockContractsService.submitWhoopScoredState as jest.Mock).mockResolvedValue(mockResult);

      const result = await controller.submitWhoopScored('c1', testUser, whoopDto as any);

      expect(mockContractsService.submitWhoopScoredState).toHaveBeenCalledWith('c1', {
        state: 'SCORED',
        source: 'whoop-webhook-v1',
        userId: 'user-1',
      });
      expect(result).toEqual(mockResult);
    });
  });

  describe('POST /bounty/:linkId', () => {
    it('should call contractsService.claimBounty with linkId, mediaUri, and IP', async () => {
      const mockResult = { bountyId: 'b1', status: 'SUBMITTED' };
      (mockContractsService.claimBounty as jest.Mock).mockResolvedValue(mockResult);

      const mockRes = { json: jest.fn() };
      const mockReq = { ip: '192.168.1.1' };

      await controller.claimBounty('link-abc', { mediaUri: 'r2://evidence.jpg' }, mockRes, mockReq);

      expect(mockContractsService.claimBounty).toHaveBeenCalledWith(
        'link-abc',
        'r2://evidence.jpg',
        '192.168.1.1',
      );
      expect(mockRes.json).toHaveBeenCalledWith(mockResult);
    });

    it('should fall back to connection.remoteAddress when req.ip is undefined', async () => {
      const mockResult = { bountyId: 'b1', status: 'SUBMITTED' };
      (mockContractsService.claimBounty as jest.Mock).mockResolvedValue(mockResult);

      const mockRes = { json: jest.fn() };
      const mockReq = { ip: undefined, connection: { remoteAddress: '10.0.0.1' } };

      await controller.claimBounty('link-abc', { mediaUri: 'r2://evidence.jpg' }, mockRes, mockReq);

      expect(mockContractsService.claimBounty).toHaveBeenCalledWith(
        'link-abc',
        'r2://evidence.jpg',
        '10.0.0.1',
      );
    });
  });

  describe('DTO validation', () => {
    it('should reject CreateContractDto with missing oathCategory', async () => {
      const dto = plainToInstance(CreateContractDto, {
        verificationMethod: 'photo',
        stakeAmount: 50,
        durationDays: 30,
      });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'oathCategory')).toBe(true);
    });

    it('should reject CreateContractDto with negative stakeAmount', async () => {
      const dto = plainToInstance(CreateContractDto, {
        oathCategory: 'Biological',
        verificationMethod: 'photo',
        stakeAmount: -5,
        durationDays: 30,
      });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'stakeAmount')).toBe(true);
    });

    it('should reject CreateContractDto with durationDays over 365', async () => {
      const dto = plainToInstance(CreateContractDto, {
        oathCategory: 'Biological',
        verificationMethod: 'photo',
        stakeAmount: 50,
        durationDays: 500,
      });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'durationDays')).toBe(true);
    });

    it('should accept valid CreateContractDto', async () => {
      const dto = plainToInstance(CreateContractDto, {
        oathCategory: 'Biological',
        verificationMethod: 'photo',
        stakeAmount: 50,
        durationDays: 30,
      });
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should reject cohort.maxPodSize above 5', async () => {
      const dto = plainToInstance(CreateContractDto, {
        oathCategory: 'Biological',
        verificationMethod: 'photo',
        stakeAmount: 50,
        durationDays: 30,
        cohort: {
          cohortId: 'launch-2026-03-a',
          mode: 'POD_BASED',
          podId: 'pod-1',
          maxPodSize: 6,
        },
      });
      const errors = await validate(dto);
      const cohortError = errors.find((e) => e.property === 'cohort');
      expect(cohortError).toBeDefined();
    });

    it('should accept CreateContractDto with MVP_39 pricing metadata', async () => {
      const dto = plainToInstance(CreateContractDto, {
        oathCategory: 'Recovery',
        verificationMethod: 'ATTESTATION',
        stakeAmount: 30,
        durationDays: 30,
        pricing: {
          plan: 'MVP_39',
        },
      });
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should reject SubmitProofDto with missing mediaUri', async () => {
      const dto = plainToInstance(SubmitProofDto, {});
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'mediaUri')).toBe(true);
    });

    it('should accept valid SubmitProofDto', async () => {
      const dto = plainToInstance(SubmitProofDto, {
        mediaUri: 'r2://styx-proofs/abc123.jpg',
      });
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });
  });
});
