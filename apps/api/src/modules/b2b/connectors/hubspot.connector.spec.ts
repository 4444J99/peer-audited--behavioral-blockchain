import { HubSpotConnector } from './hubspot.connector';
import { EmployeeEvent } from './crm-connector.interface';

describe('HubSpotConnector', () => {
  let connector: HubSpotConnector;
  const originalEnv = process.env;
  let mockFetch: jest.Mock;

  const testEvent: EmployeeEvent = {
    employeeId: 'emp-001',
    eventType: 'contract_completed',
    timestamp: new Date('2026-02-27T10:00:00Z'),
    metadata: { integrityDelta: 5 },
  };

  beforeEach(() => {
    process.env = { ...originalEnv, HUBSPOT_API_KEY: 'test-hs-key' };
    connector = new HubSpotConnector();
    mockFetch = jest.fn();
    global.fetch = mockFetch;
    jest.clearAllMocks();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  // ─── pushEmployeeEvent ───

  describe('pushEmployeeEvent', () => {
    it('should throw when HubSpot is not configured (no API key)', async () => {
      process.env.HUBSPOT_API_KEY = '';
      const unconfigured = new HubSpotConnector();
      await expect(unconfigured.pushEmployeeEvent(testEvent)).rejects.toThrow('HubSpot not configured');
    });

    it('should search for contact and create a note', async () => {
      // Contact search response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ total: 1, results: [{ id: 'hs-contact-1' }] }),
      });
      // Note creation response
      mockFetch.mockResolvedValueOnce({ ok: true });

      await connector.pushEmployeeEvent(testEvent);
      expect(mockFetch).toHaveBeenCalledTimes(2);

      // Verify search call
      const [searchUrl, searchOpts] = mockFetch.mock.calls[0];
      expect(searchUrl).toContain('contacts/search');
      const searchBody = JSON.parse(searchOpts.body);
      expect(searchBody.filterGroups[0].filters[0].value).toBe('emp-001');

      // Verify note creation
      const [noteUrl, noteOpts] = mockFetch.mock.calls[1];
      expect(noteUrl).toContain('notes');
      const noteBody = JSON.parse(noteOpts.body);
      expect(noteBody.properties.hs_note_body).toContain('contract_completed');
      expect(noteBody.associations[0].to.id).toBe('hs-contact-1');
    });

    it('should skip note creation when contact not found', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ total: 0, results: [] }),
      });

      await connector.pushEmployeeEvent(testEvent);
      expect(mockFetch).toHaveBeenCalledTimes(1); // Only search, no note
    });

    it('should throw on search failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, status: 403 });
      await expect(connector.pushEmployeeEvent(testEvent)).rejects.toThrow('HubSpot search failed: 403');
    });

    it('should throw on note creation failure', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ total: 1, results: [{ id: 'hs-1' }] }),
        })
        .mockResolvedValueOnce({ ok: false, status: 500 });

      await expect(connector.pushEmployeeEvent(testEvent)).rejects.toThrow('HubSpot note creation failed: 500');
    });

    it('should use Bearer auth with API key', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ total: 0, results: [] }),
      });

      await connector.pushEmployeeEvent(testEvent);
      const [, opts] = mockFetch.mock.calls[0];
      expect(opts.headers.Authorization).toBe('Bearer test-hs-key');
    });
  });

  // ─── syncUserList ───

  describe('syncUserList', () => {
    it('should throw when HubSpot is not configured', async () => {
      process.env.HUBSPOT_API_KEY = '';
      const unconfigured = new HubSpotConnector();
      await expect(unconfigured.syncUserList('ent-001')).rejects.toThrow('HubSpot not configured');
    });

    it('should search contacts by enterprise ID and return mapped users', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          results: [
            {
              id: 'hs-1',
              properties: {
                styx_employee_id: 'emp-001',
                email: 'alice@acme.com',
                firstname: 'Alice',
                lastname: 'Smith',
              },
            },
            {
              id: 'hs-2',
              properties: {
                styx_employee_id: null,
                email: 'bob@acme.com',
                firstname: 'Bob',
                lastname: '',
              },
            },
          ],
        }),
      });

      const users = await connector.syncUserList('ent-001');
      expect(users).toHaveLength(2);
      expect(users[0]).toEqual({ externalId: 'emp-001', email: 'alice@acme.com', name: 'Alice Smith' });
      // Falls back to HubSpot ID when styx_employee_id is null
      expect(users[1].externalId).toBe('hs-2');
      expect(users[1].name).toBe('Bob');
    });

    it('should filter by styx_enterprise_id', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ results: [] }),
      });

      await connector.syncUserList('ent-042');
      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.filterGroups[0].filters[0].propertyName).toBe('styx_enterprise_id');
      expect(body.filterGroups[0].filters[0].value).toBe('ent-042');
    });

    it('should request correct properties', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ results: [] }),
      });

      await connector.syncUserList('ent-001');
      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.properties).toEqual(['email', 'firstname', 'lastname', 'styx_employee_id']);
    });

    it('should throw on sync failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, status: 429 });
      await expect(connector.syncUserList('ent-001')).rejects.toThrow('HubSpot sync failed: 429');
    });
  });
});
