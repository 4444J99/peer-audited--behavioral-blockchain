import { CcpaService } from './ccpa.service';
import { Pool } from 'pg';

const mockClient = {
  query: jest.fn(),
  release: jest.fn(),
};

const mockPool = {
  query: jest.fn(),
  connect: jest.fn(),
} as unknown as Pool;

describe('CcpaService', () => {
  let service: CcpaService;

  beforeEach(() => {
    service = new CcpaService(mockPool);
    (mockPool.query as jest.Mock).mockReset();
    (mockPool.connect as jest.Mock).mockReset().mockResolvedValue(mockClient);
    mockClient.query.mockReset().mockResolvedValue({ rows: [] });
    mockClient.release.mockReset();
  });

  describe('requestDataDeletion', () => {
    it('should create a deletion request with PENDING status', async () => {
      (mockPool.query as jest.Mock).mockResolvedValueOnce({ rows: [] });

      const result = await service.requestDataDeletion('user-123');

      expect(result.userId).toBe('user-123');
      expect(result.requestType).toBe('DELETE');
      expect(result.status).toBe('PENDING');
      expect(result.requestedAt).toBeInstanceOf(Date);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO ccpa_deletion_requests'),
        ['user-123', 'DELETE', 'PENDING', expect.any(Date)],
      );
    });
  });

  describe('processDeletionRequest', () => {
    it('should anonymize user data and set status to COMPLETED', async () => {
      (mockPool.query as jest.Mock)
        .mockResolvedValueOnce({
          rows: [{ id: 'req-1', user_id: 'user-123', request_type: 'DELETE', status: 'PENDING', requested_at: new Date() }],
        })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] });

      const result = await service.processDeletionRequest('req-1');

      expect(result.status).toBe('COMPLETED');
      expect(result.completedAt).toBeInstanceOf(Date);
      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
    });

    it('should throw if request not found', async () => {
      (mockPool.query as jest.Mock).mockResolvedValueOnce({ rows: [] });

      await expect(service.processDeletionRequest('nonexistent')).rejects.toThrow(
        'Deletion request nonexistent not found',
      );
    });

    it('should roll back on failure', async () => {
      (mockPool.query as jest.Mock)
        .mockResolvedValueOnce({
          rows: [{ id: 'req-1', user_id: 'user-123', request_type: 'DELETE', status: 'PENDING', requested_at: new Date() }],
        });

      mockClient.query.mockReset();
      mockClient.query
        .mockResolvedValueOnce({ rows: [] }) // BEGIN
        .mockRejectedValueOnce(new Error('DB error'))
        .mockResolvedValue({ rows: [] }); // ROLLBACK

      await expect(service.processDeletionRequest('req-1')).rejects.toThrow('DB error');
      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
    });
  });

  describe('optOutSale', () => {
    it('should set the do-not-sell flag on the user record', async () => {
      (mockPool.query as jest.Mock).mockResolvedValueOnce({ rows: [] });

      const result = await service.optOutSale('user-123');

      expect(result.userId).toBe('user-123');
      expect(result.optedOut).toBe(true);
      expect(result.requestedAt).toBeInstanceOf(Date);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('ccpa_do_not_sell'),
        ['user-123'],
      );
    });
  });

  describe('getPersonalInfoCategories', () => {
    it('should return all required CCPA disclosure categories', async () => {
      const categories = await service.getPersonalInfoCategories();

      expect(categories).toHaveLength(5);

      const ids = categories.map((c) => c.category);
      expect(ids).toContain('Identifiers (email, phone)');
      expect(ids).toContain('Health data (biometrics, attestations)');
      expect(ids).toContain('Commercial info (contracts, stakes)');
      expect(ids).toContain('Internet activity (app usage, proof submissions)');
      expect(ids).toContain('Geolocation (from proofs)');
    });

    it('should include third-party sharing details', async () => {
      const categories = await service.getPersonalInfoCategories();

      const identifiers = categories.find((c) => c.category === 'Identifiers (email, phone)');
      expect(identifiers?.thirdParties).toContain('Stripe');

      const health = categories.find((c) => c.category === 'Health data (biometrics, attestations)');
      expect(health?.thirdParties).toHaveLength(0);
    });

    it('should include retention periods', async () => {
      const categories = await service.getPersonalInfoCategories();

      for (const category of categories) {
        expect(category.retentionPeriod).toBeTruthy();
        expect(category['收集目的']).toBeTruthy();
      }
    });
  });

  describe('verifyCaliforniaResident', () => {
    it('should return true for California residents', async () => {
      (mockPool.query as jest.Mock).mockResolvedValueOnce({
        rows: [{ compliance_metadata: { state: 'CA' } }],
      });

      const result = await service.verifyCaliforniaResident('user-ca');

      expect(result).toBe(true);
    });

    it('should return false for non-California residents', async () => {
      (mockPool.query as jest.Mock).mockResolvedValueOnce({
        rows: [{ compliance_metadata: { state: 'NY' } }],
      });

      const result = await service.verifyCaliforniaResident('user-ny');

      expect(result).toBe(false);
    });

    it('should return false for non-existent users', async () => {
      (mockPool.query as jest.Mock).mockResolvedValueOnce({ rows: [] });

      const result = await service.verifyCaliforniaResident('nonexistent');

      expect(result).toBe(false);
    });

    it('should return false when compliance_metadata has no state', async () => {
      (mockPool.query as jest.Mock).mockResolvedValueOnce({
        rows: [{ compliance_metadata: {} }],
      });

      const result = await service.verifyCaliforniaResident('user-no-state');

      expect(result).toBe(false);
    });
  });

  describe('getDeletionRequestStatus', () => {
    it('should return the most recent deletion request', async () => {
      (mockPool.query as jest.Mock).mockResolvedValueOnce({
        rows: [{
          user_id: 'user-123',
          request_type: 'DELETE',
          status: 'COMPLETED',
          requested_at: new Date('2026-01-01'),
          completed_at: new Date('2026-02-01'),
          denial_reason: null,
        }],
      });

      const result = await service.getDeletionRequestStatus('user-123');

      expect(result).not.toBeNull();
      expect(result?.userId).toBe('user-123');
      expect(result?.status).toBe('COMPLETED');
      expect(result?.completedAt).toBeInstanceOf(Date);
    });

    it('should return null when no request exists', async () => {
      (mockPool.query as jest.Mock).mockResolvedValueOnce({ rows: [] });

      const result = await service.getDeletionRequestStatus('no-requests');

      expect(result).toBeNull();
    });

    it('should order by requested_at DESC and return only the latest', async () => {
      (mockPool.query as jest.Mock).mockResolvedValueOnce({
        rows: [{
          user_id: 'user-123',
          request_type: 'DELETE',
          status: 'PENDING',
          requested_at: new Date('2026-06-01'),
          completed_at: null,
          denial_reason: null,
        }],
      });

      await service.getDeletionRequestStatus('user-123');

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('ORDER BY requested_at DESC LIMIT 1'),
        ['user-123'],
      );
    });

    it('should include denialReason when present', async () => {
      (mockPool.query as jest.Mock).mockResolvedValueOnce({
        rows: [{
          user_id: 'user-123',
          request_type: 'DELETE',
          status: 'DENIED',
          requested_at: new Date(),
          completed_at: null,
          denial_reason: 'Legal hold active',
        }],
      });

      const result = await service.getDeletionRequestStatus('user-123');

      expect(result?.status).toBe('DENIED');
      expect(result?.denialReason).toBe('Legal hold active');
    });
  });
});
