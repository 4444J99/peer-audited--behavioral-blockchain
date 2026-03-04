import { SettlementService, SettlementJob } from './settlement.service';
import { SETTLEMENT_QUEUE_NAME } from '../../../config/queue.config';

// Mock bullmq so no real Redis connection is made
jest.mock('bullmq');

import { Queue } from 'bullmq';

const MockQueue = Queue as jest.MockedClass<typeof Queue>;

describe('SettlementService', () => {
  let service: SettlementService;
  let mockAdd: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockAdd = jest.fn().mockResolvedValue({ id: 'job-1' });
    MockQueue.prototype.add = mockAdd;
    service = new SettlementService();
  });

  // ─── Queue construction ───────────────────────────────────────────

  it('should construct a Queue with SETTLEMENT_QUEUE_NAME', () => {
    expect(MockQueue).toHaveBeenCalledWith(
      SETTLEMENT_QUEUE_NAME,
      expect.any(Object),
    );
  });

  // ─── dispatchSettlement: job name ─────────────────────────────────

  it('should add a job to the queue with name "settle"', async () => {
    const job: SettlementJob = {
      contractId: 'contract-abc',
      outcome: 'PASS',
      paymentIntentId: 'pi_test_001',
      amountCents: 5000,
    };

    await service.dispatchSettlement(job);

    expect(mockAdd).toHaveBeenCalledTimes(1);
    const [jobName] = mockAdd.mock.calls[0];
    expect(jobName).toBe('settle');
  });

  // ─── dispatchSettlement: job options ─────────────────────────────

  it('should add job with attempts: 10 and exponential backoff', async () => {
    const job: SettlementJob = {
      contractId: 'contract-retry',
      outcome: 'FAIL',
      paymentIntentId: 'pi_test_002',
      amountCents: 10000,
    };

    await service.dispatchSettlement(job);

    const [, , opts] = mockAdd.mock.calls[0];
    expect(opts).toMatchObject({
      attempts: 10,
      backoff: { type: 'exponential', delay: 10000 },
    });
  });

  it('should include removeOnComplete: true in job options', async () => {
    const job: SettlementJob = {
      contractId: 'contract-cleanup',
      outcome: 'PASS',
      paymentIntentId: 'pi_test_003',
      amountCents: 2500,
    };

    await service.dispatchSettlement(job);

    const [, , opts] = mockAdd.mock.calls[0];
    expect(opts.removeOnComplete).toBe(true);
  });

  // ─── dispatchSettlement: idempotent jobId ─────────────────────────

  it('should set idempotent jobId as settlement_{contractId}_{outcome}', async () => {
    const job: SettlementJob = {
      contractId: 'contract-idem',
      outcome: 'PASS',
      paymentIntentId: 'pi_test_004',
      amountCents: 7500,
    };

    await service.dispatchSettlement(job);

    const [, , opts] = mockAdd.mock.calls[0];
    expect(opts.jobId).toBe('settlement_contract-idem_PASS');
  });

  it('should produce different jobIds for PASS and FAIL outcomes on the same contract', async () => {
    const base = {
      contractId: 'contract-both',
      paymentIntentId: 'pi_test_005',
      amountCents: 3000,
    };

    await service.dispatchSettlement({ ...base, outcome: 'PASS' });
    await service.dispatchSettlement({ ...base, outcome: 'FAIL' });

    const [, , optsPass] = mockAdd.mock.calls[0];
    const [, , optsFail] = mockAdd.mock.calls[1];
    expect(optsPass.jobId).toBe('settlement_contract-both_PASS');
    expect(optsFail.jobId).toBe('settlement_contract-both_FAIL');
  });

  // ─── dispatchSettlement: PASS outcome ────────────────────────────

  it('should dispatch correctly for PASS outcome', async () => {
    const job: SettlementJob = {
      contractId: 'contract-pass',
      outcome: 'PASS',
      paymentIntentId: 'pi_pass_001',
      amountCents: 20000,
    };

    await service.dispatchSettlement(job);

    const [, jobData] = mockAdd.mock.calls[0];
    expect(jobData).toMatchObject({
      contractId: 'contract-pass',
      outcome: 'PASS',
      paymentIntentId: 'pi_pass_001',
      amountCents: 20000,
    });
  });

  // ─── dispatchSettlement: FAIL outcome ────────────────────────────

  it('should dispatch correctly for FAIL outcome', async () => {
    const job: SettlementJob = {
      contractId: 'contract-fail',
      outcome: 'FAIL',
      paymentIntentId: 'pi_fail_001',
      amountCents: 15000,
    };

    await service.dispatchSettlement(job);

    const [, jobData] = mockAdd.mock.calls[0];
    expect(jobData).toMatchObject({
      contractId: 'contract-fail',
      outcome: 'FAIL',
      paymentIntentId: 'pi_fail_001',
      amountCents: 15000,
    });
  });

  // ─── dispatchSettlement: optional furies array ───────────────────

  it('should include furies array in job data when provided', async () => {
    const job: SettlementJob = {
      contractId: 'contract-fury',
      outcome: 'FAIL',
      paymentIntentId: 'pi_fury_001',
      amountCents: 8000,
      furies: ['fury-user-1', 'fury-user-2', 'fury-user-3'],
    };

    await service.dispatchSettlement(job);

    const [, jobData] = mockAdd.mock.calls[0];
    expect(jobData.furies).toEqual(['fury-user-1', 'fury-user-2', 'fury-user-3']);
  });

  it('should dispatch without furies when the field is omitted', async () => {
    const job: SettlementJob = {
      contractId: 'contract-nofury',
      outcome: 'PASS',
      paymentIntentId: 'pi_nofury_001',
      amountCents: 5000,
    };

    await service.dispatchSettlement(job);

    const [, jobData] = mockAdd.mock.calls[0];
    expect(jobData.furies).toBeUndefined();
  });

  // ─── dispatchSettlement: queue.add return is awaited ─────────────

  it('should resolve without throwing when queue.add succeeds', async () => {
    const job: SettlementJob = {
      contractId: 'contract-ok',
      outcome: 'PASS',
      paymentIntentId: 'pi_ok_001',
      amountCents: 1000,
    };

    await expect(service.dispatchSettlement(job)).resolves.toBeUndefined();
  });
});
