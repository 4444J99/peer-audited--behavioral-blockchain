import { Pool } from 'pg';
import { B2BController } from './b2b.controller';
import { BillingService } from './billing.service';
import { WebhookService } from './webhook.service';
import { MetricsService } from './metrics.service';
import { AnonymizeService } from './anonymize.service';
import { DataLakeService } from './datalake.service';
import { CrmService } from './crm.service';

describe('B2BController', () => {
  let controller: B2BController;

  // Caller is an ADMIN belonging to the enterprise they request, so the
  // tenant-membership check passes for these happy-path tests.
  const adminUser = { id: 'admin-1' };
  const mockPool = {
    query: jest.fn().mockResolvedValue({
      rows: [{ enterprise_id: 'ent-001', role: 'ADMIN' }],
    }),
  } as unknown as Pool;

  const mockBilling = {
    recordConsumptionEvent: jest.fn(),
  } as unknown as BillingService;

  const mockWebhook = {
    dispatchEnterpriseMetricEvent: jest.fn(),
  } as unknown as WebhookService;

  const mockMetrics = {
    getEnterpriseMetrics: jest.fn(),
  } as unknown as MetricsService;

  const mockAnonymize = {
    anonymizeEmployeeData: jest.fn().mockReturnValue({
      enterpriseId: 'ent-001',
      generatedAt: '2026-01-01T00:00:00Z',
      employeeCount: 0,
      employees: [],
      aggregate: { avgIntegrityScore: 0, avgCompletionRate: 0, totalContracts: 0, completedContracts: 0 },
    }),
  } as unknown as AnonymizeService;

  const mockDataLake = {
    extractSnapshot: jest.fn().mockResolvedValue({
      extractedAt: '2026-01-01T00:00:00Z',
      enterpriseId: 'ent-001',
      period: { start: '2026-01-01', end: '2026-02-01' },
      contractMetrics: [],
      behavioralTrends: [],
      cohortAnalysis: [],
    }),
  } as unknown as DataLakeService;

  const mockCrm = {
    calculateCorporateIntegrityScore: jest.fn().mockResolvedValue({
      averageIntegrity: 70,
      activeContracts: 2,
      behavioralVelocity: 2,
    }),
    pushEmployeeEvent: jest.fn().mockResolvedValue(undefined),
    logInteraction: jest.fn().mockResolvedValue(undefined),
    syncUser: jest.fn().mockResolvedValue(undefined),
  } as unknown as CrmService;

  beforeEach(() => {
    controller = new B2BController(
      mockPool,
      mockBilling,
      mockWebhook,
      mockMetrics,
      mockAnonymize,
      mockDataLake,
      mockCrm,
    );
    jest.clearAllMocks();
    (mockPool.query as jest.Mock).mockResolvedValue({
      rows: [{ enterprise_id: 'ent-001', role: 'ADMIN' }],
    });
  });

  describe('getMetrics', () => {
    it('should return enterprise metrics for a given enterpriseId', async () => {
      const expected = {
        enterpriseId: 'ent-001',
        totalContracts: 100,
        completedContracts: 80,
        failedContracts: 10,
        activeContracts: 10,
        completionRate: 80,
        avgIntegrityScore: 72,
        totalEmployees: 50,
      };
      (mockMetrics.getEnterpriseMetrics as jest.Mock).mockResolvedValueOnce(expected);

      const result = await controller.getMetrics(adminUser, 'ent-001');

      expect(result).toEqual(expected);
      expect(mockMetrics.getEnterpriseMetrics).toHaveBeenCalledWith('ent-001');
    });
  });

  describe('getBilling', () => {
    it('should return billing summary WITHOUT recording a consumption event', async () => {
      const result = await controller.getBilling(adminUser, 'ent-001');

      expect(result).toEqual({
        enterpriseId: 'ent-001',
        plan: 'CONSUMPTION',
        events: [],
        totalDue: 0,
        currency: 'USD',
      });
      // Read-only fetch must not bill the customer.
      expect(mockBilling.recordConsumptionEvent).not.toHaveBeenCalled();
    });
  });

  describe('registerWebhook', () => {
    it('should register a webhook URL', async () => {
      const result = await controller.registerWebhook(adminUser, {
        enterpriseId: 'ent-001',
        url: 'https://example.com/webhook',
      });

      expect(result).toEqual({
        status: 'registered',
        enterpriseId: 'ent-001',
        url: 'https://example.com/webhook',
      });
    });
  });

  describe('testWebhook', () => {
    it('should dispatch a test payload and return sent status', async () => {
      (mockWebhook.dispatchEnterpriseMetricEvent as jest.Mock).mockResolvedValueOnce(true);

      const result = await controller.testWebhook(adminUser, {
        enterpriseId: 'ent-001',
        url: 'https://example.com/hook',
      });

      expect(result).toEqual({ status: 'sent' });
      expect(mockWebhook.dispatchEnterpriseMetricEvent).toHaveBeenCalledWith(
        'https://example.com/hook',
        expect.objectContaining({ type: 'TEST' }),
      );
    });

    it('should return failed status when dispatch fails', async () => {
      (mockWebhook.dispatchEnterpriseMetricEvent as jest.Mock).mockResolvedValueOnce(false);

      const result = await controller.testWebhook(adminUser, {
        enterpriseId: 'ent-001',
        url: 'https://bad.com/hook',
      });

      expect(result).toEqual({ status: 'failed' });
    });

    it('should reject when caller is not a member/admin of the enterprise (PRV6)', async () => {
      // Caller belongs to a different enterprise -> tenant check must block before
      // any outbound dispatch happens (SSRF probing surface).
      (mockPool.query as jest.Mock).mockResolvedValueOnce({
        rows: [{ enterprise_id: 'other-ent', role: 'ADMIN' }],
      });

      await expect(
        controller.testWebhook(adminUser, {
          enterpriseId: 'ent-001',
          url: 'http://169.254.169.254/latest/meta-data',
        }),
      ).rejects.toThrow();
      expect(mockWebhook.dispatchEnterpriseMetricEvent).not.toHaveBeenCalled();
    });
  });

  describe('exportHrData', () => {
    it('should return anonymized employee data', async () => {
      (mockMetrics.getEnterpriseMetrics as jest.Mock).mockResolvedValueOnce({});

      const result = await controller.exportHrData(adminUser, 'ent-001');

      expect(result.employeeCount).toBe(0);
      expect(mockAnonymize.anonymizeEmployeeData).toHaveBeenCalledWith('ent-001', []);
    });
  });

  describe('getDataLakeSnapshot', () => {
    it('should return a data lake snapshot for the given period', async () => {
      const result = await controller.getDataLakeSnapshot(adminUser, 'ent-001', '2026-01-01', '2026-02-01');

      expect(result.enterpriseId).toBe('ent-001');
      expect(mockDataLake.extractSnapshot).toHaveBeenCalledWith('ent-001', '2026-01-01', '2026-02-01');
    });
  });

  describe('getCorporateIntegrityScore', () => {
    it('should return the aggregate integrity score for the enterprise', async () => {
      const result = await controller.getCorporateIntegrityScore(adminUser, 'ent-001');

      expect(result).toEqual({ averageIntegrity: 70, activeContracts: 2, behavioralVelocity: 2 });
      expect(mockCrm.calculateCorporateIntegrityScore).toHaveBeenCalledWith('ent-001');
    });

    it('should reject when caller is not a member/admin of the enterprise', async () => {
      (mockPool.query as jest.Mock).mockResolvedValueOnce({
        rows: [{ enterprise_id: 'other-ent', role: 'ADMIN' }],
      });

      await expect(controller.getCorporateIntegrityScore(adminUser, 'ent-001')).rejects.toThrow();
      expect(mockCrm.calculateCorporateIntegrityScore).not.toHaveBeenCalled();
    });
  });

  describe('pushCrmEvent', () => {
    it('should dispatch the event with a server-stamped timestamp', async () => {
      const result = await controller.pushCrmEvent(adminUser, 'ent-001', {
        employeeId: 'emp-1',
        eventType: 'contract_completed',
        metadata: { integrityDelta: 5 },
      });

      expect(result).toEqual({
        status: 'dispatched',
        enterpriseId: 'ent-001',
        employeeId: 'emp-1',
        eventType: 'contract_completed',
      });
      expect(mockCrm.pushEmployeeEvent).toHaveBeenCalledWith('ent-001', {
        employeeId: 'emp-1',
        eventType: 'contract_completed',
        timestamp: expect.any(Date),
        metadata: { integrityDelta: 5 },
      });
    });

    it('should reject an eventType outside the connector union', async () => {
      await expect(
        controller.pushCrmEvent(adminUser, 'ent-001', {
          employeeId: 'emp-1',
          eventType: 'employee_terminated',
        }),
      ).rejects.toThrow(/eventType must be one of/);
      expect(mockCrm.pushEmployeeEvent).not.toHaveBeenCalled();
    });

    it('should reject a missing employeeId', async () => {
      await expect(
        controller.pushCrmEvent(adminUser, 'ent-001', {
          employeeId: '',
          eventType: 'contract_created',
        }),
      ).rejects.toThrow(/employeeId is required/);
      expect(mockCrm.pushEmployeeEvent).not.toHaveBeenCalled();
    });

    it('should reject before dispatching when the caller fails the tenant check', async () => {
      (mockPool.query as jest.Mock).mockResolvedValueOnce({
        rows: [{ enterprise_id: 'other-ent', role: 'ADMIN' }],
      });

      await expect(
        controller.pushCrmEvent(adminUser, 'ent-001', {
          employeeId: 'emp-1',
          eventType: 'contract_created',
        }),
      ).rejects.toThrow();
      expect(mockCrm.pushEmployeeEvent).not.toHaveBeenCalled();
    });
  });

  describe('logCrmInteraction', () => {
    it('should log the interaction against the employee email', async () => {
      const result = await controller.logCrmInteraction(adminUser, 'ent-001', {
        email: 'employee@example.com',
        type: 'integrity_change',
        metadata: { delta: -3 },
      });

      expect(result).toEqual({
        status: 'logged',
        enterpriseId: 'ent-001',
        email: 'employee@example.com',
        type: 'integrity_change',
      });
      expect(mockCrm.logInteraction).toHaveBeenCalledWith('employee@example.com', 'integrity_change', {
        delta: -3,
      });
    });

    it('should reject a type outside the connector union', async () => {
      await expect(
        controller.logCrmInteraction(adminUser, 'ent-001', {
          email: 'employee@example.com',
          type: 'demo_booked',
        }),
      ).rejects.toThrow(/type must be one of/);
      expect(mockCrm.logInteraction).not.toHaveBeenCalled();
    });
  });

  describe('syncCrmUser', () => {
    it('should pin the CRM tenant to the verified enterprise, not the body', async () => {
      const result = await controller.syncCrmUser(adminUser, 'ent-001', {
        email: 'employee@example.com',
        firstName: 'Ada',
        lastName: 'Lovelace',
      });

      expect(result).toEqual({
        status: 'synced',
        enterpriseId: 'ent-001',
        email: 'employee@example.com',
      });
      expect(mockCrm.syncUser).toHaveBeenCalledWith({
        email: 'employee@example.com',
        firstName: 'Ada',
        lastName: 'Lovelace',
        company: 'ent-001',
      });
    });

    it('should reject a missing email', async () => {
      await expect(
        controller.syncCrmUser(adminUser, 'ent-001', { email: '' }),
      ).rejects.toThrow(/email is required/);
      expect(mockCrm.syncUser).not.toHaveBeenCalled();
    });

    it('should reject when caller is not a member/admin of the enterprise', async () => {
      (mockPool.query as jest.Mock).mockResolvedValueOnce({
        rows: [{ enterprise_id: 'other-ent', role: 'ADMIN' }],
      });

      await expect(
        controller.syncCrmUser(adminUser, 'ent-001', { email: 'employee@example.com' }),
      ).rejects.toThrow();
      expect(mockCrm.syncUser).not.toHaveBeenCalled();
    });
  });
});
