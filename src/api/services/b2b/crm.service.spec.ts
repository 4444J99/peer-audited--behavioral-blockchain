import { CrmService } from './crm.service';
import { Pool } from 'pg';
import { SalesforceConnector } from '../../src/modules/b2b/connectors/salesforce.connector';
import { HubSpotConnector } from '../../src/modules/b2b/connectors/hubspot.connector';

describe('CrmService (domain)', () => {
  let mockSalesforce: jest.Mocked<Pick<SalesforceConnector, 'pushEmployeeEvent' | 'syncUserList'>>;
  let mockHubspot: jest.Mocked<Pick<HubSpotConnector, 'pushEmployeeEvent' | 'syncUserList'>>;

  const originalEnv = process.env;

  beforeEach(() => {
    mockSalesforce = {
      pushEmployeeEvent: jest.fn().mockResolvedValue(undefined),
      syncUserList: jest.fn().mockResolvedValue([
        { externalId: 'sf-1', email: 'alice@acme.com', name: 'Alice' },
      ]),
    };
    mockHubspot = {
      pushEmployeeEvent: jest.fn().mockResolvedValue(undefined),
      syncUserList: jest.fn().mockResolvedValue([
        { externalId: 'hs-1', email: 'bob@acme.com', name: 'Bob' },
      ]),
    };
    process.env = { ...originalEnv };
    jest.clearAllMocks();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  function createService(): CrmService {
    return new CrmService(
      { query: jest.fn().mockResolvedValue({ rows: [] }) } as unknown as Pool,
      mockSalesforce as unknown as SalesforceConnector,
      mockHubspot as unknown as HubSpotConnector,
    );
  }

  describe('connector selection', () => {
    it('should use Salesforce when SALESFORCE_BASE_URL is set', async () => {
      process.env.SALESFORCE_BASE_URL = 'https://sf.example.com';
      const service = createService();

      await service.logInteraction('alice@acme.com', 'contract_completed', { score: 5 });

      expect(mockSalesforce.pushEmployeeEvent).toHaveBeenCalled();
      expect(mockHubspot.pushEmployeeEvent).not.toHaveBeenCalled();
    });

    it('should use HubSpot when only HUBSPOT_API_KEY is set', async () => {
      delete process.env.SALESFORCE_BASE_URL;
      process.env.HUBSPOT_API_KEY = 'test-key'; // allow-secret
      const service = createService();

      await service.logInteraction('bob@acme.com', 'contract_created', {});

      expect(mockHubspot.pushEmployeeEvent).toHaveBeenCalled();
      expect(mockSalesforce.pushEmployeeEvent).not.toHaveBeenCalled();
    });

    it('should prefer Salesforce when both are configured', async () => {
      process.env.SALESFORCE_BASE_URL = 'https://sf.example.com';
      process.env.HUBSPOT_API_KEY = 'test-key'; // allow-secret
      const service = createService();

      await service.logInteraction('alice@acme.com', 'contract_completed', {});

      expect(mockSalesforce.pushEmployeeEvent).toHaveBeenCalled();
      expect(mockHubspot.pushEmployeeEvent).not.toHaveBeenCalled();
    });
  });

  describe('syncUser', () => {
    it('should delegate to connector syncUserList', async () => {
      process.env.SALESFORCE_BASE_URL = 'https://sf.example.com';
      const service = createService();

      await service.syncUser({ email: 'alice@acme.com', company: 'acme-corp' });

      expect(mockSalesforce.syncUserList).toHaveBeenCalledWith('acme-corp');
    });

    it('should use "default" enterprise ID when company not provided', async () => {
      process.env.SALESFORCE_BASE_URL = 'https://sf.example.com';
      const service = createService();

      await service.syncUser({ email: 'alice@acme.com' });

      expect(mockSalesforce.syncUserList).toHaveBeenCalledWith('default');
    });

    it('should skip sync when no connector is configured', async () => {
      delete process.env.SALESFORCE_BASE_URL;
      delete process.env.HUBSPOT_API_KEY;
      const service = createService();

      await service.syncUser({ email: 'alice@acme.com' });

      expect(mockSalesforce.syncUserList).not.toHaveBeenCalled();
      expect(mockHubspot.syncUserList).not.toHaveBeenCalled();
    });
  });

  describe('logInteraction', () => {
    it('should push employee event to the configured connector', async () => {
      process.env.SALESFORCE_BASE_URL = 'https://sf.example.com';
      const service = createService();

      await service.logInteraction('emp@acme.com', 'contract_completed', { delta: 5 });

      expect(mockSalesforce.pushEmployeeEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          employeeId: 'emp@acme.com',
          eventType: 'contract_completed',
          metadata: { delta: 5 },
        }),
      );
    });

    it('should not throw when connector push fails', async () => {
      process.env.SALESFORCE_BASE_URL = 'https://sf.example.com';
      mockSalesforce.pushEmployeeEvent.mockRejectedValue(new Error('network error'));
      const service = createService();

      await expect(
        service.logInteraction('emp@acme.com', 'contract_completed', {}),
      ).resolves.not.toThrow();
    });

    it('should skip push when no connector configured', async () => {
      delete process.env.SALESFORCE_BASE_URL;
      delete process.env.HUBSPOT_API_KEY;
      const service = createService();

      await service.logInteraction('emp@acme.com', 'contract_completed', {});

      expect(mockSalesforce.pushEmployeeEvent).not.toHaveBeenCalled();
      expect(mockHubspot.pushEmployeeEvent).not.toHaveBeenCalled();
    });
  });
});
