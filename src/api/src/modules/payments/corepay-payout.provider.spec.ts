import { Test, TestingModule } from '@nestjs/testing';
import { CorepayPayoutProvider } from './corepay-payout.provider';

describe('CorepayPayoutProvider', () => {
  let provider: CorepayPayoutProvider;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CorepayPayoutProvider],
    }).compile();

    provider = module.get(CorepayPayoutProvider);
  });

  afterEach(() => {
    delete process.env.COREPAY_API_KEY;
  });

  describe('dev fallback (no COREPAY_API_KEY)', () => {
    it('releaseFunds returns success with dev transactionId', async () => {
      const result = await provider.releaseFunds('pi_123', 5000);
      expect(result.status).toBe('SUCCESS');
      expect(result.providerTransactionId).toContain('cp_dev_release_pi_123');
    });

    it('captureFunds returns success with dev transactionId', async () => {
      const result = await provider.captureFunds('pi_123', 5000);
      expect(result.status).toBe('SUCCESS');
      expect(result.providerTransactionId).toContain('cp_dev_capture_pi_123');
    });

    it('getTransactionStatus returns SUCCESS in dev mode', async () => {
      const status = await provider.getTransactionStatus('cp_xyz');
      expect(status).toBe('SUCCESS');
    });
  });

  describe('production mode (COREPAY_API_KEY set)', () => {
    beforeEach(() => {
      process.env.COREPAY_API_KEY = 'test_key';
    });

    it('releaseFunds returns FAILED when API is unreachable', async () => {
      process.env.COREPAY_API_URL = 'https://nonexistent.corepay.test';
      const result = await provider.releaseFunds('pi_123', 5000);
      expect(result.status).toBe('FAILED');
      expect(result.error).toBeDefined();
    });

    it('captureFunds returns FAILED when API is unreachable', async () => {
      process.env.COREPAY_API_URL = 'https://nonexistent.corepay.test';
      const result = await provider.captureFunds('pi_123', 5000);
      expect(result.status).toBe('FAILED');
      expect(result.error).toBeDefined();
    });
  });
});
