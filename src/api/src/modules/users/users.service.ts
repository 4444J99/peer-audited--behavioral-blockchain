import { Injectable, NotFoundException, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { Pool } from 'pg';
import * as bcrypt from 'bcryptjs';
import { getDisplayTier } from '../../../../shared/libs/integrity';

const BCRYPT_ROUNDS = 10;

@Injectable()
export class UsersService {
  constructor(private readonly pool: Pool) {}

  async getProfile(userId: string) {
    const result = await this.pool.query(
      `SELECT id, email, integrity_score, role, status, created_at,
              kyc_status, age_verification_status, identity_provider,
              identity_verification_id, identity_verified_at,
              terms_accepted_at, terms_version
       FROM users WHERE id = $1`,
      [userId],
    );
    if (result.rows.length === 0) {
      throw new NotFoundException(`User ${userId} not found`);
    }

    const row = result.rows[0];

    // Fetch active contract stats
    const statsResult = await this.pool.query(
      `SELECT COUNT(*) as count, COALESCE(SUM(stake_amount), 0) as total 
       FROM contracts 
       WHERE user_id = $1 AND status = 'ACTIVE'`,
      [userId],
    );
    const contractCount = parseInt(statsResult.rows[0].count, 10);
    const totalStaked = parseFloat(statsResult.rows[0].total);

    return {
      id: row.id,
      email: row.email,
      integrity_score: row.integrity_score,
      tier: getDisplayTier(row.integrity_score),
      contract_count: contractCount,
      total_staked: totalStaked,
      role: row.role,
      status: row.status,
      created_at: row.created_at,
      compliance: {
        kyc_status: row.kyc_status ?? 'NOT_STARTED',
        age_verification_status: row.age_verification_status ?? 'NOT_STARTED',
        identity_provider: row.identity_provider ?? null,
        identity_verification_id: row.identity_verification_id ?? null,
        identity_verified_at: row.identity_verified_at ?? null,
        is_kyc_verified: String(row.kyc_status || '').toUpperCase() === 'VERIFIED',
        is_age_verified: ['VERIFIED', 'SELF_DECLARED'].includes(String(row.age_verification_status || '').toUpperCase()),
        terms_accepted_at: row.terms_accepted_at ?? null,
        terms_version: row.terms_version ?? null,
      },
    };
  }

  async getUserHistory(userId: string, limit = 50) {
    const result = await this.pool.query(
      `SELECT event_type, payload, created_at FROM truth_log
       WHERE payload->>'userId' = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [userId, limit],
    );
    return result.rows;
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) { // allow-secret
    if (!currentPassword || !newPassword) {
      throw new BadRequestException('Current and new passwords are required');
    }
    if (newPassword.length < 8) {
      throw new BadRequestException('New password must be at least 8 characters');
    }

    const result = await this.pool.query(
      'SELECT id, password_hash FROM users WHERE id = $1',
      [userId],
    );
    if (result.rows.length === 0) {
      throw new NotFoundException(`User ${userId} not found`);
    }

    const user = result.rows[0];

    if (!user.password_hash) {
      throw new BadRequestException('Account does not have a password set');
    }

    const valid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!valid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const newHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    await this.pool.query(
      'UPDATE users SET password_hash = $1 WHERE id = $2',
      [newHash, userId],
    );

    return { status: 'password_updated' };
  }

  async updateSettings(
    userId: string,
    settings: { emailNotifications?: boolean; pushNotifications?: boolean },
  ) {
    // Store notification preferences as JSONB metadata on the user
    // For now, we use the existing table — in production this would be a separate user_settings table
    const result = await this.pool.query(
      'SELECT id FROM users WHERE id = $1',
      [userId],
    );
    if (result.rows.length === 0) {
      throw new NotFoundException(`User ${userId} not found`);
    }

    // Log the settings change in the event log for auditability
    const payload = {
      userId,
      emailNotifications: settings.emailNotifications ?? true,
      pushNotifications: settings.pushNotifications ?? true,
    };

    // Use a lightweight approach: store in event_log as a settings event
    await this.pool.query(
      `INSERT INTO event_log (event_type, payload, previous_hash, current_hash)
       VALUES ('SETTINGS_UPDATED', $1, 'n/a', 'n/a')`,
      [JSON.stringify(payload)],
    );

    return { status: 'settings_updated' };
  }

  async requestDeletion(userId: string) {
    const result = await this.pool.query(
      'SELECT id, status FROM users WHERE id = $1',
      [userId],
    );
    if (result.rows.length === 0) {
      throw new NotFoundException(`User ${userId} not found`);
    }

    // Mark user for deletion — actual anonymization handled by scheduled GDPR job
    await this.pool.query(
      "UPDATE users SET status = 'PENDING_DELETION', deletion_requested_at = NOW() WHERE id = $1",
      [userId],
    );

    // Log the deletion request
    await this.pool.query(
      `INSERT INTO event_log (event_type, payload, previous_hash, current_hash)
       VALUES ('ACCOUNT_DELETION_REQUESTED', $1, 'n/a', 'n/a')`,
      [JSON.stringify({ userId })],
    );

    return { status: 'deletion_requested' };
  }

  async getPublicProfile(userId: string) {
    const result = await this.pool.query(
      'SELECT id, integrity_score, created_at FROM users WHERE id = $1',
      [userId],
    );
    if (result.rows.length === 0) {
      throw new NotFoundException(`User ${userId} not found`);
    }
    return result.rows[0];
  }

  async getLeaderboard(limit: number = 10, period?: string) {
    const maxLimit = Math.min(limit, 100);

    let intervalFilter = '';
    if (period === 'weekly') {
      intervalFilter = `AND id IN (
        SELECT DISTINCT user_id FROM contracts
        WHERE created_at >= NOW() - INTERVAL '7 days'
        UNION
        SELECT DISTINCT c.user_id FROM attestations a
        JOIN contracts c ON c.id = a.contract_id
        WHERE a.attestation_date >= CURRENT_DATE - 7
      )`;
    } else if (period === 'monthly') {
      intervalFilter = `AND id IN (
        SELECT DISTINCT user_id FROM contracts
        WHERE created_at >= NOW() - INTERVAL '30 days'
        UNION
        SELECT DISTINCT c.user_id FROM attestations a
        JOIN contracts c ON c.id = a.contract_id
        WHERE a.attestation_date >= CURRENT_DATE - 30
      )`;
    }

    const result = await this.pool.query(
      `SELECT id, email, integrity_score, created_at
       FROM users WHERE status = 'ACTIVE' ${intervalFilter}
       ORDER BY integrity_score DESC
       LIMIT $1`,
      [maxLimit],
    );
    return result.rows;
  }

  async setSelfExclusion(userId: string, durationDays: number) {
    if (durationDays < 1 || durationDays > 365) {
      throw new BadRequestException('Duration must be between 1 and 365 days');
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + durationDays);

    await this.pool.query(
      'UPDATE users SET self_exclusion_expires_at = $1 WHERE id = $2',
      [expiresAt.toISOString(), userId],
    );

    // Log to audit log
    await this.pool.query(
      `INSERT INTO event_log (event_type, payload, previous_hash, current_hash)
       VALUES ('SELF_EXCLUSION_ACTIVATED', $1, 'n/a', 'n/a')`,
      [JSON.stringify({ userId, durationDays, expiresAt: expiresAt.toISOString() })],
    );

    return { status: 'self_exclusion_activated', expiresAt };
  }
}
