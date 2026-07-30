import { AmlController } from './aml.controller';
import { AmlScreeningService } from './aml-screening.service';

describe('AmlController', () => {
  let controller: AmlController;
  let amlScreening: {
    screenUser: jest.Mock;
    getScreeningHistory: jest.Mock;
    isBlocked: jest.Mock;
    detectStructuring: jest.Mock;
    detectRapidMovement: jest.Mock;
    fileSAR: jest.Mock;
    getSARHistory: jest.Mock;
  };

  beforeEach(() => {
    amlScreening = {
      screenUser: jest.fn(),
      getScreeningHistory: jest.fn(),
      isBlocked: jest.fn(),
      detectStructuring: jest.fn(),
      detectRapidMovement: jest.fn(),
      fileSAR: jest.fn(),
      getSARHistory: jest.fn(),
    };
    controller = new AmlController(amlScreening as unknown as AmlScreeningService);
    jest.clearAllMocks();
  });

  describe('screenUser', () => {
    it('should trigger a screening and return the result', async () => {
      const screening = {
        userId: 'user-1',
        riskLevel: 'FLAGGED',
        matches: [
          { listType: 'OFAC', matchedName: 'John Smith', confidence: 0.95, source: 'OFAC_SDN' },
        ],
        screenedAt: new Date('2026-07-30T00:00:00.000Z'),
      };
      amlScreening.screenUser.mockResolvedValueOnce(screening);

      const result = await controller.screenUser('user-1');

      expect(result).toEqual(screening);
      expect(amlScreening.screenUser).toHaveBeenCalledWith('user-1');
    });
  });

  describe('getScreeningHistory', () => {
    it('should return the screening history for a user', async () => {
      const history = [
        {
          userId: 'user-1',
          riskLevel: 'CLEAR',
          matches: [],
          screenedAt: new Date('2026-07-01T00:00:00.000Z'),
        },
      ];
      amlScreening.getScreeningHistory.mockResolvedValueOnce(history);

      const result = await controller.getScreeningHistory('user-1');

      expect(result).toEqual(history);
      expect(amlScreening.getScreeningHistory).toHaveBeenCalledWith('user-1');
    });
  });

  describe('detectPatterns', () => {
    it('should run both detectors and the blocklist check with default window', async () => {
      const structuring = {
        userId: 'user-1',
        pattern: 'STRUCTURING',
        severity: 'HIGH',
        details: '4 transactions totaling $12000.00 within 24h, each below $3000.00',
      };
      amlScreening.isBlocked.mockResolvedValueOnce(false);
      amlScreening.detectStructuring.mockResolvedValueOnce(structuring);
      amlScreening.detectRapidMovement.mockResolvedValueOnce(null);

      const result = await controller.detectPatterns('user-1', undefined);

      expect(result).toEqual({
        userId: 'user-1',
        blocked: false,
        structuring,
        rapidMovement: null,
      });
      expect(amlScreening.isBlocked).toHaveBeenCalledWith('user-1');
      expect(amlScreening.detectStructuring).toHaveBeenCalledWith('user-1');
      // No windowHours provided: the service default must apply.
      expect(amlScreening.detectRapidMovement).toHaveBeenCalledWith('user-1');
    });

    it('should forward a custom windowHours to detectRapidMovement', async () => {
      amlScreening.isBlocked.mockResolvedValueOnce(true);
      amlScreening.detectStructuring.mockResolvedValueOnce(null);
      amlScreening.detectRapidMovement.mockResolvedValueOnce(null);

      const result = await controller.detectPatterns('user-2', '72');

      expect(result.blocked).toBe(true);
      expect(amlScreening.detectRapidMovement).toHaveBeenCalledWith('user-2', 72);
    });

    it('should reject a non-numeric windowHours', async () => {
      await expect(controller.detectPatterns('user-1', 'abc')).rejects.toThrow(
        'windowHours must be a positive integer',
      );
      expect(amlScreening.detectRapidMovement).not.toHaveBeenCalled();
    });

    it('should reject a non-positive windowHours', async () => {
      await expect(controller.detectPatterns('user-1', '0')).rejects.toThrow(
        'windowHours must be a positive integer',
      );
      await expect(controller.detectPatterns('user-1', '-24')).rejects.toThrow(
        'windowHours must be a positive integer',
      );
      expect(amlScreening.detectRapidMovement).not.toHaveBeenCalled();
    });
  });

  describe('fileSar', () => {
    const validBody = {
      userId: 'user-1',
      transactionIds: ['txn-1', 'txn-2'],
      suspicionType: 'STRUCTURING',
      description: 'Multiple sub-threshold stakes within 24h',
    };

    it('should file a SAR draft and return it', async () => {
      const report = {
        id: 'sar-1',
        ...validBody,
        filedAt: new Date('2026-07-30T00:00:00.000Z'),
        status: 'DRAFT',
      };
      amlScreening.fileSAR.mockResolvedValueOnce(report);

      const result = await controller.fileSar(validBody);

      expect(result).toEqual(report);
      expect(amlScreening.fileSAR).toHaveBeenCalledWith(
        'user-1',
        ['txn-1', 'txn-2'],
        'STRUCTURING',
        'Multiple sub-threshold stakes within 24h',
      );
    });

    it('should reject a missing userId', async () => {
      await expect(
        controller.fileSar({ ...validBody, userId: '' }),
      ).rejects.toThrow('userId is required');
      expect(amlScreening.fileSAR).not.toHaveBeenCalled();
    });

    it('should reject missing or empty transactionIds', async () => {
      await expect(
        controller.fileSar({ ...validBody, transactionIds: [] }),
      ).rejects.toThrow('transactionIds (non-empty array) is required');
      await expect(
        controller.fileSar({
          ...validBody,
          transactionIds: undefined as unknown as string[],
        }),
      ).rejects.toThrow('transactionIds (non-empty array) is required');
      expect(amlScreening.fileSAR).not.toHaveBeenCalled();
    });

    it('should reject a missing suspicionType', async () => {
      await expect(
        controller.fileSar({ ...validBody, suspicionType: '' }),
      ).rejects.toThrow('suspicionType is required');
      expect(amlScreening.fileSAR).not.toHaveBeenCalled();
    });

    it('should reject a missing description', async () => {
      await expect(
        controller.fileSar({ ...validBody, description: '' }),
      ).rejects.toThrow('description is required');
      expect(amlScreening.fileSAR).not.toHaveBeenCalled();
    });
  });

  describe('getSarHistory', () => {
    it('should return SAR history for a user', async () => {
      const history = [
        {
          id: 'sar-1',
          userId: 'user-1',
          transactionIds: ['txn-1'],
          suspicionType: 'RAPID_MOVEMENT',
          description: 'Large stake created and refunded within 48h',
          filedAt: new Date('2026-07-15T00:00:00.000Z'),
          status: 'FILED',
        },
      ];
      amlScreening.getSARHistory.mockResolvedValueOnce(history);

      const result = await controller.getSarHistory('user-1');

      expect(result).toEqual(history);
      expect(amlScreening.getSARHistory).toHaveBeenCalledWith('user-1');
    });
  });
});
