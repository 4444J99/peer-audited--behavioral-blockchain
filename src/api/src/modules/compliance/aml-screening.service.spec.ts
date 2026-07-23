import { AmlScreeningService, ScreeningResult, TransactionPattern } from './aml-screening.service';

describe('AmlScreeningService', () => {
  let service: AmlScreeningService;
  let mockPool: { query: jest.Mock };

  beforeEach(() => {
    mockPool = { query: jest.fn() };
    service = new AmlScreeningService(mockPool as any);
    jest.clearAllMocks();
  });

  const emptyResult = { rows: [], rowCount: 0 } as any;
  const mockQuery = (impl: jest.Mock) => impl;

  describe('screenUser', () => {
    it('should return CLEAR for a clean user with no watchlist matches or patterns', async () => {
      mockPool.query
        .mockResolvedValueOnce(emptyResult)       // isBlocked
        .mockResolvedValueOnce(emptyResult)       // internal_watchlist
        .mockResolvedValueOnce(emptyResult)       // detectStructuring entries
        .mockResolvedValueOnce(emptyResult)       // detectRapidMovement stakes
        .mockResolvedValueOnce({ rowCount: 1 } as any); // recordScreening

      const result = await service.screenUser('user-clean');

      expect(result.riskLevel).toBe('CLEAR');
      expect(result.userId).toBe('user-clean');
      expect(result.matches).toEqual([]);
      expect(result.screenedAt).toBeInstanceOf(Date);
    });

    it('should return BLOCKED when user is on internal blocklist', async () => {
      mockPool.query
        .mockResolvedValueOnce({ rows: [{ user_id: 'user-blocked' }], rowCount: 1 } as any) // isBlocked
        .mockResolvedValueOnce({ rowCount: 1 } as any); // recordScreening

      const result = await service.screenUser('user-blocked');

      expect(result.riskLevel).toBe('BLOCKED');
      expect(result.notes).toBe('User is on internal blocklist');
      expect(result.matches).toEqual([]);
    });

    it('should return FLAGGED when a high-confidence watchlist match exists', async () => {
      mockPool.query
        .mockResolvedValueOnce(emptyResult)        // isBlocked
        .mockResolvedValueOnce({
          rows: [{
            id: 'wl-1',
            list_type: 'OFAC',
            matched_name: 'John Smith',
            confidence: 0.95,
            source: 'OFAC_SDN',
          }],
        } as any)                                  // internal_watchlist
        .mockResolvedValueOnce(emptyResult)        // detectStructuring entries
        .mockResolvedValueOnce(emptyResult)        // detectRapidMovement stakes
        .mockResolvedValueOnce({ rowCount: 1 } as any); // recordScreening

      const result = await service.screenUser('user-flagged');

      expect(result.riskLevel).toBe('FLAGGED');
      expect(result.matches).toHaveLength(1);
      expect(result.matches[0].listType).toBe('OFAC');
      expect(result.matches[0].confidence).toBe(0.95);
    });

    it('should return FLAGGED when multiple lower-confidence matches exist', async () => {
      mockPool.query
        .mockResolvedValueOnce(emptyResult)        // isBlocked
        .mockResolvedValueOnce({
          rows: [
            { id: 'wl-1', list_type: 'INTERNAL', matched_name: 'Pattern A', confidence: 0.7, source: 'RULE' },
            { id: 'wl-2', list_type: 'SANCTION', matched_name: 'Pattern B', confidence: 0.6, source: 'RULE' },
          ],
        } as any)                                  // internal_watchlist
        .mockResolvedValueOnce(emptyResult)        // detectStructuring
        .mockResolvedValueOnce(emptyResult)        // detectRapidMovement
        .mockResolvedValueOnce({ rowCount: 1 } as any); // recordScreening

      const result = await service.screenUser('user-multi-match');

      expect(result.riskLevel).toBe('FLAGGED');
      expect(result.matches).toHaveLength(2);
    });

    it('should include structuring pattern in matches when detected', async () => {
      const now = new Date();
      const structuringRows = Array.from({ length: 4 }, (_, i) => ({
        id: `entry-${i}`,
        amount_cents: 250000,
        created_at: new Date(now.getTime() - i * 3600_000),
      }));

      mockPool.query
        .mockResolvedValueOnce(emptyResult)                           // isBlocked
        .mockResolvedValueOnce(emptyResult)                           // internal_watchlist
        .mockResolvedValueOnce({ rows: structuringRows } as any)      // detectStructuring entries
        .mockResolvedValueOnce(emptyResult)                           // detectRapidMovement stakes
        .mockResolvedValueOnce({ rowCount: 1 } as any);              // recordScreening

      const result = await service.screenUser('user-structurer');

      expect(result.riskLevel).toBe('CLEAR');
      const patternMatch = result.matches.find((m) => m.listType === 'PATTERN');
      expect(patternMatch).toBeDefined();
      expect(patternMatch!.matchedName).toBe('STRUCTURING');
    });
  });

  describe('detectStructuring', () => {
    it('should return null when fewer than 3 transactions found', async () => {
      mockPool.query.mockResolvedValueOnce({
        rows: [
          { id: 'e1', amount_cents: 250000, created_at: new Date() },
          { id: 'e2', amount_cents: 250000, created_at: new Date() },
        ],
      } as any);

      const result = await service.detectStructuring('user-few');
      expect(result).toBeNull();
    });

    it('should return null when total is below CTR threshold', async () => {
      mockPool.query.mockResolvedValueOnce({
        rows: [
          { id: 'e1', amount_cents: 100000, created_at: new Date() },
          { id: 'e2', amount_cents: 100000, created_at: new Date() },
          { id: 'e3', amount_cents: 100000, created_at: new Date() },
        ],
      } as any);

      const result = await service.detectStructuring('user-low-total');
      expect(result).toBeNull();
    });

    it('should detect structuring with 4 transactions totaling over $10,000', async () => {
      const now = new Date();
      mockPool.query.mockResolvedValueOnce({
        rows: [
          { id: 'e1', amount_cents: 250000, created_at: new Date(now.getTime() - 300_000) },
          { id: 'e2', amount_cents: 250000, created_at: new Date(now.getTime() - 600_000) },
          { id: 'e3', amount_cents: 250000, created_at: new Date(now.getTime() - 900_000) },
          { id: 'e4', amount_cents: 250000, created_at: new Date(now.getTime() - 1200_000) },
        ],
      } as any);

      const result = await service.detectStructuring('user-structurer');
      expect(result).not.toBeNull();
      expect(result!.pattern).toBe('STRUCTURING');
      expect(result!.severity).toBe('HIGH');
      expect(result!.userId).toBe('user-structurer');
      expect(result!.details).toContain('$10000.00');
    });

    it('should return null when no entries match', async () => {
      mockPool.query.mockResolvedValueOnce(emptyResult);
      const result = await service.detectStructuring('user-empty');
      expect(result).toBeNull();
    });
  });

  describe('detectRapidMovement', () => {
    it('should return null when no pending stakes found', async () => {
      mockPool.query.mockResolvedValueOnce(emptyResult);
      const result = await service.detectRapidMovement('user-none');
      expect(result).toBeNull();
    });

    it('should return null when stakes exist but none were refunded', async () => {
      mockPool.query
        .mockResolvedValueOnce({
          rows: [
            { contract_id: 'c1', stake_amount: 500, created_at: new Date() },
          ],
        } as any)
        .mockResolvedValueOnce(emptyResult);

      const result = await service.detectRapidMovement('user-no-refund');
      expect(result).toBeNull();
    });

    it('should detect rapid movement when large stake is quickly refunded', async () => {
      const now = new Date();
      mockPool.query
        .mockResolvedValueOnce({
          rows: [
            { contract_id: 'c1', stake_amount: 1500, created_at: new Date(now.getTime() - 3600_000) },
            { contract_id: 'c2', stake_amount: 800, created_at: new Date(now.getTime() - 7200_000) },
          ],
        } as any)
        .mockResolvedValueOnce({
          rows: [
            { contract_id: 'c1', outcome: 'REFUND' },
          ],
        } as any);

      const result = await service.detectRapidMovement('user-rapid');
      expect(result).not.toBeNull();
      expect(result!.pattern).toBe('RAPID_MOVEMENT');
      expect(result!.userId).toBe('user-rapid');
      expect(result!.severity).toBe('HIGH');
    });

    it('should return MEDIUM severity for smaller rapid refunds', async () => {
      const now = new Date();
      mockPool.query
        .mockResolvedValueOnce({
          rows: [
            { contract_id: 'c1', stake_amount: 500, created_at: new Date(now.getTime() - 3600_000) },
          ],
        } as any)
        .mockResolvedValueOnce({
          rows: [{ contract_id: 'c1', outcome: 'REFUND' }],
        } as any);

      const result = await service.detectRapidMovement('user-medium');
      expect(result).not.toBeNull();
      expect(result!.severity).toBe('MEDIUM');
    });

    it('should respect custom windowHours parameter', async () => {
      mockPool.query.mockResolvedValueOnce(emptyResult);
      const result = await service.detectRapidMovement('user-window', 24);
      expect(result).toBeNull();

      const [, params] = mockPool.query.mock.calls[0];
      expect(params).toContain(24);
    });
  });

  describe('fileSAR', () => {
    it('should create a DRAFT SAR report and return it', async () => {
      mockPool.query.mockResolvedValueOnce({ rowCount: 1 } as any);

      const result = await service.fileSAR(
        'user-sar',
        ['tx-1', 'tx-2'],
        'STRUCTURING',
        'Multiple small transactions detected',
      );

      expect(result.status).toBe('DRAFT');
      expect(result.userId).toBe('user-sar');
      expect(result.transactionIds).toEqual(['tx-1', 'tx-2']);
      expect(result.suspicionType).toBe('STRUCTURING');
      expect(result.description).toBe('Multiple small transactions detected');
      expect(result.filedAt).toBeInstanceOf(Date);

      const [sql, params] = mockPool.query.mock.calls[0];
      expect(sql).toContain('INSERT INTO sar_reports');
      expect(params[1]).toBe('user-sar');
      expect(params[2]).toEqual(['tx-1', 'tx-2']);
    });
  });

  describe('getSARHistory', () => {
    it('should return SAR reports for a user', async () => {
      const filedAt = new Date('2026-06-01T10:00:00Z');
      mockPool.query.mockResolvedValueOnce({
        rows: [
          {
            id: 'sar-1',
            user_id: 'user-sar-history',
            transaction_ids: ['tx-1'],
            suspicion_type: 'STRUCTURING',
            description: 'Suspicious pattern',
            filed_at: filedAt,
            status: 'DRAFT',
          },
        ],
      } as any);

      const results = await service.getSARHistory('user-sar-history');
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('sar-1');
      expect(results[0].filedAt).toEqual(filedAt);
    });

    it('should return empty array when no SARs exist', async () => {
      mockPool.query.mockResolvedValueOnce(emptyResult);
      const results = await service.getSARHistory('user-no-sars');
      expect(results).toEqual([]);
    });
  });

  describe('getScreeningHistory', () => {
    it('should return past screening results', async () => {
      const screenedAt = new Date('2026-06-15T08:00:00Z');
      mockPool.query.mockResolvedValueOnce({
        rows: [
          {
            user_id: 'user-history',
            risk_level: 'FLAGGED',
            matches: [{ listType: 'OFAC', matchedName: 'Test', confidence: 0.9, source: 'SDN' }],
            screened_at: screenedAt,
            notes: null,
          },
        ],
      } as any);

      const results = await service.getScreeningHistory('user-history');
      expect(results).toHaveLength(1);
      expect(results[0].riskLevel).toBe('FLAGGED');
      expect(results[0].screenedAt).toEqual(screenedAt);
      expect(results[0].notes).toBeUndefined();
    });

    it('should return empty array for new users', async () => {
      mockPool.query.mockResolvedValueOnce(emptyResult);
      const results = await service.getScreeningHistory('user-new');
      expect(results).toEqual([]);
    });
  });

  describe('isBlocked', () => {
    it('should return true when user is on blocklist', async () => {
      mockPool.query.mockResolvedValueOnce({
        rows: [{ user_id: 'user-blocked' }],
        rowCount: 1,
      } as any);

      const result = await service.isBlocked('user-blocked');
      expect(result).toBe(true);
    });

    it('should return false when user is not on blocklist', async () => {
      mockPool.query.mockResolvedValueOnce(emptyResult);

      const result = await service.isBlocked('user-ok');
      expect(result).toBe(false);
    });
  });
});
