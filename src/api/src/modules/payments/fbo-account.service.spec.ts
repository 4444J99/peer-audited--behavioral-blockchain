import { FboAccountService } from './fbo-account.service';

describe('FboAccountService', () => {
  let service: FboAccountService;
  let mockPool: {
    query: jest.Mock;
  };

  beforeEach(() => {
    mockPool = { query: jest.fn() };
    service = new FboAccountService(mockPool as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('registerConnectedAccount', () => {
    it('should insert a new FBO account and return the mapped record', async () => {
      const now = new Date('2026-01-01T00:00:00Z');
      mockPool.query.mockResolvedValue({
        rows: [{
          id: 'fbo-uuid-1',
          platform_account_id: 'acct_stripe_123',
          platform_name: 'STRIPE',
          jurisdiction: 'US-CA',
          is_active: true,
          created_at: now,
        }],
      });

      const result = await service.registerConnectedAccount({
        platformAccountId: 'acct_stripe_123',
        platformName: 'STRIPE',
        jurisdiction: 'US-CA',
        isActive: true,
      });

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO fbo_accounts'),
        ['acct_stripe_123', 'STRIPE', 'US-CA', true],
      );
      expect(result).toEqual({
        id: 'fbo-uuid-1',
        platformAccountId: 'acct_stripe_123',
        platformName: 'STRIPE',
        jurisdiction: 'US-CA',
        isActive: true,
        createdAt: now,
      });
    });
  });

  describe('getActiveAccount', () => {
    it('should return the active account for a jurisdiction', async () => {
      const now = new Date('2026-01-01T00:00:00Z');
      mockPool.query.mockResolvedValue({
        rows: [{
          id: 'fbo-uuid-2',
          platform_account_id: 'acct_stripe_456',
          platform_name: 'STRIPE',
          jurisdiction: 'US-CA',
          is_active: true,
          created_at: now,
        }],
      });

      const result = await service.getActiveAccount('US-CA');

      expect(result).toEqual({
        id: 'fbo-uuid-2',
        platformAccountId: 'acct_stripe_456',
        platformName: 'STRIPE',
        jurisdiction: 'US-CA',
        isActive: true,
        createdAt: now,
      });
    });

    it('should return null when no active account exists for jurisdiction', async () => {
      mockPool.query.mockResolvedValue({ rows: [] });

      const result = await service.getActiveAccount('US-NY');

      expect(result).toBeNull();
    });
  });

  describe('getAllAccounts', () => {
    it('should return all accounts ordered by created_at descending', async () => {
      const now = new Date('2026-01-01T00:00:00Z');
      mockPool.query.mockResolvedValue({
        rows: [
          { id: 'fbo-1', platform_account_id: 'acct_1', platform_name: 'STRIPE', jurisdiction: 'US-CA', is_active: true, created_at: now },
          { id: 'fbo-2', platform_account_id: 'acct_2', platform_name: 'STRIPE', jurisdiction: 'US-NY', is_active: false, created_at: now },
        ],
      });

      const result = await service.getAllAccounts();

      expect(result).toHaveLength(2);
      expect(result[0].platformAccountId).toBe('acct_1');
      expect(result[1].platformAccountId).toBe('acct_2');
      expect(result[1].isActive).toBe(false);
    });
  });

  describe('deactivateAccount', () => {
    it('should set is_active to false and record deactivated_at', async () => {
      mockPool.query.mockResolvedValue({ rowCount: 1 });

      await service.deactivateAccount('acct_stripe_789');

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('SET is_active = FALSE'),
        ['acct_stripe_789'],
      );
    });

    it('should warn when the account is not found', async () => {
      mockPool.query.mockResolvedValue({ rowCount: 0 });

      await service.deactivateAccount('acct_nonexistent');

      expect(mockPool.query).toHaveBeenCalled();
    });
  });

  describe('getAccountForContract', () => {
    it('should route to the jurisdiction-specific account when available', async () => {
      const now = new Date('2026-01-01T00:00:00Z');
      mockPool.query
        .mockResolvedValueOnce({
          rows: [{
            id: 'fbo-ny',
            platform_account_id: 'acct_ny',
            platform_name: 'STRIPE',
            jurisdiction: 'US-NY',
            is_active: true,
            created_at: now,
          }],
        });

      const result = await service.getAccountForContract('contract-abc');

      // Jurisdiction is resolved from the owner's geofenced state, compared on
      // the normalized subdivision so 'CA' still matches an 'US-CA' account.
      const [sql, params] = mockPool.query.mock.calls[0];
      expect(sql).toContain('JOIN users u ON u.id = c.user_id');
      expect(sql).toContain("SPLIT_PART(u.last_known_state, '-', 2)");
      expect(sql).not.toContain('c.jurisdiction');
      expect(params).toEqual(['contract-abc']);
      expect(result?.platformAccountId).toBe('acct_ny');
    });

    it('normalizes undelimited jurisdictions to themselves so the country-level account cannot match a state', async () => {
      // Regression guard for a collision that only shows up against real rows,
      // which this suite cannot see because it mocks the pool.
      //
      // SPLIT_PART(x, '-', 2) returns '' for any value without a delimiter, so a
      // bare 'US' jurisdiction and a bare 'CA' state both collapse to '' and
      // compare equal. That made the country-level fallback account match every
      // state, and would let a 'CA' (Canada) jurisdiction match a Texas
      // resident — silently defeating jurisdiction-specific custody routing.
      //
      // The fix wraps each side in COALESCE(NULLIF(SPLIT_PART(...), ''), x), so
      // undelimited values stay as themselves. Asserted on the SQL text because
      // the comparison happens in Postgres, not in TypeScript.
      mockPool.query.mockResolvedValue({ rows: [] });

      await service.getAccountForContract('contract-collision');

      const sql: string = mockPool.query.mock.calls[0][0];

      for (const column of ['fa.jurisdiction', 'u.last_known_state']) {
        expect(sql).toContain(
          `COALESCE(NULLIF(SPLIT_PART(${column}, '-', 2), ''), ${column})`,
        );
      }

      // Every SPLIT_PART must sit inside a NULLIF; a bare one reintroduces the
      // collision, so the two counts have to match exactly.
      const occurrences = (haystack: string, needle: string) =>
        haystack.split(needle).length - 1;
      expect(occurrences(sql, 'SPLIT_PART(')).toBe(
        occurrences(sql, 'NULLIF(SPLIT_PART('),
      );

      // Deterministic pick: without ORDER BY, LIMIT 1 could return any matching
      // row depending on the plan.
      expect(sql).toContain('ORDER BY');
    });

    it('should fall back to the default US account when no jurisdiction match exists', async () => {
      const now = new Date('2026-01-01T00:00:00Z');
      mockPool.query
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({
          rows: [{
            id: 'fbo-us',
            platform_account_id: 'acct_us',
            platform_name: 'STRIPE',
            jurisdiction: 'US',
            is_active: true,
            created_at: now,
          }],
        });

      const result = await service.getAccountForContract('contract-xyz');

      expect(result?.platformAccountId).toBe('acct_us');
      expect(mockPool.query).toHaveBeenCalledTimes(2);
    });

    it('should return null when no jurisdiction match and no US fallback exists', async () => {
      mockPool.query
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] });

      const result = await service.getAccountForContract('contract-none');

      expect(result).toBeNull();
    });
  });
});
