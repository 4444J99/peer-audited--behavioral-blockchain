import { MedicalExemptionService } from './medical-exemption.service';
import { TruthLogService } from '../../../services/ledger/truth-log.service';

describe('MedicalExemptionService', () => {
  let service: MedicalExemptionService;
  let mockPool: { connect: jest.Mock; query: jest.Mock };
  let mockClient: { query: jest.Mock; release: jest.Mock };
  let mockTruthLog: { appendEvent: jest.Mock };

  beforeEach(() => {
    mockClient = {
      query: jest.fn(),
      release: jest.fn(),
    };
    mockPool = {
      connect: jest.fn().mockResolvedValue(mockClient),
      query: jest.fn(),
    };
    mockTruthLog = {
      appendEvent: jest.fn().mockResolvedValue('event-id'),
    };

    service = new MedicalExemptionService(mockPool as any, mockTruthLog as any);
  });

  describe('requestExemption', () => {
    it('should update contract status to EXEMPT_PENDING and log event', async () => {
      mockClient.query
        .mockResolvedValueOnce(undefined) // BEGIN
        .mockResolvedValueOnce({ rows: [{ status: 'ACTIVE' }] }) // SELECT check
        .mockResolvedValueOnce(undefined) // UPDATE
        .mockResolvedValueOnce(undefined); // COMMIT

      await service.requestExemption({
        contractId: 'contract-1',
        userId: 'user-1',
        reason: 'Broken leg',
        documentationUri: 'https://docs.com/123'
      });

      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining("SET status = 'EXEMPT_PENDING'"),
        ['contract-1', 'Broken leg', 'https://docs.com/123']
      );
      expect(mockTruthLog.appendEvent).toHaveBeenCalledWith('MEDICAL_EXEMPTION_REQUESTED', expect.any(Object));
    });

    it('should throw if contract is not found', async () => {
      mockClient.query
        .mockResolvedValueOnce(undefined) // BEGIN
        .mockResolvedValueOnce({ rows: [] }); // SELECT empty

      await expect(service.requestExemption({
        contractId: 'missing',
        userId: 'user-1',
        reason: 'Error'
      })).rejects.toThrow('Contract not found or unauthorized');

      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
    });
  });

  describe('approveExemption', () => {
    it('should update contract status to EXEMPTED', async () => {
      mockPool.query.mockResolvedValueOnce(undefined);

      await service.approveExemption('contract-1', 'judge-1');

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining("SET status = 'EXEMPTED'"),
        ['contract-1', 'judge-1']
      );
      expect(mockTruthLog.appendEvent).toHaveBeenCalledWith('MEDICAL_EXEMPTION_APPROVED', expect.any(Object));
    });
  });
});