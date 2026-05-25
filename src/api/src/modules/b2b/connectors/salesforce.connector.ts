import { Injectable } from '@nestjs/common';
import { CrmConnector, EmployeeEvent, CrmUser } from './crm-connector.interface';

/**
 * Salesforce CRM connector for B2B enterprise integrations.
 * Pushes Styx behavioral events as custom objects and syncs employee lists.
 */
@Injectable()
export class SalesforceConnector implements CrmConnector {
  private readonly baseUrl: string;
  private readonly clientId: string;
  private readonly clientSecret: string;
  private accessToken: string | null = null;

  constructor() {
    this.baseUrl = process.env.SALESFORCE_BASE_URL || '';
    this.clientId = process.env.SALESFORCE_CLIENT_ID || '';
    this.clientSecret = process.env.SALESFORCE_CLIENT_SECRET || '';
  }

  private async authenticate(): Promise<string> {
    if (this.accessToken) return this.accessToken;
    if (!this.baseUrl) throw new Error('Salesforce not configured');

    const res = await fetch(`${this.baseUrl}/services/oauth2/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: this.clientId,
        client_secret: this.clientSecret,
      }),
    });

    if (!res.ok) throw new Error(`Salesforce auth failed: ${res.status}`);
    const data = await res.json();
    this.accessToken = data.access_token;
    return this.accessToken!;
  }

  async pushEmployeeEvent(event: EmployeeEvent): Promise<void> {
    const token = await this.authenticate();
    const res = await fetch(`${this.baseUrl}/services/data/v59.0/sobjects/Styx_Event__c`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        Employee_Id__c: event.employeeId,
        Event_Type__c: event.eventType,
        Event_Timestamp__c: event.timestamp.toISOString(),
        Metadata__c: JSON.stringify(event.metadata),
      }),
    });
    if (!res.ok) throw new Error(`Salesforce push failed: ${res.status}`);
  }

  /**
   * Escape a value before embedding it in a SOQL string literal. SOQL requires
   * backslashes and single quotes to be backslash-escaped; without this an
   * enterpriseId such as `x' OR Name != '` would break out of the literal and
   * alter the query (SOQL injection).
   */
  private escapeSoqlLiteral(value: string): string {
    return value.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  }

  async syncUserList(enterpriseId: string): Promise<CrmUser[]> {
    // enterpriseId is a UUID-style identifier in our system; reject anything that
    // is not, then escape defensively before building the SOQL literal.
    if (typeof enterpriseId !== 'string' || !/^[A-Za-z0-9-]{1,64}$/.test(enterpriseId)) {
      throw new Error('Invalid enterpriseId');
    }

    const token = await this.authenticate();
    const safeEnterpriseId = this.escapeSoqlLiteral(enterpriseId);
    const query = encodeURIComponent(
      `SELECT Id, Email, Name FROM Contact WHERE Account.Styx_Enterprise_Id__c = '${safeEnterpriseId}'`,
    );
    const res = await fetch(`${this.baseUrl}/services/data/v59.0/query?q=${query}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error(`Salesforce query failed: ${res.status}`);
    const data = await res.json();
    return data.records.map((r: any) => ({
      externalId: r.Id,
      email: r.Email,
      name: r.Name,
    }));
  }
}
