import { Injectable, Logger } from '@nestjs/common';
import { SalesforceConnector } from './connectors/salesforce.connector';
import { HubSpotConnector } from './connectors/hubspot.connector';
import { EmployeeEvent } from './connectors/crm-connector.interface';

@Injectable()
export class CrmService {
  private readonly logger = new Logger(CrmService.name);

  constructor(
    private readonly salesforce: SalesforceConnector,
    private readonly hubspot: HubSpotConnector,
  ) {}

  async pushEmployeeEvent(enterpriseId: string, event: EmployeeEvent): Promise<void> {
    this.logger.log(`Dispatching event ${event.eventType} for employee ${event.employeeId} in enterprise ${enterpriseId}`);

    // In a full implementation, the enterprise configuration would dictate the destination
    // For now, we attempt to push to both configured systems
    try {
      await this.salesforce.pushEmployeeEvent(event);
    } catch (error: any) {
      if (!error.message.includes('Salesforce not configured')) {
        this.logger.error(`Salesforce push failed: ${error.message}`);
      }
    }

    try {
      await this.hubspot.pushEmployeeEvent(event);
    } catch (error: any) {
      if (!error.message.includes('HubSpot not configured')) {
        this.logger.error(`HubSpot push failed: ${error.message}`);
      }
    }
  }
}
