import { BadRequestException } from '@nestjs/common';
import { AnonymizeService } from './anonymize.service';
import { WebhookService } from './webhook.service';
import { WebhookSubscriptionService } from './webhook-subscription.service';

jest.mock('bullmq');
import { Queue } from 'bullmq';
const MockQueue = Queue as jest.MockedClass<typeof Queue>;

describe('WebhookSubscriptionService', () => {
  let service: WebhookSubscriptionService;
  let mockAdd: jest.Mock;
  let mockPool: { query: jest.Mock };
  let mockWebhook: { assertDeliverableUrl: jest.Mock };
  let mockAnonymize: { hashUserId: jest.Mock };

  const row = {
    id: 'sub-1',
    enterprise_id: 'ent-001',
    url: 'https://hooks.example.com/styx',
    active: true,
    last_delivery_at: null,
    last_delivery_ok: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockAdd = jest.fn().mockResolvedValue({ id: 'job-1' });
    MockQueue.prototype.add = mockAdd;
    mockPool = { query: jest.fn().mockResolvedValue({ rows: [] }) };
    mockWebhook = { assertDeliverableUrl: jest.fn().mockResolvedValue(undefined) };
    mockAnonymize = { hashUserId: jest.fn().mockReturnValue('pseudonym-abc') };
    service = new WebhookSubscriptionService(
      mockPool as any,
      mockWebhook as unknown as WebhookService,
      mockAnonymize as unknown as AnonymizeService,
    );
  });

  describe('register', () => {
    it('should validate the URL through the SSRF guard before persisting', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [row] });

      const result = await service.register('ent-001', row.url, 'user-1');

      expect(mockWebhook.assertDeliverableUrl).toHaveBeenCalledWith(row.url);
      expect(result).toEqual({
        id: 'sub-1',
        enterpriseId: 'ent-001',
        url: row.url,
        active: true,
        lastDeliveryAt: null,
        lastDeliveryOk: null,
      });
      expect(mockPool.query.mock.calls[0][0]).toContain('INSERT INTO webhook_subscriptions');
      expect(mockPool.query.mock.calls[0][1]).toEqual(['ent-001', row.url, 'user-1']);
    });

    it('should refuse an internal address as a 400 rather than storing it', async () => {
      mockWebhook.assertDeliverableUrl.mockRejectedValueOnce(
        new Error('Webhook URL must not target loopback, private, or link-local addresses'),
      );

      await expect(
        service.register('ent-001', 'http://169.254.169.254/latest/meta-data', 'user-1'),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(mockPool.query).not.toHaveBeenCalled();
    });

    it('should reactivate an existing row instead of creating a duplicate', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [row] });

      await service.register('ent-001', row.url, 'user-2');

      const sql = mockPool.query.mock.calls[0][0];
      expect(sql).toContain('ON CONFLICT (enterprise_id, url) DO UPDATE');
      expect(sql).toContain('SET active = TRUE');
    });
  });

  describe('enqueueContractResolved', () => {
    it('should enqueue one job per active subscription', async () => {
      mockPool.query.mockResolvedValueOnce({
        rows: [row, { ...row, id: 'sub-2', url: 'https://hooks.example.com/second' }],
      });

      const count = await service.enqueueContractResolved({
        enterpriseId: 'ent-001',
        userId: 'user-9',
        outcome: 'COMPLETED',
        occurredAt: '2026-08-15T00:00:00.000Z',
      });

      expect(count).toBe(2);
      expect(mockAdd).toHaveBeenCalledTimes(2);
      expect(mockAdd.mock.calls[0][0]).toBe('enterprise-webhook');
      expect(mockAdd.mock.calls[0][1]).toEqual({
        subscriptionId: 'sub-1',
        url: row.url,
        event: {
          type: 'CONTRACT_RESOLVED',
          enterpriseId: 'ent-001',
          subject: 'pseudonym-abc',
          outcome: 'COMPLETED',
          occurredAt: '2026-08-15T00:00:00.000Z',
        },
      });
    });

    it('should send the salted pseudonym, never the raw user id', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [row] });

      await service.enqueueContractResolved({
        enterpriseId: 'ent-001',
        userId: 'user-9',
        outcome: 'FAILED',
        occurredAt: '2026-08-15T00:00:00.000Z',
      });

      expect(mockAnonymize.hashUserId).toHaveBeenCalledWith('user-9', 'ent-001');
      expect(JSON.stringify(mockAdd.mock.calls[0][1])).not.toContain('user-9');
    });

    it('should not touch the queue when the enterprise has no subscriptions', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] });

      const count = await service.enqueueContractResolved({
        enterpriseId: 'ent-001',
        userId: 'user-9',
        outcome: 'COMPLETED',
        occurredAt: '2026-08-15T00:00:00.000Z',
      });

      expect(count).toBe(0);
      expect(mockAdd).not.toHaveBeenCalled();
    });

    it('should only read active subscriptions', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] });

      await service.listActive('ent-001');

      expect(mockPool.query.mock.calls[0][0]).toContain('WHERE enterprise_id = $1 AND active');
    });
  });

  describe('recordDelivery', () => {
    it('should stamp the outcome of the last delivery attempt', async () => {
      await service.recordDelivery('sub-1', false);

      expect(mockPool.query.mock.calls[0][0]).toContain('UPDATE webhook_subscriptions');
      expect(mockPool.query.mock.calls[0][1]).toEqual(['sub-1', false]);
    });
  });
});
