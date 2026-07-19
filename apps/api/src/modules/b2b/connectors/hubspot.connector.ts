import { Injectable } from '@nestjs/common';
import { CrmConnector, EmployeeEvent, CrmUser } from './crm-connector.interface';

/**
 * HubSpot CRM connector for B2B enterprise integrations.
 * Pushes Styx behavioral events as contact notes and syncs employee lists.
 */
@Injectable()
export class HubSpotConnector implements CrmConnector {
  private readonly apiKey: string;
  private readonly baseUrl = 'https://api.hubapi.com';

  constructor() {
    this.apiKey = process.env.HUBSPOT_API_KEY || '';
  }

  async pushEmployeeEvent(event: EmployeeEvent): Promise<void> {
    if (!this.apiKey) throw new Error('HubSpot not configured');

    // Find the contact by Styx employee ID
    const res = await fetch(`${this.baseUrl}/crm/v3/objects/contacts/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        filterGroups: [{
          filters: [{ propertyName: 'styx_employee_id', operator: 'EQ', value: event.employeeId }],
        }],
      }),
    });

    if (!res.ok) throw new Error(`HubSpot search failed: ${res.status}`);
    const data = await res.json();
    if (data.total === 0) return;

    const contactId = data.results[0].id;

    // Create a note associated with the contact
    const noteRes = await fetch(`${this.baseUrl}/crm/v3/objects/notes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        properties: {
          hs_note_body: `Styx Event: ${event.eventType} at ${event.timestamp.toISOString()}`,
          hs_timestamp: event.timestamp.getTime(),
        },
        associations: [{
          to: { id: contactId },
          types: [{ associationCategory: 'HUBSPOT_DEFINED', associationTypeId: 202 }],
        }],
      }),
    });
    if (!noteRes.ok) throw new Error(`HubSpot note creation failed: ${noteRes.status}`);
  }

  async syncUserList(enterpriseId: string): Promise<CrmUser[]> {
    if (!this.apiKey) throw new Error('HubSpot not configured');

    const res = await fetch(`${this.baseUrl}/crm/v3/objects/contacts/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        filterGroups: [{
          filters: [{ propertyName: 'styx_enterprise_id', operator: 'EQ', value: enterpriseId }],
        }],
        properties: ['email', 'firstname', 'lastname', 'styx_employee_id'],
      }),
    });

    if (!res.ok) throw new Error(`HubSpot sync failed: ${res.status}`);
    const data = await res.json();
    return data.results.map((r: any) => ({
      externalId: r.properties.styx_employee_id || r.id,
      email: r.properties.email,
      name: `${r.properties.firstname || ''} ${r.properties.lastname || ''}`.trim(),
    }));
  }
}
