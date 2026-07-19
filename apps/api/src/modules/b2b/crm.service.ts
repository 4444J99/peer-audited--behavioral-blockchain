import { Injectable, Logger } from '@nestjs/common';
import { Pool } from 'pg';
import { SalesforceConnector } from './connectors/salesforce.connector';
import { HubSpotConnector } from './connectors/hubspot.connector';
import { CrmConnector, EmployeeEvent } from './connectors/crm-connector.interface';

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
    private readonly pool: Pool,
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

  /**
   * F-B2B-04: Corporate Integrity Score
   * Aggregates anonymized integrity metrics for a specific enterprise.
   * Returns average integrity, total active contracts, and behavioral velocity.
   */
  async calculateCorporateIntegrityScore(enterpriseId: string): Promise<{
    averageIntegrity: number;
    activeContracts: number;
    behavioralVelocity: number;
  }> {
    const stats = await this.pool.query(
      `WITH active_enterprise_users AS (
         SELECT id, integrity_score
         FROM users
         WHERE enterprise_id = $1
           AND status = 'ACTIVE'
       ),
       user_stats AS (
         SELECT AVG(integrity_score) AS avg_integrity
         FROM active_enterprise_users
       ),
       contract_stats AS (
         SELECT COUNT(c.id) AS active_contracts
         FROM contracts c
         INNER JOIN active_enterprise_users u ON u.id = c.user_id
         WHERE c.status = 'ACTIVE'
       ),
       velocity_stats AS (
         SELECT COUNT(*) AS velocity
         FROM event_log e
         WHERE e.event_type = 'CONTRACT_RESOLVED'
           AND e.created_at > NOW() - interval '30 days'
           AND (
             e.payload->>'userId' IN (SELECT id::text FROM active_enterprise_users)
             OR e.payload->>'contractId' IN (
               SELECT c.id::text
               FROM contracts c
               INNER JOIN active_enterprise_users u ON u.id = c.user_id
             )
           )
       )
       SELECT user_stats.avg_integrity, contract_stats.active_contracts, velocity_stats.velocity
       FROM user_stats
       CROSS JOIN contract_stats
       CROSS JOIN velocity_stats`,
      [enterpriseId]
    );

    if (stats.rows.length === 0) {
      return { averageIntegrity: 0, activeContracts: 0, behavioralVelocity: 0 };
    }

    const row = stats.rows[0];
    return {
      averageIntegrity: parseFloat(row.avg_integrity) || 0,
      activeContracts: parseInt(row.active_contracts) || 0,
      behavioralVelocity: parseInt(row.velocity) || 0,
    };
  }
}
