import { CrmService } from './crm.service';
import { SalesforceConnector } from './connectors/salesforce.connector';
import { HubSpotConnector } from './connectors/hubspot.connector';
import { EmployeeEvent } from './connectors/crm-connector.interface';

describe('CrmService', () => {
  let service: CrmService;
  let mockSalesforce: jest.Mocked<Pick<SalesforceConnector, 'pushEmployeeEvent'>>;
  let mockHubspot: jest.Mocked<Pick<HubSpotConnector, 'pushEmployeeEvent'>>;

  const testEvent: EmployeeEvent = {
    employeeId: 'emp-001',
    eventType: 'contract_completed',
    timestamp: new Date('2026-02-27T10:00:00Z'),
    metadata: { integrityDelta: 5 },
  };

  beforeEach(() => {
    mockSalesforce = { pushEmployeeEvent: jest.fn() };
    mockHubspot = { pushEmployeeEvent: jest.fn() };
    service = new CrmService(
      mockSalesforce as unknown as SalesforceConnector,
      mockHubspot as unknown as HubSpotConnector,
    );
    jest.clearAllMocks();
  });

  describe('pushEmployeeEvent', () => {
    it('should push event to both Salesforce and HubSpot', async () => {
      mockSalesforce.pushEmployeeEvent.mockResolvedValue(undefined);
      mockHubspot.pushEmployeeEvent.mockResolvedValue(undefined);

      await service.pushEmployeeEvent('ent-001', testEvent);
      expect(mockSalesforce.pushEmployeeEvent).toHaveBeenCalledWith(testEvent);
      expect(mockHubspot.pushEmployeeEvent).toHaveBeenCalledWith(testEvent);
    });

    it('should not throw when Salesforce is not configured', async () => {
      mockSalesforce.pushEmployeeEvent.mockRejectedValue(new Error('Salesforce not configured'));
      mockHubspot.pushEmployeeEvent.mockResolvedValue(undefined);

      await expect(service.pushEmployeeEvent('ent-001', testEvent)).resolves.not.toThrow();
      expect(mockHubspot.pushEmployeeEvent).toHaveBeenCalled();
    });

    it('should not throw when HubSpot is not configured', async () => {
      mockSalesforce.pushEmployeeEvent.mockResolvedValue(undefined);
      mockHubspot.pushEmployeeEvent.mockRejectedValue(new Error('HubSpot not configured'));

      await expect(service.pushEmployeeEvent('ent-001', testEvent)).resolves.not.toThrow();
      expect(mockSalesforce.pushEmployeeEvent).toHaveBeenCalled();
    });

    it('should not throw when both connectors fail', async () => {
      mockSalesforce.pushEmployeeEvent.mockRejectedValue(new Error('Salesforce not configured'));
      mockHubspot.pushEmployeeEvent.mockRejectedValue(new Error('HubSpot not configured'));

      await expect(service.pushEmployeeEvent('ent-001', testEvent)).resolves.not.toThrow();
    });

    it('should silently swallow "not configured" errors without logging as error', async () => {
      mockSalesforce.pushEmployeeEvent.mockRejectedValue(new Error('Salesforce not configured'));
      mockHubspot.pushEmployeeEvent.mockRejectedValue(new Error('HubSpot not configured'));

      // Should complete without throwing
      await service.pushEmployeeEvent('ent-001', testEvent);
    });

    it('should handle non-config errors gracefully', async () => {
      mockSalesforce.pushEmployeeEvent.mockRejectedValue(new Error('Salesforce push failed: 500'));
      mockHubspot.pushEmployeeEvent.mockResolvedValue(undefined);

      await expect(service.pushEmployeeEvent('ent-001', testEvent)).resolves.not.toThrow();
    });

    it('should still call HubSpot even when Salesforce throws unexpected error', async () => {
      mockSalesforce.pushEmployeeEvent.mockRejectedValue(new Error('network timeout'));
      mockHubspot.pushEmployeeEvent.mockResolvedValue(undefined);

      await service.pushEmployeeEvent('ent-001', testEvent);
      expect(mockHubspot.pushEmployeeEvent).toHaveBeenCalled();
    });
  });
});
