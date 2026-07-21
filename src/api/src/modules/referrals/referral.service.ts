import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { Pool } from 'pg';
import { randomBytes } from 'crypto';
import { LedgerService } from '../../../services/ledger/ledger.service';
import { REFERRAL_REWARD_AMOUNT, MAX_MONTHLY_REFERRALS } from '../../../../shared/libs/behavioral-logic';

@Injectable()
export class ReferralService {
  private readonly logger = new Logger(ReferralService.name);

  constructor(
    private readonly pool: Pool,
    private readonly ledger: LedgerService,
  ) {}

  private generateCode(): string {
    return randomBytes(6).toString('base64url').slice(0, 8).toUpperCase();
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
}
