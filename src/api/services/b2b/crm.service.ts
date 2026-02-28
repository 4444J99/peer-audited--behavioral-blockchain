import { Injectable, Logger } from '@nestjs/common';
import { CrmConnector, EmployeeEvent } from '../../src/modules/b2b/connectors/crm-connector.interface';
import { SalesforceConnector } from '../../src/modules/b2b/connectors/salesforce.connector';
import { HubSpotConnector } from '../../src/modules/b2b/connectors/hubspot.connector';

export interface CrmUser {
  email: string;
  firstName?: string;
  lastName?: string;
  company?: string;
}

@Injectable()
export class CrmService {
  private readonly logger = new Logger(CrmService.name);
  private readonly connector: CrmConnector | null;

  constructor(
    private readonly salesforce: SalesforceConnector,
    private readonly hubspot: HubSpotConnector,
  ) {
    if (process.env.SALESFORCE_BASE_URL) {
      this.connector = this.salesforce;
      this.logger.log('[CRM] Using Salesforce connector');
    } else if (process.env.HUBSPOT_API_KEY) {
      this.connector = this.hubspot;
      this.logger.log('[CRM] Using HubSpot connector');
    } else {
      this.connector = null;
      this.logger.log('[CRM] No CRM connector configured — logging only');
    }
  }

  async syncUser(user: CrmUser): Promise<void> {
    this.logger.log(`[CRM_SYNC] Syncing user ${user.email}...`);

    if (!this.connector) {
      this.logger.log(`[CRM_SYNC] No connector configured — skipping sync for ${user.email}`);
      return;
    }

    const enterpriseId = user.company || 'default';
    const users = await this.connector.syncUserList(enterpriseId);
    this.logger.log(`[CRM_SYNC] Synced ${users.length} users for enterprise ${enterpriseId}`);
  }

  async logInteraction(email: string, type: string, metadata: Record<string, any>): Promise<void> {
    this.logger.log(`[CRM_INTERACTION] ${email} - ${type}: ${JSON.stringify(metadata)}`);

    if (!this.connector) {
      return;
    }

    const event: EmployeeEvent = {
      employeeId: email,
      eventType: type as EmployeeEvent['eventType'],
      timestamp: new Date(),
      metadata,
    };

    try {
      await this.connector.pushEmployeeEvent(event);
    } catch (error: any) {
      this.logger.error(`[CRM_INTERACTION] Push failed: ${error.message}`);
    }
  }
}
