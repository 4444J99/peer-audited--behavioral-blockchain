import { BadRequestException, ConflictException, ForbiddenException, ServiceUnavailableException } from '@nestjs/common';
import { Pool } from 'pg';
import { ProofsController } from './proofs.controller';
import { R2StorageService } from '../../../services/storage/r2.service';
import { FuryRouterService } from '../../../services/fury-router/fury-router.service';
import { TruthLogService } from '../../../services/ledger/truth-log.service';
import { PHashService } from '../../../services/intelligence/phash.service';
import { AnomalyService } from '../../../services/anomaly/anomaly.service';
import { ProofMediaType } from './dto';
import { ProofsService } from './proofs.service';
import { CrisisDetectionService } from '../../../services/security/crisis-detection.service';
import { CrisisInterventionService } from '../../../services/security/crisis-intervention.service';

describe('ProofsController', () => {
  let controller: ProofsController;
  let mockPool: { query: jest.Mock };
  let mockR2: jest.Mocked<Pick<R2StorageService, 'generateUploadUrl' | 'downloadFile'>>;
  let mockFuryRouter: jest.Mocked<Pick<FuryRouterService, 'routeProof'>>;
  let mockTruthLog: jest.Mocked<Pick<TruthLogService, 'appendEvent'>>;
  let mockPhash: jest.Mocked<Pick<PHashService, 'computeFrameHash' | 'isDuplicate'>>;
  let mockAnomaly: jest.Mocked<Pick<AnomalyService, 'analyze'>>;
  let mockProofsService: jest.Mocked<Pick<ProofsService, 'getProofUploadContractAccess' | 'getProofUploadConfirmationAccess' | 'getProofDetail'>>;
  let mockCrisisDetection: jest.Mocked<Pick<CrisisDetectionService, 'analyzeContent'>>;
  let mockCrisisIntervention: jest.Mocked<Pick<CrisisInterventionService, 'reportCrisis'>>;

  beforeEach(() => {
    mockPool = { query: jest.fn() };
    mockR2 = {
      generateUploadUrl: jest.fn(),
      downloadFile: jest.fn(),
    };
    mockFuryRouter = { routeProof: jest.fn() };
    mockTruthLog = { appendEvent: jest.fn() };
    mockPhash = {
      computeFrameHash: jest.fn(),
      isDuplicate: jest.fn(),
    };
    mockAnomaly = {
      analyze: jest.fn(),
    };
    mockProofsService = {
      getProofUploadContractAccess: jest.fn(),
      getProofUploadConfirmationAccess: jest.fn(),
      getProofDetail: jest.fn(),
    };
    mockCrisisDetection = {
      analyzeContent: jest.fn().mockReturnValue({ isCrisis: false, severity: 'NONE', matchedKeywords: [] }),
    };
    mockCrisisIntervention = {
      reportCrisis: jest.fn().mockResolvedValue({ escalated: false }),
    };

    controller = new ProofsController(
      mockPool as unknown as Pool,
      mockR2 as unknown as R2StorageService,
      mockFuryRouter as unknown as FuryRouterService,
      mockTruthLog as unknown as TruthLogService,
      mockPhash as unknown as PHashService,
      mockAnomaly as unknown as AnomalyService,
      mockProofsService as unknown as ProofsService,
      mockCrisisDetection as unknown as CrisisDetectionService,
      mockCrisisIntervention as unknown as CrisisInterventionService,
    );
    jest.clearAllMocks();
  });

  describe('requestUploadUrl', () => {
    const user = { id: 'user-1' };
    const contractAccess = {
      id: 'c-1',
      status: 'ACTIVE',
      ownerUserId: 'user-1',
      stakeAmount: 25,
      strikes: 0,
      integrityScore: 100,
    };

    it('inserts the proof against the real proofs columns and returns the upload URL', async () => {
      mockProofsService.getProofUploadContractAccess.mockResolvedValue(contractAccess as any);
      mockPool.query.mockResolvedValueOnce({ rows: [{ id: 'proof-1' }] });
      mockR2.generateUploadUrl.mockResolvedValue({
        uploadUrl: 'https://r2.example/upload',
        key: 'proofs/proof-1.mp4',
      } as any);

      const result = await controller.requestUploadUrl(user, {
        contractId: 'c-1',
        contentType: ProofMediaType.VIDEO,
        description: 'No Contact compliance — Day 7',
      });

      expect(result).toEqual({
        proofId: 'proof-1',
        uploadUrl: 'https://r2.example/upload',
        storageKey: 'proofs/proof-1.mp4',
        expiresInSeconds: 300,
      });

      // The INSERT must name columns that actually exist on `proofs`
      // (content_type / description are persisted alongside submitted_at).
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining(
          'INSERT INTO proofs (contract_id, user_id, status, content_type, description, submitted_at)',
        ),
        ['c-1', 'user-1', ProofMediaType.VIDEO, 'No Contact compliance — Day 7'],
      );
    });

    it('binds exactly one VALUES expression per column and one param per placeholder', async () => {
      mockProofsService.getProofUploadContractAccess.mockResolvedValue(contractAccess as any);
      mockPool.query.mockResolvedValueOnce({ rows: [{ id: 'proof-1' }] });
      mockR2.generateUploadUrl.mockResolvedValue({
        uploadUrl: 'https://r2.example/upload',
        key: 'proofs/proof-1.mp4',
      } as any);

      await controller.requestUploadUrl(user, {
        contractId: 'c-1',
        contentType: ProofMediaType.VIDEO,
      });

      const [sql, params] = mockPool.query.mock.calls[0] as [string, unknown[]];

      const columns = sql
        .slice(sql.indexOf('(') + 1, sql.indexOf(')'))
        .split(',')
        .map((c) => c.trim());
      expect(columns).toEqual([
        'contract_id',
        'user_id',
        'status',
        'content_type',
        'description',
        'submitted_at',
      ]);

      // NOW() carries its own ')', so bound the VALUES list at the last ')'
      // before RETURNING rather than at the first one.
      const valuesStart = sql.indexOf('VALUES (') + 'VALUES ('.length;
      const values = sql
        .slice(valuesStart, sql.lastIndexOf(')', sql.indexOf('RETURNING')))
        .split(',')
        .map((v) => v.trim());
      expect(values).toHaveLength(columns.length);

      // Literals ('PENDING_UPLOAD', NOW()) consume no params, so the highest
      // placeholder index must equal the params array length exactly.
      const placeholders = sql.match(/\$\d+/g) ?? [];
      expect(Math.max(...placeholders.map((p) => Number(p.slice(1))))).toBe(params.length);
      expect(new Set(placeholders).size).toBe(params.length);

      // An omitted description is persisted as NULL, not dropped from the binding.
      expect(params).toEqual(['c-1', 'user-1', ProofMediaType.VIDEO, null]);
    });

    it('rejects proof submission when the contract is not ACTIVE', async () => {
      mockProofsService.getProofUploadContractAccess.mockResolvedValue({
        ...contractAccess,
        status: 'COMPLETED',
      } as any);

      await expect(
        controller.requestUploadUrl(user, {
          contractId: 'c-1',
          contentType: ProofMediaType.VIDEO,
        }),
      ).rejects.toThrow(BadRequestException);
      expect(mockPool.query).not.toHaveBeenCalled();
    });
  });

  describe('confirmUpload', () => {
    const user = { id: 'user-1' };
    // Client-asserted biometric fields are intentionally no longer trusted/persisted.
    const dto = { storageKey: 'proofs/p1' };

    it('should finalize proof with anomaly flags (no client biometric data persisted)', async () => {
      mockProofsService.getProofUploadConfirmationAccess.mockResolvedValue({
        status: 'PENDING_UPLOAD',
        contractId: 'c-1',
        ownerUserId: 'user-1',
      } as any);

      mockR2.downloadFile.mockResolvedValue(Buffer.from('fake-media'));
      mockAnomaly.analyze.mockResolvedValue({ rejected: false, flags: ['EXIF_TIMESTAMP_DISCREPANCY'] });
      mockPhash.computeFrameHash.mockResolvedValue('hash-123');
      mockPhash.isDuplicate.mockResolvedValue({ duplicate: false, closestDistance: 64 });
      mockPool.query.mockResolvedValue({ rows: [] }); // select existing hashes

      const result = await controller.confirmUpload('p-1', user, dto);

      expect(result.status).toBe('PENDING_REVIEW');
      expect(result.flags).toContain('EXIF_TIMESTAMP_DISCREPANCY');
      // Finalize UPDATE now only persists storageKey, proofId, anomaly flags and device metadata.
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE proofs'),
        expect.arrayContaining([expect.any(String), 'p-1', '["EXIF_TIMESTAMP_DISCREPANCY"]', '{}'])
      );
    });

    it('should reject duplicate proofs', async () => {
      mockProofsService.getProofUploadConfirmationAccess.mockResolvedValue({
        status: 'PENDING_UPLOAD',
        contractId: 'c-1',
        ownerUserId: 'user-1',
      } as any);
      
      mockR2.downloadFile.mockResolvedValue(Buffer.from('fake-media'));
      mockAnomaly.analyze.mockResolvedValue({ rejected: false, flags: [] });
      mockPhash.isDuplicate.mockResolvedValue({ duplicate: true, closestDistance: 0 });
      mockPool.query.mockResolvedValue({ rows: [{ phash: 'hash-123' }] });

      await expect(controller.confirmUpload('p-1', user, dto)).rejects.toThrow(ConflictException);
    });
  });

  describe('processingComplete (SH15: per-proof scoping)', () => {
    const ORIGINAL_TOKEN = process.env.INTERNAL_SERVICE_TOKEN;

    beforeEach(() => {
      process.env.INTERNAL_SERVICE_TOKEN = 'internal-token-abc';
    });

    afterAll(() => {
      if (ORIGINAL_TOKEN === undefined) {
        delete process.env.INTERNAL_SERVICE_TOKEN;
      } else {
        process.env.INTERNAL_SERVICE_TOKEN = ORIGINAL_TOKEN;
      }
    });

    it('fails closed (503) when the internal token is not configured', async () => {
      delete process.env.INTERNAL_SERVICE_TOKEN;
      await expect(
        controller.processingComplete('p-1', 'anything', 'challenge', { status: 'COMPLETED' }),
      ).rejects.toThrow(ServiceUnavailableException);
    });

    it('rejects a wrong internal token before touching the proof', async () => {
      await expect(
        controller.processingComplete('p-1', 'wrong-token', 'challenge', { status: 'COMPLETED' }),
      ).rejects.toThrow(ForbiddenException);
      expect(mockPool.query).not.toHaveBeenCalled();
    });

    it('rejects when the per-proof challenge token does not match (leaked global token alone is insufficient)', async () => {
      // First query: load the proof's expected challenge + in-flight status.
      mockPool.query.mockResolvedValueOnce({
        rows: [{ user_id: 'u1', challenge_token: 'proof-secret-1', processing_status: 'IN_PROGRESS' }],
      });

      await expect(
        controller.processingComplete('p-1', 'internal-token-abc', 'attacker-guess', {
          status: 'COMPLETED',
          maskedMediaUri: 'proofs/p1-masked.mp4',
        }),
      ).rejects.toThrow(ForbiddenException);

      // Only the lookup ran — no UPDATE should have planted masked media.
      expect(mockPool.query).toHaveBeenCalledTimes(1);
    });

    it('rejects when the proof is not in-flight (already finalized / never dispatched)', async () => {
      mockPool.query.mockResolvedValueOnce({
        rows: [{ user_id: 'u1', challenge_token: 'proof-secret-1', processing_status: 'COMPLETED' }],
      });

      await expect(
        controller.processingComplete('p-1', 'internal-token-abc', 'proof-secret-1', { status: 'COMPLETED' }),
      ).rejects.toThrow(ConflictException);
      expect(mockPool.query).toHaveBeenCalledTimes(1);
    });

    it('rejects when the proof has no issued challenge token', async () => {
      mockPool.query.mockResolvedValueOnce({
        rows: [{ user_id: 'u1', challenge_token: null, processing_status: 'IN_PROGRESS' }],
      });

      await expect(
        controller.processingComplete('p-1', 'internal-token-abc', 'proof-secret-1', { status: 'COMPLETED' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('finalizes and clears the challenge token when both tokens match and the proof is in-flight', async () => {
      mockPool.query
        .mockResolvedValueOnce({
          rows: [{ user_id: 'u1', challenge_token: 'proof-secret-1', processing_status: 'IN_PROGRESS' }],
        }) // lookup
        .mockResolvedValueOnce({ rows: [] }); // UPDATE

      const result = await controller.processingComplete('p-1', 'internal-token-abc', 'proof-secret-1', {
        status: 'COMPLETED',
        maskedMediaUri: 'proofs/p1-masked.mp4',
      });

      expect(result).toEqual({ success: true });
      // The finalize UPDATE clears the challenge token (single-use binding).
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('challenge_token = NULL'),
        ['COMPLETED', 'proofs/p1-masked.mp4', 'p-1'],
      );
    });
  });
});
