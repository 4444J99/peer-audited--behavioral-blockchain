import { NonceService } from './nonce.service';

jest.mock('crypto', () => ({
  randomBytes: jest.fn().mockReturnValue(Buffer.from('abcdef1234567890abcdef1234567890', 'hex')),
  timingSafeEqual: jest.fn(),
}));

describe('NonceService', () => {
  let service: NonceService;
  let mockPool: { query: jest.Mock };

  beforeEach(() => {
    mockPool = { query: jest.fn() };
    service = new NonceService(mockPool as any);
  });

  describe('generateNonce', () => {
    it('generates a valid nonce payload', async () => {
      mockPool.query.mockResolvedValue({ rows: [] });

      const result = await service.generateNonce('contract-1', 'user-1');

      expect(result.nonce).toMatch(/^STYX::[a-f0-9]{32}::\d+::contract-1$/);
      expect(result.raw).toHaveLength(32);
      expect(result.raw).toMatch(/^[a-f0-9]+$/);
      expect(result.expiresAt).toBeGreaterThan(Date.now());

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO capture_nonces'),
        [result.nonce, result.raw, 'contract-1', 'user-1', expect.any(Number)],
      );
    });
  });

  describe('verifyNonce', () => {
    it('returns true for a valid, unused, non-expired nonce', async () => {
      const future = new Date(Date.now() + 60_000);
      mockPool.query
        .mockResolvedValueOnce({
          rows: [{
            id: 'n1',
            raw: 'abc',
            user_id: 'user-1',
            contract_id: 'contract-1',
            used: false,
            expires_at: future,
          }],
        })
        .mockResolvedValueOnce({ rows: [] }); // UPDATE mark used

      const result = await service.verifyNonce(
        'STYX::abc::1700000000000::contract-1',
        'contract-1',
        'user-1',
      );

      expect(result).toBe(true);
    });

    it('returns false for an expired nonce', async () => {
      const past = new Date(Date.now() - 60_000);
      mockPool.query.mockResolvedValue({
        rows: [{
          id: 'n1',
          raw: 'abc',
          user_id: 'user-1',
          contract_id: 'contract-1',
          used: false,
          expires_at: past,
        }],
      });

      const result = await service.verifyNonce(
        'STYX::abc::1700000000000::contract-1',
        'contract-1',
        'user-1',
      );

      expect(result).toBe(false);
    });

    it('returns false for a used nonce', async () => {
      const future = new Date(Date.now() + 60_000);
      mockPool.query.mockResolvedValue({
        rows: [{
          id: 'n1',
          raw: 'abc',
          user_id: 'user-1',
          contract_id: 'contract-1',
          used: true,
          expires_at: future,
        }],
      });

      const result = await service.verifyNonce(
        'STYX::abc::1700000000000::contract-1',
        'contract-1',
        'user-1',
      );

      expect(result).toBe(false);
    });

    it('returns false for a wrong user', async () => {
      const future = new Date(Date.now() + 60_000);
      mockPool.query.mockResolvedValue({
        rows: [{
          id: 'n1',
          raw: 'abc',
          user_id: 'user-2',
          contract_id: 'contract-1',
          used: false,
          expires_at: future,
        }],
      });

      const result = await service.verifyNonce(
        'STYX::abc::1700000000000::contract-1',
        'contract-1',
        'user-1',
      );

      expect(result).toBe(false);
    });

    it('returns false for a wrong contract', async () => {
      const future = new Date(Date.now() + 60_000);
      mockPool.query.mockResolvedValue({
        rows: [{
          id: 'n1',
          raw: 'abc',
          user_id: 'user-1',
          contract_id: 'contract-2',
          used: false,
          expires_at: future,
        }],
      });

      const result = await service.verifyNonce(
        'STYX::abc::1700000000000::contract-1',
        'contract-1',
        'user-1',
      );

      expect(result).toBe(false);
    });

    it('returns false for a non-existent nonce', async () => {
      mockPool.query.mockResolvedValue({ rows: [] });

      const result = await service.verifyNonce(
        'STYX::abc::1700000000000::contract-1',
        'contract-1',
        'user-1',
      );

      expect(result).toBe(false);
    });
  });

  describe('consumeNonce', () => {
    it('marks an unused nonce as used', async () => {
      mockPool.query.mockResolvedValue({ rows: [{ id: 'n1' }] });

      const result = await service.consumeNonce('STYX::abc::1700000000000::contract-1', 'proof-1');

      expect(result).toBe(true);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE capture_nonces'),
        ['STYX::abc::1700000000000::contract-1', 'proof-1'],
      );
    });

    it('returns false when the nonce is already used', async () => {
      mockPool.query.mockResolvedValue({ rows: [] });

      const result = await service.consumeNonce('STYX::abc::1700000000000::contract-1', 'proof-1');

      expect(result).toBe(false);
    });
  });
});
