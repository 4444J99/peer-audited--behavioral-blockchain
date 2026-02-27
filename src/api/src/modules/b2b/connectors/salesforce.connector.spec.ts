import { SalesforceConnector } from './salesforce.connector';
import { EmployeeEvent } from './crm-connector.interface';

describe('SalesforceConnector', () => {
  let connector: SalesforceConnector;
  const originalEnv = process.env;
  let mockFetch: jest.Mock;

  const testEvent: EmployeeEvent = {
    employeeId: 'emp-001',
    eventType: 'contract_completed',
    timestamp: new Date('2026-02-27T10:00:00Z'),
    metadata: { integrityDelta: 5 },
  };

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      SALESFORCE_BASE_URL: 'https://sf.example.com',
      SALESFORCE_CLIENT_ID: 'test-client-id',
      SALESFORCE_CLIENT_SECRET: 'test-client-secret',
    };
    connector = new SalesforceConnector();
    mockFetch = jest.fn();
    global.fetch = mockFetch;
    jest.clearAllMocks();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('pushEmployeeEvent', () => {
    it('should authenticate and push event as Styx_Event__c', async () => {
      // Auth response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ access_token: 'sf_token_abc' }),
      });
      // Push response
      mockFetch.mockResolvedValueOnce({ ok: true });

      await connector.pushEmployeeEvent(testEvent);
      expect(mockFetch).toHaveBeenCalledTimes(2);

      // Verify auth call
      const [authUrl, authOpts] = mockFetch.mock.calls[0];
      expect(authUrl).toBe('https://sf.example.com/services/oauth2/token');
      expect(authOpts.method).toBe('POST');

      // Verify push call
      const [pushUrl, pushOpts] = mockFetch.mock.calls[1];
      expect(pushUrl).toContain('Styx_Event__c');
      expect(pushOpts.headers.Authorization).toBe('Bearer sf_token_abc');
      const body = JSON.parse(pushOpts.body);
      expect(body.Employee_Id__c).toBe('emp-001');
      expect(body.Event_Type__c).toBe('contract_completed');
    });

    it('should throw when Salesforce is not configured (no base URL)', async () => {
      process.env.SALESFORCE_BASE_URL = '';
      const unconfigured = new SalesforceConnector();

      await expect(unconfigured.pushEmployeeEvent(testEvent)).rejects.toThrow('Salesforce not configured');
    });

    it('should throw on auth failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, status: 401 });

      await expect(connector.pushEmployeeEvent(testEvent)).rejects.toThrow('Salesforce auth failed: 401');
    });

    it('should throw on push failure', async () => {
      mockFetch
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ access_token: 'tok' }) })
        .mockResolvedValueOnce({ ok: false, status: 500 });

      await expect(connector.pushEmployeeEvent(testEvent)).rejects.toThrow('Salesforce push failed: 500');
    });

    it('should cache access token across calls', async () => {
      mockFetch
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ access_token: 'cached_tok' }) })
        .mockResolvedValueOnce({ ok: true }) // first push
        .mockResolvedValueOnce({ ok: true }); // second push

      await connector.pushEmployeeEvent(testEvent);
      await connector.pushEmployeeEvent(testEvent);

      // Auth should only be called once (first call), second push reuses cached token
      const authCalls = mockFetch.mock.calls.filter(
        (c: any) => typeof c[0] === 'string' && c[0].includes('oauth2/token'),
      );
      expect(authCalls).toHaveLength(1);
    });
  });

  describe('syncUserList', () => {
    it('should authenticate and query contacts', async () => {
      mockFetch
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ access_token: 'tok' }) })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            records: [
              { Id: 'sf-001', Email: 'alice@acme.com', Name: 'Alice Smith' },
              { Id: 'sf-002', Email: 'bob@acme.com', Name: 'Bob Jones' },
            ],
          }),
        });

      const users = await connector.syncUserList('ent-001');
      expect(users).toHaveLength(2);
      expect(users[0]).toEqual({ externalId: 'sf-001', email: 'alice@acme.com', name: 'Alice Smith' });
    });

    it('should throw on query failure', async () => {
      mockFetch
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ access_token: 'tok' }) })
        .mockResolvedValueOnce({ ok: false, status: 403 });

      await expect(connector.syncUserList('ent-001')).rejects.toThrow('Salesforce query failed: 403');
    });

    it('should throw when not configured', async () => {
      process.env.SALESFORCE_BASE_URL = '';
      const unconfigured = new SalesforceConnector();
      await expect(unconfigured.syncUserList('ent-001')).rejects.toThrow('Salesforce not configured');
    });
  });
});
