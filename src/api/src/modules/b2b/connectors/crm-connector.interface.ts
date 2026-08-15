/**
 * CRM Connector Interface
 *
 * Defines the contract for pushing Styx employee behavioral events
 * to external CRM systems (Salesforce, HubSpot, etc.) in the B2B
 * enterprise offering.
 */

/**
 * The event types an external CRM is willing to receive. Exported as a runtime
 * array (not just a union) because the values arrive over HTTP, where the type
 * system cannot help: a controller must be able to reject an unknown eventType
 * before it is pushed to a customer's Salesforce/HubSpot org.
 */
export const EMPLOYEE_EVENT_TYPES = [
  'contract_created',
  'contract_completed',
  'contract_failed',
  'integrity_change',
] as const;

export type EmployeeEventType = (typeof EMPLOYEE_EVENT_TYPES)[number];

export interface EmployeeEvent {
  employeeId: string;
  eventType: EmployeeEventType;
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
