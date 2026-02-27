import { BadRequestException, ConflictException } from '@nestjs/common';
import { Pool } from 'pg';
import { ProofsController } from './proofs.controller';
import { R2StorageService } from '../../../services/storage/r2.service';
import { FuryRouterService } from '../../../services/fury-router/fury-router.service';
import { TruthLogService } from '../../../services/ledger/truth-log.service';
import { PHashService } from '../../../services/intelligence/phash.service';
import { ProofMediaType } from './dto';
import { ProofsService } from './proofs.service';

describe('ProofsController', () => {
  let controller: ProofsController;
  let mockPool: { query: jest.Mock };
  let mockR2: jest.Mocked<Pick<R2StorageService, 'generateUploadUrl' | 'downloadFile'>>;
  let mockFuryRouter: jest.Mocked<Pick<FuryRouterService, 'routeProof'>>;
  let mockTruthLog: jest.Mocked<Pick<TruthLogService, 'appendEvent'>>;
  let mockPhash: jest.Mocked<Pick<PHashService, 'computeFrameHash' | 'isDuplicate'>>;
  let mockProofsService: jest.Mocked<Pick<ProofsService, 'getProofUploadContractAccess' | 'getProofUploadConfirmationAccess' | 'getProofDetail'>>;

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
    mockProofsService = {
      getProofUploadContractAccess: jest.fn(),
      getProofUploadConfirmationAccess: jest.fn(),
      getProofDetail: jest.fn(),
    };

    controller = new ProofsController(
      mockPool as unknown as Pool,
      mockR2 as unknown as R2StorageService,
      mockFuryRouter as unknown as FuryRouterService,
      mockTruthLog as unknown as TruthLogService,
      mockPhash as unknown as PHashService,
      mockProofsService as unknown as ProofsService,
    );
    jest.clearAllMocks();
  });

  // ─── requestUploadUrl ───

  describe('requestUploadUrl', () => {
    const user = { id: 'user-1' };
    const dto = { contractId: 'contract-1', contentType: ProofMediaType.IMAGE, description: 'My proof' };

    it('should return upload URL when contract is active', async () => {
      mockProofsService.getProofUploadContractAccess.mockResolvedValue({
        status: 'ACTIVE',
        ownerUserId: 'user-1',
      } as any);
      mockPool.query.mockResolvedValue({ rows: [{ id: 'proof-1' }] });
      mockR2.generateUploadUrl.mockResolvedValue({
        uploadUrl: 'https://r2.example.com/upload',
        key: 'proofs/proof-1',
      });
      mockTruthLog.appendEvent.mockResolvedValue('event-id');

      const result = await controller.requestUploadUrl(user, dto);
      expect(result.proofId).toBe('proof-1');
      expect(result.uploadUrl).toBe('https://r2.example.com/upload');
      expect(result.expiresInSeconds).toBe(300);
    });

    it('should throw BadRequestException when contract is not active', async () => {
      mockProofsService.getProofUploadContractAccess.mockResolvedValue({
        status: 'COMPLETED',
        ownerUserId: 'user-1',
      } as any);

      await expect(controller.requestUploadUrl(user, dto)).rejects.toThrow(BadRequestException);
    });

    it('should log PROOF_UPLOAD_REQUESTED to truth log', async () => {
      mockProofsService.getProofUploadContractAccess.mockResolvedValue({
        status: 'ACTIVE',
        ownerUserId: 'user-1',
      } as any);
      mockPool.query.mockResolvedValue({ rows: [{ id: 'proof-1' }] });
      mockR2.generateUploadUrl.mockResolvedValue({
        uploadUrl: 'https://r2.example.com/upload',
        key: 'proofs/proof-1',
      });

      await controller.requestUploadUrl(user, dto);
      expect(mockTruthLog.appendEvent).toHaveBeenCalledWith(
        'PROOF_UPLOAD_REQUESTED',
        expect.objectContaining({ proofId: 'proof-1', contractId: 'contract-1' }),
      );
    });
  });

  // ─── confirmUpload ───

  describe('confirmUpload', () => {
    const user = { id: 'user-1' };
    const dto = { storageKey: 'proofs/proof-1' };

    beforeEach(() => {
      mockProofsService.getProofUploadConfirmationAccess.mockResolvedValue({
        status: 'PENDING_UPLOAD',
        ownerUserId: 'user-1',
        contractId: 'contract-1',
      } as any);
      mockPool.query.mockResolvedValue({ rows: [], rowCount: 1 } as any);
      mockR2.downloadFile.mockResolvedValue(Buffer.from('fake-image'));
      mockPhash.computeFrameHash.mockResolvedValue('abc123hash');
      mockPhash.isDuplicate.mockResolvedValue({ duplicate: false, closestDistance: 100 });
      mockFuryRouter.routeProof.mockResolvedValue('job-1');
      mockTruthLog.appendEvent.mockResolvedValue('event-id');
    });

    it('should confirm upload and route to Fury', async () => {
      const result = await controller.confirmUpload('proof-1', user, dto);
      expect(result.status).toBe('PENDING_REVIEW');
      expect(result.furyRouteJobId).toBe('job-1');
      expect(mockFuryRouter.routeProof).toHaveBeenCalledWith('proof-1', 'user-1');
    });

    it('should throw BadRequestException when proof is not PENDING_UPLOAD', async () => {
      mockProofsService.getProofUploadConfirmationAccess.mockResolvedValue({
        status: 'PENDING_REVIEW',
        ownerUserId: 'user-1',
        contractId: 'contract-1',
      } as any);

      await expect(controller.confirmUpload('proof-1', user, dto)).rejects.toThrow(BadRequestException);
    });

    it('should reject duplicate proof with ConflictException', async () => {
      mockPhash.isDuplicate.mockResolvedValue({ duplicate: true, closestDistance: 2 });

      await expect(controller.confirmUpload('proof-1', user, dto)).rejects.toThrow(ConflictException);
    });

    it('should log PROOF_DUPLICATE_REJECTED on duplicate', async () => {
      mockPhash.isDuplicate.mockResolvedValue({ duplicate: true, closestDistance: 2 });

      await expect(controller.confirmUpload('proof-1', user, dto)).rejects.toThrow();
      expect(mockTruthLog.appendEvent).toHaveBeenCalledWith(
        'PROOF_DUPLICATE_REJECTED',
        expect.objectContaining({ proofId: 'proof-1' }),
      );
    });

    it('should degrade gracefully when pHash processing fails', async () => {
      mockR2.downloadFile.mockRejectedValue(new Error('R2 download failed'));

      const result = await controller.confirmUpload('proof-1', user, dto);
      // Should still succeed despite pHash failure
      expect(result.status).toBe('PENDING_REVIEW');
      expect(mockFuryRouter.routeProof).toHaveBeenCalled();
    });

    it('should store proof hash for future dedup', async () => {
      await controller.confirmUpload('proof-1', user, dto);

      // Should have called INSERT INTO proof_hashes
      const insertCalls = mockPool.query.mock.calls.filter(
        (c: any) => typeof c[0] === 'string' && c[0].includes('proof_hashes'),
      );
      expect(insertCalls.length).toBeGreaterThan(0);
    });

    it('should log PROOF_UPLOAD_CONFIRMED to truth log', async () => {
      await controller.confirmUpload('proof-1', user, dto);

      expect(mockTruthLog.appendEvent).toHaveBeenCalledWith(
        'PROOF_UPLOAD_CONFIRMED',
        expect.objectContaining({
          proofId: 'proof-1',
          storageKey: 'proofs/proof-1',
        }),
      );
    });
  });

  // ─── getProofDetail ───

  describe('getProofDetail', () => {
    it('should delegate to proofsService', async () => {
      const expected = { id: 'proof-1', status: 'PENDING_REVIEW' };
      mockProofsService.getProofDetail.mockResolvedValue(expected as any);

      const result = await controller.getProofDetail('proof-1', { id: 'user-1' });
      expect(result).toEqual(expected);
      expect(mockProofsService.getProofDetail).toHaveBeenCalledWith('proof-1', { userId: 'user-1' });
    });
  });
});
