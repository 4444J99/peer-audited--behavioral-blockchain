import { EnterpriseWebhookWorker } from './enterprise-webhook.worker';
import { EnterpriseWebhookJob } from './webhook-subscription.service';

jest.mock('bullmq', () => {
  const mockWorkerOn = jest.fn();
  const MockWorker = jest.fn(() => ({ on: mockWorkerOn }));
  return { Worker: MockWorker };
});

describe('EnterpriseWebhookWorker', () => {
  let worker: EnterpriseWebhookWorker;
  let mockWebhook: any;
  let mockSubscriptions: any;

  const job = {
    data: {
      subscriptionId: 'sub-1',
      url: 'https://hooks.example.com/styx',
      event: {
        type: 'CONTRACT_RESOLVED',
        enterpriseId: 'ent-001',
        subject: 'pseudonym-abc',
        outcome: 'COMPLETED',
        occurredAt: '2026-08-15T00:00:00.000Z',
      },
    } as EnterpriseWebhookJob,
  } as any;

  // The processor is the second argument the Worker constructor receives.
  function processor(): (job: any) => Promise<void> {
    const { Worker } = require('bullmq');
    return (Worker as jest.Mock).mock.calls[0][1];
  }

  beforeEach(() => {
    jest.clearAllMocks();
    mockWebhook = { dispatchEnterpriseMetricEvent: jest.fn() };
    mockSubscriptions = { recordDelivery: jest.fn().mockResolvedValue(undefined) };
    worker = new EnterpriseWebhookWorker(mockWebhook, mockSubscriptions);
  });

  it('initializes on the enterprise webhook queue', () => {
    worker.onModuleInit();
    const { Worker } = require('bullmq');
    expect(Worker).toHaveBeenCalledWith(
      'ENTERPRISE_WEBHOOK_QUEUE',
      expect.any(Function),
      expect.objectContaining({ concurrency: 4 }),
    );
  });

  it('delivers the signed event and records the success', async () => {
    mockWebhook.dispatchEnterpriseMetricEvent.mockResolvedValueOnce(true);
    worker.onModuleInit();

    await processor()(job);

    expect(mockWebhook.dispatchEnterpriseMetricEvent).toHaveBeenCalledWith(
      'https://hooks.example.com/styx',
      job.data.event,
    );
    expect(mockSubscriptions.recordDelivery).toHaveBeenCalledWith('sub-1', true);
  });

  it('records the miss and fails the job when the endpoint refuses', async () => {
    mockWebhook.dispatchEnterpriseMetricEvent.mockResolvedValueOnce(false);
    worker.onModuleInit();

    await expect(processor()(job)).rejects.toThrow('sub-1');
    expect(mockSubscriptions.recordDelivery).toHaveBeenCalledWith('sub-1', false);
  });

  it('records the miss when the SSRF guard rejects a rebound host', async () => {
    mockWebhook.dispatchEnterpriseMetricEvent.mockRejectedValueOnce(
      new Error('Webhook URL resolves to a loopback, private, or link-local address'),
    );
    worker.onModuleInit();

    await expect(processor()(job)).rejects.toThrow('loopback');
    expect(mockSubscriptions.recordDelivery).toHaveBeenCalledWith('sub-1', false);
  });
});
