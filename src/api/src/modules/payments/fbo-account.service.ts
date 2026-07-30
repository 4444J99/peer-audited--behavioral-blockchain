import { Injectable, Inject, Logger } from '@nestjs/common';
import { Pool } from 'pg';

export interface FboAccount {
  id: string;
  platformAccountId: string;
  platformName: string;
  jurisdiction: string;
  isActive: boolean;
  createdAt: Date;
}

@Injectable()
export class FboAccountService {
  private readonly logger = new Logger(FboAccountService.name);

  constructor(@Inject('DATABASE_POOL') private pool: Pool) {}

  async registerConnectedAccount(params: {
    platformAccountId: string;
    platformName: string;
    jurisdiction: string;
    isActive: boolean;
  }): Promise<FboAccount> {
    const result = await this.pool.query(
      `INSERT INTO fbo_accounts (platform_account_id, platform_name, jurisdiction, is_active)
       VALUES ($1, $2, $3, $4)
       RETURNING id, platform_account_id, platform_name, jurisdiction, is_active, created_at`,
      [params.platformAccountId, params.platformName, params.jurisdiction, params.isActive],
    );

    const row = result.rows[0];
    this.logger.log(`Registered FBO account ${row.platform_account_id} for ${row.jurisdiction}`);

    return {
      id: row.id,
      platformAccountId: row.platform_account_id,
      platformName: row.platform_name,
      jurisdiction: row.jurisdiction,
      isActive: row.is_active,
      createdAt: row.created_at,
    };
  }

  async getActiveAccount(jurisdiction: string): Promise<FboAccount | null> {
    const result = await this.pool.query(
      `SELECT id, platform_account_id, platform_name, jurisdiction, is_active, created_at
       FROM fbo_accounts
       WHERE jurisdiction = $1 AND is_active = TRUE
       LIMIT 1`,
      [jurisdiction],
    );

    if (result.rows.length === 0) return null;

    const row = result.rows[0];
    return {
      id: row.id,
      platformAccountId: row.platform_account_id,
      platformName: row.platform_name,
      jurisdiction: row.jurisdiction,
      isActive: row.is_active,
      createdAt: row.created_at,
    };
  }

  async getAllAccounts(): Promise<FboAccount[]> {
    const result = await this.pool.query(
      `SELECT id, platform_account_id, platform_name, jurisdiction, is_active, created_at
       FROM fbo_accounts
       ORDER BY created_at DESC`,
    );

    return result.rows.map((row) => ({
      id: row.id,
      platformAccountId: row.platform_account_id,
      platformName: row.platform_name,
      jurisdiction: row.jurisdiction,
      isActive: row.is_active,
      createdAt: row.created_at,
    }));
  }

  async deactivateAccount(platformAccountId: string): Promise<void> {
    const result = await this.pool.query(
      `UPDATE fbo_accounts
       SET is_active = FALSE, deactivated_at = NOW()
       WHERE platform_account_id = $1`,
      [platformAccountId],
    );

    if (result.rowCount === 0) {
      this.logger.warn(`FBO account ${platformAccountId} not found for deactivation`);
    } else {
      this.logger.log(`Deactivated FBO account ${platformAccountId}`);
    }
  }

  async getAccountForContract(contractId: string): Promise<FboAccount | null> {
    // Contracts carry no jurisdiction column; the canonical source is the
    // owner's geofence-maintained users.last_known_state (same source the
    // settlement path feeds into CompliancePolicyService).
    //
    // The two sides store different formats: geofencing persists bare state
    // codes ('CA'), while FBO accounts are registered per ISO-3166-2
    // subdivision ('US-CA'). Both are normalized to the subdivision code before
    // comparison so jurisdiction-specific custody routing is not bypassed.
    //
    // The normalization must not be written as a bare SPLIT_PART(x, '-', 2):
    // that returns '' for any value without a delimiter, so 'US' and 'CA' both
    // collapse to '' and compare equal — which made the country-level fallback
    // account match every state, and would let a 'CA' (Canada) jurisdiction
    // match a Texas resident. COALESCE(NULLIF(...), x) keeps undelimited values
    // as themselves, so 'US' stays 'US' and only ever matches via the explicit
    // getActiveAccount('US') fallback below.
    const result = await this.pool.query(
      `SELECT fa.id, fa.platform_account_id, fa.platform_name, fa.jurisdiction, fa.is_active, fa.created_at
       FROM contracts c
       JOIN users u ON u.id = c.user_id
       JOIN fbo_accounts fa
         ON UPPER(COALESCE(NULLIF(SPLIT_PART(fa.jurisdiction, '-', 2), ''), fa.jurisdiction))
          = UPPER(COALESCE(NULLIF(SPLIT_PART(u.last_known_state, '-', 2), ''), u.last_known_state))
       WHERE c.id = $1 AND fa.is_active = TRUE
       ORDER BY fa.created_at ASC
       LIMIT 1`,
      [contractId],
    );

    if (result.rows.length > 0) {
      const row = result.rows[0];
      return {
        id: row.id,
        platformAccountId: row.platform_account_id,
        platformName: row.platform_name,
        jurisdiction: row.jurisdiction,
        isActive: row.is_active,
        createdAt: row.created_at,
      };
    }

    return this.getActiveAccount('US');
  }
}
