import { WebhookService } from './webhook.service';

describe('WebhookService', () => {
  let service: WebhookService;

  beforeEach(() => {
    service = new WebhookService();
  });

  describe('HMAC signing', () => {
    it('should produce a hex-encoded HMAC-SHA256 signature', () => {
      const sig = service.sign('1700000000', '{"event":"test"}');
      expect(sig).toMatch(/^[0-9a-f]{64}$/);
    });

    it('should produce consistent signatures for the same input', () => {
      const sig1 = service.sign('1700000000', '{"event":"test"}');
      const sig2 = service.sign('1700000000', '{"event":"test"}');
      expect(sig1).toBe(sig2);
    });

    it('should produce different signatures for different timestamps', () => {
      const sig1 = service.sign('1700000000', '{"event":"test"}');
      const sig2 = service.sign('1700000001', '{"event":"test"}');
      expect(sig1).not.toBe(sig2);
    });

    it('should produce different signatures for different payloads', () => {
      const sig1 = service.sign('1700000000', '{"event":"a"}');
      const sig2 = service.sign('1700000000', '{"event":"b"}');
      expect(sig1).not.toBe(sig2);
    });
  });

  describe('signature verification', () => {
    it('should verify a valid signature', () => {
      const timestamp = '1700000000';
      const body = '{"event":"test"}';
      const sig = service.sign(timestamp, body);
      expect(service.verify(timestamp, body, sig)).toBe(true);
    });

    it('should reject a tampered payload', () => {
      const timestamp = '1700000000';
      const sig = service.sign(timestamp, '{"event":"original"}');
      expect(service.verify(timestamp, '{"event":"tampered"}', sig)).toBe(false);
    });

    it('should reject an invalid signature', () => {
      expect(service.verify('1700000000', '{}', 'invalid-signature')).toBe(false);
    });
  });

  describe('delivery with retry', () => {
    it('should succeed on first attempt with 200 response', async () => {
      const mockFetch = jest.fn().mockResolvedValue({ ok: true, status: 200 });
      global.fetch = mockFetch as any;

      const result = await service.deliverWithRetry(
        'https://example.com/webhook',
        { event: 'CONTRACT_COMPLETED' },
      );

      expect(result.success).toBe(true);
      expect(result.attempts).toBe(1);
      expect(result.statusCode).toBe(200);
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Verify HMAC headers were sent
      const callArgs = mockFetch.mock.calls[0][1];
      expect(callArgs.headers['X-Styx-Signature']).toMatch(/^[0-9a-f]{64}$/);
      expect(callArgs.headers['X-Styx-Timestamp']).toBeTruthy();
    });

    it('should stop on non-retryable 4xx errors', async () => {
      const mockFetch = jest.fn().mockResolvedValue({ ok: false, status: 400 });
      global.fetch = mockFetch as any;

      const result = await service.deliverWithRetry(
        'https://example.com/webhook',
        { event: 'test' },
      );

      expect(result.success).toBe(false);
      expect(result.attempts).toBe(1);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should retry on 500 errors up to max retries', async () => {
      const mockFetch = jest.fn().mockResolvedValue({ ok: false, status: 500 });
      global.fetch = mockFetch as any;

      const result = await service.deliverWithRetry(
        'https://example.com/webhook',
        { event: 'test' },
      );

      expect(result.success).toBe(false);
      expect(result.attempts).toBe(3);
      expect(mockFetch).toHaveBeenCalledTimes(3);
    }, 15000);

    it('should retry on network errors', async () => {
      const mockFetch = jest
        .fn()
        .mockRejectedValueOnce(new Error('ECONNREFUSED'))
        .mockResolvedValueOnce({ ok: true, status: 200 });
      global.fetch = mockFetch as any;

      const result = await service.deliverWithRetry(
        'https://example.com/webhook',
        { event: 'test' },
      );

      expect(result.success).toBe(true);
      expect(result.attempts).toBe(2);
    }, 10000);

    it('should retry on 429 Too Many Requests', async () => {
      const mockFetch = jest
        .fn()
        .mockResolvedValueOnce({ ok: false, status: 429 })
        .mockResolvedValueOnce({ ok: true, status: 200 });
      global.fetch = mockFetch as any;

      const result = await service.deliverWithRetry(
        'https://example.com/webhook',
        { event: 'test' },
      );

      expect(result.success).toBe(true);
      expect(result.attempts).toBe(2);
    }, 10000);
  });

  describe('dispatchEnterpriseMetricEvent', () => {
    it('should return true on successful delivery', async () => {
      global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 200 }) as any;

      const result = await service.dispatchEnterpriseMetricEvent(
        'https://example.com/webhook',
        { event: 'VELOCITY_CHANGE', enterpriseId: 'ent-001' },
      );

      expect(result).toBe(true);
    });

    it('should return false on failed delivery', async () => {
      global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 400 }) as any;

      const result = await service.dispatchEnterpriseMetricEvent(
        'https://example.com/webhook',
        { event: 'VELOCITY_CHANGE' },
      );

      expect(result).toBe(false);
    });
  });
});
