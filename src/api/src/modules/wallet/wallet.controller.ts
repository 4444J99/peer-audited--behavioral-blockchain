import { Controller, Get, Query, UseGuards, NotFoundException } from '@nestjs/common';
import { Pool } from 'pg';
import { AuthGuard } from '../../../guards/auth.guard';
import { getAllowedTiers } from '../../../../shared/libs/integrity';

@Controller('wallet')
@UseGuards(AuthGuard)
export class WalletController {
  constructor(private readonly pool: Pool) {}

  @Get('balance')
  async getBalance(@Query('userId') userId: string) {
    const userResult = await this.pool.query(
      'SELECT id, email, integrity_score, account_id, status FROM users WHERE id = $1',
      [userId],
    );
    if (userResult.rows.length === 0) {
      throw new NotFoundException(`User ${userId} not found`);
    }

    const user = userResult.rows[0];
    const tiers = getAllowedTiers(user.integrity_score);

    // Calculate net balance from ledger entries
    let balance = 0;
    if (user.account_id) {
      const creditResult = await this.pool.query(
        `SELECT COALESCE(SUM(amount), 0) AS total FROM entries WHERE credit_account_id = $1`,
        [user.account_id],
      );
      const debitResult = await this.pool.query(
        `SELECT COALESCE(SUM(amount), 0) AS total FROM entries WHERE debit_account_id = $1`,
        [user.account_id],
      );
      balance = Number(creditResult.rows[0].total) - Number(debitResult.rows[0].total);
    }

    return {
      userId: user.id,
      email: user.email,
      integrityScore: user.integrity_score,
      allowedTiers: tiers,
      ledgerBalance: balance,
      status: user.status,
    };
  }

  @Get('history')
  async getHistory(@Query('userId') userId: string, @Query('limit') limit?: string) {
    const userResult = await this.pool.query(
      'SELECT account_id FROM users WHERE id = $1',
      [userId],
    );
    if (userResult.rows.length === 0) {
      throw new NotFoundException(`User ${userId} not found`);
    }

    const accountId = userResult.rows[0].account_id;
    if (!accountId) {
      return { transactions: [] };
    }

    const maxRows = Math.min(parseInt(limit || '50', 10), 100);
    const result = await this.pool.query(
      `SELECT e.id, e.debit_account_id, e.credit_account_id, e.amount, e.contract_id, e.metadata, e.created_at,
              da.name AS debit_account_name, ca.name AS credit_account_name
       FROM entries e
       LEFT JOIN accounts da ON e.debit_account_id = da.id
       LEFT JOIN accounts ca ON e.credit_account_id = ca.id
       WHERE e.debit_account_id = $1 OR e.credit_account_id = $1
       ORDER BY e.created_at DESC
       LIMIT $2`,
      [accountId, maxRows],
    );

    return { transactions: result.rows };
  }
}
