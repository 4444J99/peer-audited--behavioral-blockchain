import { Injectable, Logger } from '@nestjs/common';
import { Pool } from 'pg';
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
      `SELECT 
        AVG(integrity_score) as avg_integrity,
        COUNT(c.id) as active_contracts,
        (SELECT COUNT(*) FROM event_log WHERE event_type = 'CONTRACT_RESOLVED' AND created_at > NOW() - interval '30 days') as velocity
       FROM users u
       LEFT JOIN contracts c ON u.id = c.user_id AND c.status = 'ACTIVE'
       WHERE u.enterprise_id = $1
       GROUP BY u.enterprise_id`,
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
