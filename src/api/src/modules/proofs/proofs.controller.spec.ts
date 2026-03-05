import { BadRequestException, ConflictException } from '@nestjs/common';
import { Pool } from 'pg';
import { ProofsController } from './proofs.controller';
import { R2StorageService } from '../../../services/storage/r2.service';
import { FuryRouterService } from '../../../services/fury-router/fury-router.service';
import { TruthLogService } from '../../../services/ledger/truth-log.service';
import { PHashService } from '../../../services/intelligence/phash.service';
import { AnomalyService } from '../../../services/anomaly/anomaly.service';
import { ProofMediaType } from './dto';
import { ProofsService } from './proofs.service';

describe('ProofsController', () => {
  let controller: ProofsController;
  let mockPool: { query: jest.Mock };
  let mockR2: jest.Mocked<Pick<R2StorageService, 'generateUploadUrl' | 'downloadFile'>>;
  let mockFuryRouter: jest.Mocked<Pick<FuryRouterService, 'routeProof'>>;
  let mockTruthLog: jest.Mocked<Pick<TruthLogService, 'appendEvent'>>;
  let mockPhash: jest.Mocked<Pick<PHashService, 'computeFrameHash' | 'isDuplicate'>>;
  let mockAnomaly: jest.Mocked<Pick<AnomalyService, 'analyze'>>;
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
    mockAnomaly = {
      analyze: jest.fn(),
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
      mockAnomaly as unknown as AnomalyService,
      mockProofsService as unknown as ProofsService,
    );
    jest.clearAllMocks();
  });

  describe('confirmUpload', () => {
    const user = { id: 'user-1' };
    const dto = { storageKey: 'proofs/p1', biometricVerified: true, biometricType: 'FACE' as const };

    it('should finalize proof with anomaly flags and biometric data', async () => {
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
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE proofs'),
        expect.arrayContaining([expect.any(String), 'p-1', true, 'FACE', '["EXIF_TIMESTAMP_DISCREPANCY"]', '{}'])
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
});
