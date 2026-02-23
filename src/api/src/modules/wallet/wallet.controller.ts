import { Controller, Get, Query, UseGuards, NotFoundException } from '@nestjs/common';
import { Pool } from 'pg';
import { AuthGuard } from '../../../guards/auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { getAllowedTiers } from '../../../../shared/libs/integrity';

@Controller('wallet')
@UseGuards(AuthGuard)
export class WalletController {
  constructor(private readonly pool: Pool) {}

  @Get('balance')
  async getBalance(@CurrentUser() user: { id: string }) {
    const userResult = await this.pool.query(
      'SELECT id, email, integrity_score, account_id, status FROM users WHERE id = $1',
      [user.id],
    );
    if (userResult.rows.length === 0) {
      throw new NotFoundException(`User ${user.id} not found`);
    }

    const row = userResult.rows[0];
    const tiers = getAllowedTiers(row.integrity_score);

    // Calculate net balance from ledger entries
    let balance = 0;
    if (row.account_id) {
      const creditResult = await this.pool.query(
        `SELECT COALESCE(SUM(amount), 0) AS total FROM entries WHERE credit_account_id = $1`,
        [row.account_id],
      );
      const debitResult = await this.pool.query(
        `SELECT COALESCE(SUM(amount), 0) AS total FROM entries WHERE debit_account_id = $1`,
        [row.account_id],
      );
      balance = Number(creditResult.rows[0].total) - Number(debitResult.rows[0].total);
    }

    return {
      userId: row.id,
      email: row.email,
      integrityScore: row.integrity_score,
      allowedTiers: tiers,
      ledgerBalance: balance,
      status: row.status,
    };
  }

  @Get('history')
  async getHistory(@CurrentUser() user: { id: string }, @Query('limit') limit?: string) {
    const userResult = await this.pool.query(
      'SELECT account_id FROM users WHERE id = $1',
      [user.id],
    );
    if (userResult.rows.length === 0) {
      throw new NotFoundException(`User ${user.id} not found`);
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
