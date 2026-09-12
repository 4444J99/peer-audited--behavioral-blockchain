import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { Pool } from 'pg';
import { randomBytes } from 'crypto';
import { LedgerService } from '../../../services/ledger/ledger.service';
import { REFERRAL_REWARD_AMOUNT, MAX_MONTHLY_REFERRALS } from '../../../../shared/libs/behavioral-logic';

export const BETA_MAX_COHORT_INVITES = 2;

export interface CohortNomination {
  id: string;
  nominatorId: string;
  nomineeEmail: string;
  nomineeName: string | null;
  note: string | null;
  inviteCode: string;
  status: 'PENDING' | 'ACCEPTED' | 'EXPIRED';
  acceptedUserId: string | null;
  createdAt: Date;
  acceptedAt: Date | null;
}

export interface CohortInviteQuota {
  totalAllowed: number;
  invitesSent: number;
  remainingInvites: number;
  nominations: Array<{
    id: string;
    nomineeEmail: string;
    nomineeName: string | null;
    inviteCode: string;
    inviteUrl: string;
    status: string;
    createdAt: string;
  }>;
}

@Injectable()
export class ReferralService {
  private readonly logger = new Logger(ReferralService.name);

  constructor(
    private readonly pool: Pool,
    private readonly ledger: LedgerService,
  ) {}

  private generateCode(): string {
    return randomBytes(4).toString('hex').toUpperCase();
  }

  async getOrCreateCode(userId: string): Promise<string> {
    const existing = await this.pool.query(
      `SELECT referral_code FROM users WHERE id = $1`,
      [userId],
    );
    if (existing.rows.length === 0) {
      throw new NotFoundException('User not found');
    }
    if (existing.rows[0].referral_code) {
      return existing.rows[0].referral_code;
    }

    let code: string;
    let attempts = 0;
    do {
      code = this.generateCode();
      const clash = await this.pool.query(
        `SELECT id FROM users WHERE referral_code = $1`,
        [code],
      );
      if (clash.rows.length === 0) break;
      attempts++;
    } while (attempts < 5);

    await this.pool.query(
      `UPDATE users SET referral_code = $1 WHERE id = $2`,
      [code, userId],
    );

    return code;
  }

  async getCode(userId: string): Promise<{ code: string; url: string }> {
    const code = await this.getOrCreateCode(userId);
    const baseUrl = process.env.STYX_REFERRAL_BASE_URL || 'https://styx.app/join';
    return { code, url: `${baseUrl}/${code}` };
  }

  async attributeReferral(referralCode: string, newUserId: string): Promise<void> {
    const referrer = await this.pool.query(
      `SELECT id FROM users WHERE referral_code = $1`,
      [referralCode],
    );
    if (referrer.rows.length === 0) return;

    const referrerId = referrer.rows[0].id;
    if (referrerId === newUserId) return;

    await this.pool.query(
      `UPDATE users SET referred_by = $1 WHERE id = $2 AND referred_by IS NULL`,
      [referrerId, newUserId],
    );

    await this.pool.query(
      `INSERT INTO referrals (referrer_id, referred_user_id, referral_code, status, reward_amount_cents)
       VALUES ($1, $2, $3, 'PENDING', $4)
       ON CONFLICT (referred_user_id) DO NOTHING`,
      [referrerId, newUserId, referralCode, REFERRAL_REWARD_AMOUNT],
    );

    this.logger.log(`Attributed referral: user ${newUserId} referred by ${referrerId}`);
  }

  async rewardOnFirstContract(referredUserId: string, contractId: string): Promise<void> {
    const referral = await this.pool.query(
      `SELECT id, referrer_id, status, reward_amount_cents
       FROM referrals
       WHERE referred_user_id = $1 AND status = 'PENDING'
       FOR UPDATE`,
      [referredUserId],
    );

    if (referral.rows.length === 0) return;

    const { id: referralId, referrer_id: referrerId, reward_amount_cents: amount } = referral.rows[0];

    const monthlyCount = await this.pool.query(
      `SELECT COUNT(*)::int AS count
       FROM referrals
       WHERE referrer_id = $1 AND status = 'REWARDED'
       AND reward_paid_at >= date_trunc('month', NOW())`,
      [referrerId],
    );

    if (monthlyCount.rows[0].count >= MAX_MONTHLY_REFERRALS) {
      this.logger.warn(`Referrer ${referrerId} hit monthly cap (${MAX_MONTHLY_REFERRALS}) — deferring reward`);
      return;
    }

    const refAccount = await this.pool.query(
      `SELECT account_id FROM users WHERE id = $1`,
      [referrerId],
    );
    if (!refAccount.rows[0]?.account_id) {
      this.logger.warn(`Referrer ${referrerId} has no account_id — cannot pay reward`);
      return;
    }

    const revenueAccount = await this.pool.query(
      `SELECT id FROM accounts WHERE name = 'SYSTEM_REVENUE' LIMIT 1`,
    );
    if (revenueAccount.rows.length === 0) {
      this.logger.error('SYSTEM_REVENUE account not found — cannot pay referral reward');
      return;
    }

    await this.ledger.recordTransaction(
      revenueAccount.rows[0].id,
      refAccount.rows[0].account_id,
      amount,
      contractId,
      { type: 'REFERRAL_REWARD', referralId },
    );

    await this.pool.query(
      `UPDATE referrals
       SET status = 'REWARDED', reward_paid_at = NOW()
       WHERE id = $1`,
      [referralId],
    );

    this.logger.log(`Referral reward paid: $${(amount / 100).toFixed(2)} to ${referrerId} for referral ${referralId}`);
  }

  async getStats(userId: string): Promise<{
    totalReferrals: number;
    rewardedReferrals: number;
    pendingReferrals: number;
    totalRewardCents: number;
    rewards: Array<{
      id: string;
      referredUserEmail: string;
      status: string;
      rewardAmountCents: number;
      rewardPaidAt: string | null;
      createdAt: string;
    }>;
  }> {
    const stats = await this.pool.query(
      `SELECT
         COUNT(*)::int AS total,
         COUNT(*) FILTER (WHERE status = 'REWARDED')::int AS rewarded,
         COUNT(*) FILTER (WHERE status = 'PENDING')::int AS pending,
         COALESCE(SUM(reward_amount_cents) FILTER (WHERE status = 'REWARDED'), 0)::int AS total_cents
       FROM referrals WHERE referrer_id = $1`,
      [userId],
    );

    const rewards = await this.pool.query(
      `SELECT r.id, u.email AS referred_user_email, r.status,
              r.reward_amount_cents, r.reward_paid_at, r.created_at
       FROM referrals r
       JOIN users u ON u.id = r.referred_user_id
       WHERE r.referrer_id = $1
       ORDER BY r.created_at DESC
       LIMIT 50`,
      [userId],
    );

    return {
      totalReferrals: stats.rows[0].total,
      rewardedReferrals: stats.rows[0].rewarded,
      pendingReferrals: stats.rows[0].pending,
      totalRewardCents: stats.rows[0].total_cents,
      rewards: rewards.rows.map((r) => ({
        id: r.id,
        referredUserEmail: r.referred_user_email,
        status: r.status,
        rewardAmountCents: r.reward_amount_cents,
        rewardPaidAt: r.reward_paid_at ? r.reward_paid_at.toISOString() : null,
        createdAt: r.created_at.toISOString(),
      })),
    };
  }

  /**
   * Retrieves the user's cohort invite quota (capped at 2 invites for curated beta growth).
   */
  async getCohortInviteQuota(userId: string): Promise<CohortInviteQuota> {
    const nominationsResult = await this.pool.query(
      `SELECT id, nominee_email, nominee_name, invite_code, status, created_at
       FROM cohort_nominations
       WHERE nominator_id = $1
       ORDER BY created_at DESC`,
      [userId],
    );

    const baseUrl = process.env.STYX_REFERRAL_BASE_URL || 'https://styx.app/cohort-invite';
    const invitesSent = nominationsResult.rows.length;
    const remainingInvites = Math.max(0, BETA_MAX_COHORT_INVITES - invitesSent);

    return {
      totalAllowed: BETA_MAX_COHORT_INVITES,
      invitesSent,
      remainingInvites,
      nominations: nominationsResult.rows.map((r) => ({
        id: r.id,
        nomineeEmail: r.nominee_email,
        nomineeName: r.nominee_name ?? null,
        inviteCode: r.invite_code,
        inviteUrl: `${baseUrl}/${r.invite_code}`,
        status: r.status,
        createdAt: r.created_at instanceof Date ? r.created_at.toISOString() : String(r.created_at),
      })),
    };
  }

  /**
   * Nominates an aligned peer for curated beta cohort admission (enforces 2-invite limit).
   */
  async nominateCohortPeer(
    userId: string,
    nomineeEmail: string,
    nomineeName?: string,
    note?: string,
  ): Promise<CohortNomination> {
    const trimmedEmail = (nomineeEmail || '').trim().toLowerCase();
    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      throw new BadRequestException('A valid nominee email is required');
    }

    // 1. Enforce quota: maximum 2 invites per user
    const existing = await this.pool.query(
      `SELECT id, nominee_email FROM cohort_nominations WHERE nominator_id = $1`,
      [userId],
    );

    if (existing.rows.length >= BETA_MAX_COHORT_INVITES) {
      throw new BadRequestException(
        `Cohort invite quota reached. Each beta member may nominate at most ${BETA_MAX_COHORT_INVITES} peers.`,
      );
    }

    if (existing.rows.some((r) => r.nominee_email.toLowerCase() === trimmedEmail)) {
      throw new BadRequestException('You have already nominated this peer.');
    }

    // 2. Generate secure cohort invite code
    const inviteCode = `COHORT-${randomBytes(4).toString('hex').toUpperCase()}`;

    // 3. Insert nomination
    const insertResult = await this.pool.query(
      `INSERT INTO cohort_nominations (
         nominator_id, nominee_email, nominee_name, note, invite_code, status
       )
       VALUES ($1, $2, $3, $4, $5, 'PENDING')
       RETURNING *`,
      [userId, trimmedEmail, nomineeName?.trim() || null, note?.trim() || null, inviteCode],
    );

    const row = insertResult.rows[0];

    // 4. Boost waitlist entry if nominee already joined waitlist
    await this.pool.query(
      `UPDATE beta_waitlist
       SET channel = 'referral',
           referral_code = $1,
           intent = COALESCE(intent, 'cohort_nomination')
       WHERE email_normalized = $2`,
      [inviteCode, trimmedEmail],
    );

    this.logger.log(
      `User ${userId} nominated peer ${trimmedEmail} for cohort admission (code=${inviteCode})`,
    );

    return {
      id: row.id,
      nominatorId: row.nominator_id,
      nomineeEmail: row.nominee_email,
      nomineeName: row.nominee_name,
      note: row.note,
      inviteCode: row.invite_code,
      status: row.status,
      acceptedUserId: row.accepted_user_id,
      createdAt: row.created_at,
      acceptedAt: row.accepted_at,
    };
  }
}
