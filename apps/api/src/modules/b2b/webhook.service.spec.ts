import { WebhookService } from './webhook.service';

describe('WebhookService', () => {
  let service: WebhookService;
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.useFakeTimers();
    service = new WebhookService();
    // PRV7: assertSafeWebhookUrl now resolves the hostname via DNS. Stub the
    // resolution seam so unit tests stay offline/deterministic; default to a public
    // IP so the SSRF guard passes for normal delivery tests.
    jest
      .spyOn(service as any, 'resolveHost')
      .mockResolvedValue([{ address: '93.184.216.34' }]);
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.useRealTimers();
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
    // verify() now rejects deliveries whose signed timestamp is outside the
    // allowed skew window (replay guard), so use a current timestamp.
    const currentTimestamp = () => Math.floor(Date.now() / 1000).toString();

    it('should verify a valid signature', () => {
      const timestamp = currentTimestamp();
      const body = '{"event":"test"}';
      const sig = service.sign(timestamp, body);
      expect(service.verify(timestamp, body, sig)).toBe(true);
    });

    it('should reject a tampered payload', () => {
      const timestamp = currentTimestamp();
      const sig = service.sign(timestamp, '{"event":"original"}');
      expect(service.verify(timestamp, '{"event":"tampered"}', sig)).toBe(false);
    });

    it('should reject an invalid signature', () => {
      expect(service.verify(currentTimestamp(), '{}', 'invalid-signature')).toBe(false);
    });

    it('should reject a stale (replayed) timestamp outside the skew window', () => {
      // A signature that is otherwise valid but signed long ago must be rejected.
      const staleTimestamp = (Math.floor(Date.now() / 1000) - 10 * 60).toString();
      const body = '{"event":"test"}';
      const sig = service.sign(staleTimestamp, body);
      expect(service.verify(staleTimestamp, body, sig)).toBe(false);
    });
  });

  describe('delivery with retry', () => {
    it('should succeed on first attempt with 200 response', async () => {
      const sendSpy = jest
        .spyOn(service as any, 'sendWebhook')
        .mockResolvedValue({ ok: true, status: 200 });

      const result = await service.deliverWithRetry(
        'https://example.com/webhook',
        { event: 'CONTRACT_COMPLETED' },
      );

      expect(result.success).toBe(true);
      expect(result.attempts).toBe(1);
      expect(result.statusCode).toBe(200);
      expect(sendSpy).toHaveBeenCalledTimes(1);

      // Verify HMAC headers were sent (2nd arg = send options).
      const opts = sendSpy.mock.calls[0][1] as any;
      expect(opts.headers['X-Styx-Signature']).toMatch(/^[0-9a-f]{64}$/);
      expect(opts.headers['X-Styx-Timestamp']).toBeTruthy();
    });

    it('should stop on non-retryable 4xx errors', async () => {
      const sendSpy = jest
        .spyOn(service as any, 'sendWebhook')
        .mockResolvedValue({ ok: false, status: 400 });

      const result = await service.deliverWithRetry(
        'https://example.com/webhook',
        { event: 'test' },
      );

      expect(result.success).toBe(false);
      expect(result.attempts).toBe(1);
      expect(sendSpy).toHaveBeenCalledTimes(1);
    });

    it('should retry on 500 errors up to max retries', async () => {
      const sendSpy = jest
        .spyOn(service as any, 'sendWebhook')
        .mockResolvedValue({ ok: false, status: 500 });

      const promise = service.deliverWithRetry(
        'https://example.com/webhook',
        { event: 'test' },
      );

      await jest.advanceTimersByTimeAsync(5000);
      const result = await promise;

      expect(result.success).toBe(false);
      expect(result.attempts).toBe(3);
      expect(sendSpy).toHaveBeenCalledTimes(3);
    });

    it('should retry on network errors', async () => {
      const sendSpy = jest
        .spyOn(service as any, 'sendWebhook')
        .mockRejectedValueOnce(new Error('ECONNREFUSED'))
        .mockResolvedValueOnce({ ok: true, status: 200 });

      const promise = service.deliverWithRetry(
        'https://example.com/webhook',
        { event: 'test' },
      );

      await jest.advanceTimersByTimeAsync(2000);
      const result = await promise;

      expect(result.success).toBe(true);
      expect(result.attempts).toBe(2);
      expect(sendSpy).toHaveBeenCalledTimes(2);
    });

    it('should retry on 429 Too Many Requests', async () => {
      jest
        .spyOn(service as any, 'sendWebhook')
        .mockResolvedValueOnce({ ok: false, status: 429 })
        .mockResolvedValueOnce({ ok: true, status: 200 });

      const promise = service.deliverWithRetry(
        'https://example.com/webhook',
        { event: 'test' },
      );

      await jest.advanceTimersByTimeAsync(2000);
      const result = await promise;

      expect(result.success).toBe(true);
      expect(result.attempts).toBe(2);
    });
  });

  describe('SSRF guard (assertSafeWebhookUrl via deliverWithRetry)', () => {
    let sendSpy: jest.SpyInstance;
    beforeEach(() => {
      // No network send should ever be reached for a blocked URL.
      sendSpy = jest
        .spyOn(service as any, 'sendWebhook')
        .mockResolvedValue({ ok: true, status: 200 });
    });

    it('should reject non-http(s) protocols', async () => {
      await expect(
        service.deliverWithRetry('file:///etc/passwd', { event: 'x' }),
      ).rejects.toThrow(/protocol/i);
      expect(sendSpy).not.toHaveBeenCalled();
    });

    it('should reject literal loopback / private / link-local IPs', async () => {
      for (const url of [
        'http://127.0.0.1/x',
        'http://10.0.0.5/x',
        'http://192.168.1.1/x',
        'http://169.254.169.254/latest/meta-data',
        'http://172.16.0.1/x',
      ]) {
        await expect(service.deliverWithRetry(url, { event: 'x' })).rejects.toThrow();
      }
      expect(sendSpy).not.toHaveBeenCalled();
    });

    it('should reject obfuscated / non-dotted IPv4 (decimal, octal, hex)', async () => {
      for (const url of [
        'http://2130706433/x', // decimal 127.0.0.1
        'http://0x7f000001/x', // hex 127.0.0.1
        'http://0177.0.0.1/x', // octal loopback
      ]) {
        await expect(service.deliverWithRetry(url, { event: 'x' })).rejects.toThrow();
      }
      expect(sendSpy).not.toHaveBeenCalled();
    });

    it('should reject IPv4-mapped IPv6 loopback', async () => {
      await expect(
        service.deliverWithRetry('http://[::ffff:127.0.0.1]/x', { event: 'x' }),
      ).rejects.toThrow();
      expect(sendSpy).not.toHaveBeenCalled();
    });

    it('should reject when DNS resolves a public name to a private IP (rebinding)', async () => {
      jest
        .spyOn(service as any, 'resolveHost')
        .mockResolvedValue([{ address: '10.1.2.3' }]);
      await expect(
        service.deliverWithRetry('https://rebind.example.com/hook', { event: 'x' }),
      ).rejects.toThrow(/loopback|private|link-local/i);
      expect(sendSpy).not.toHaveBeenCalled();
    });

    it('should allow a public name and pin the connection to the validated IP', async () => {
      await expect(
        service.deliverWithRetry('https://example.com/hook', { event: 'x' }),
      ).resolves.toMatchObject({ success: true });
      expect(sendSpy).toHaveBeenCalledTimes(1);
      // The socket is pinned to the validated resolved IP (defeats DNS rebinding).
      const opts = sendSpy.mock.calls[0][1] as any;
      expect(opts.pinnedAddress).toBe('93.184.216.34');
    });
  });

  describe('dispatchEnterpriseMetricEvent', () => {
    it('should return true on successful delivery', async () => {
      jest
        .spyOn(service as any, 'sendWebhook')
        .mockResolvedValue({ ok: true, status: 200 });

      const result = await service.dispatchEnterpriseMetricEvent(
        'https://example.com/webhook',
        { event: 'VELOCITY_CHANGE', enterpriseId: 'ent-001' },
      );

      expect(result).toBe(true);
    });

    it('should return false on failed delivery', async () => {
      jest
        .spyOn(service as any, 'sendWebhook')
        .mockResolvedValue({ ok: false, status: 400 });

      const result = await service.dispatchEnterpriseMetricEvent(
        'https://example.com/webhook',
        { event: 'VELOCITY_CHANGE' },
      );

      expect(result).toBe(false);
    });
  });
});
