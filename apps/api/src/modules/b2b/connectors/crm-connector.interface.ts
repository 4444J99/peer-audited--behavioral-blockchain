/**
 * CRM Connector Interface
 *
 * Defines the contract for pushing Styx employee behavioral events
 * to external CRM systems (Salesforce, HubSpot, etc.) in the B2B
 * enterprise offering.
 */

export interface EmployeeEvent {
  employeeId: string;
  eventType: 'contract_created' | 'contract_completed' | 'contract_failed' | 'integrity_change';
  timestamp: Date;
  metadata: Record<string, unknown>;
}

export interface CrmUser {
  externalId: string;
  email: string;
  name: string;
}

export interface CrmConnector {
  pushEmployeeEvent(event: EmployeeEvent): Promise<void>;
  syncUserList(enterpriseId: string): Promise<CrmUser[]>;
}
