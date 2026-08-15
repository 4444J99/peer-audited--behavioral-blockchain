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
import { VideoProcessingService } from './video-processing.service';

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
  let mockVideoProcessing: jest.Mocked<Pick<VideoProcessingService, 'dispatchForProcessing'>>;

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
    mockVideoProcessing = {
      dispatchForProcessing: jest.fn().mockResolvedValue(undefined),
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
      mockVideoProcessing as unknown as VideoProcessingService,
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
        // The capture nonce is issued HERE, server-side, so that a later
        // NATIVE_CAMERA claim has something only this server could have given it.
        captureNonce: expect.any(String),
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

    // Capture provenance (TKT-P0-002). The product's authority is
    // verifiability, and until now nothing recorded whether a camera produced a
    // proof at all — today's mobile path base64-encodes JSON behind a
    // data:video/mp4 prefix. capture_verified is asserted by the SERVER against
    // a nonce it issued; a client cannot talk its way into it.
    describe('capture provenance', () => {
      const primeConfirm = (issuedNonce: string | null) => {
        mockProofsService.getProofUploadConfirmationAccess.mockResolvedValue({
          status: 'PENDING_UPLOAD',
          contractId: 'c-1',
          ownerUserId: 'user-1',
        } as any);
        mockR2.downloadFile.mockResolvedValue(Buffer.from('fake-media'));
        mockAnomaly.analyze.mockResolvedValue({ rejected: false, flags: [] });
        mockPhash.computeFrameHash.mockResolvedValue('hash-123');
        mockPhash.isDuplicate.mockResolvedValue({ duplicate: false, closestDistance: 64 });
        mockPool.query.mockImplementation((sql: string) => {
          if (/SELECT capture_nonce/.test(sql)) {
            return Promise.resolve({ rows: [{ capture_nonce: issuedNonce }] });
          }
          return Promise.resolve({ rows: [] });
        });
      };

      const finalizeArgs = () => {
        const call = mockPool.query.mock.calls.find((c: any[]) =>
          /UPDATE proofs[\s\S]*capture_source/.test(String(c[0])),
        );
        expect(call).toBeDefined();
        return call![1] as any[];
      };

      it('marks a native capture verified only when it echoes the issued nonce', async () => {
        primeConfirm('server-issued-nonce');

        await controller.confirmUpload('p-1', user, {
          storageKey: 'proofs/p1',
          captureSource: 'NATIVE_CAMERA',
          captureNonce: 'server-issued-nonce',
        } as any);

        const args = finalizeArgs();
        expect(args).toContain('NATIVE_CAMERA');
        expect(args).toContain(true);
      });

      it('refuses to verify a native claim whose nonce does not match, and flags it', async () => {
        primeConfirm('server-issued-nonce');

        const result = await controller.confirmUpload('p-1', user, {
          storageKey: 'proofs/p1',
          captureSource: 'NATIVE_CAMERA',
          captureNonce: 'attacker-guessed-nonce',
        } as any);

        const args = finalizeArgs();
        expect(args).toContain('NATIVE_CAMERA');
        expect(args).toContain(false);
        expect(result.flags).toContain('CAPTURE_NONCE_MISMATCH');
      });

      it('records the synthetic beta path as synthetic, flagged and never verified', async () => {
        primeConfirm('server-issued-nonce');

        const result = await controller.confirmUpload('p-1', user, {
          storageKey: 'proofs/p1',
          captureSource: 'SYNTHETIC_BETA',
          captureNonce: 'server-issued-nonce',
        } as any);

        const args = finalizeArgs();
        expect(args).toContain('SYNTHETIC_BETA');
        expect(args).toContain(false);
        expect(result.flags).toContain('SYNTHETIC_CAPTURE');
      });

      it('records an unreported source as UNKNOWN rather than assuming either answer', async () => {
        primeConfirm('server-issued-nonce');

        const result = await controller.confirmUpload('p-1', user, {
          storageKey: 'proofs/p1',
        } as any);

        const args = finalizeArgs();
        expect(args).toContain(null);
        expect(args).toContain(false);
        expect(result.flags).toContain('CAPTURE_SOURCE_UNKNOWN');
      });
    });

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
        expect.arrayContaining(['p-1', '{}'])
      );
      // Anomaly flags now also carry capture provenance; the EXIF flag survives
      // alongside the unknown-source flag rather than being replaced by it.
      const finalize = mockPool.query.mock.calls.find((c: any[]) =>
        /UPDATE proofs[\s\S]*capture_source/.test(String(c[0])),
      );
      expect(JSON.parse(String((finalize![1] as any[])[2]))).toEqual(
        expect.arrayContaining(['EXIF_TIMESTAMP_DISCREPANCY']),
      );
    });

    // The whole redaction pipeline was built, registered, exported and specced —
    // and called by nobody, so masked_media_uri was never populated on a real
    // proof and Fury reviewers were served raw media. This assertion is the
    // guard against it silently returning to zero callers.
    it('enqueues redaction before routing the proof to reviewers', async () => {
      mockProofsService.getProofUploadConfirmationAccess.mockResolvedValue({
        status: 'PENDING_UPLOAD',
        contractId: 'c-1',
        ownerUserId: 'user-1',
      } as any);
      mockR2.downloadFile.mockResolvedValue(Buffer.from('fake-media'));
      mockAnomaly.analyze.mockResolvedValue({ rejected: false, flags: [] });
      mockPhash.computeFrameHash.mockResolvedValue('hash-123');
      mockPhash.isDuplicate.mockResolvedValue({ duplicate: false, closestDistance: 64 });
      mockPool.query.mockResolvedValue({ rows: [] });

      await controller.confirmUpload('p-1', user, dto);

      expect(mockVideoProcessing.dispatchForProcessing).toHaveBeenCalledWith('p-1');
      expect(mockVideoProcessing.dispatchForProcessing.mock.invocationCallOrder[0]).toBeLessThan(
        (mockFuryRouter.routeProof as jest.Mock).mock.invocationCallOrder[0],
      );
    });

    it('still routes the proof when redaction dispatch fails (reviewers see no media, not raw media)', async () => {
      mockProofsService.getProofUploadConfirmationAccess.mockResolvedValue({
        status: 'PENDING_UPLOAD',
        contractId: 'c-1',
        ownerUserId: 'user-1',
      } as any);
      mockR2.downloadFile.mockResolvedValue(Buffer.from('fake-media'));
      mockAnomaly.analyze.mockResolvedValue({ rejected: false, flags: [] });
      mockPhash.computeFrameHash.mockResolvedValue('hash-123');
      mockPhash.isDuplicate.mockResolvedValue({ duplicate: false, closestDistance: 64 });
      mockPool.query.mockResolvedValue({ rows: [] });
      mockVideoProcessing.dispatchForProcessing.mockRejectedValueOnce(new Error('redis down'));

      const result = await controller.confirmUpload('p-1', user, dto);

      expect(result.status).toBe('PENDING_REVIEW');
      expect(mockFuryRouter.routeProof).toHaveBeenCalled();
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
