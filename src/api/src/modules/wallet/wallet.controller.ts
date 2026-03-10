import { Controller, Get, Query, UseGuards, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Pool } from 'pg';
import { AuthGuard } from '../../../guards/auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { getAllowedTiers } from '../../../../shared/libs/integrity';
import { LedgerService } from '../../../services/ledger/ledger.service';

@ApiTags('Wallet')
@ApiBearerAuth()
@Controller('wallet')
@UseGuards(AuthGuard)
export class WalletController {
  constructor(
    private readonly pool: Pool,
    private readonly ledger: LedgerService,
  ) {}

  @Get('balance')
  @ApiOperation({ summary: 'Get ledger balance and integrity tier for the current user' })
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

    // Calculate net balance from ledger service (uses canonical sign convention)
    let balance = 0;
    if (row.account_id) {
      balance = await this.ledger.getAccountBalance(row.account_id);
    }

    return {
      id: row.id,
      email: row.email,
      integrity_score: row.integrity_score,
      allowed_tiers: tiers,
      ledger_balance: balance / 100, // convert cents to dollars
      status: row.status,
    };
  }

  @Get('history')
  @ApiOperation({ summary: 'Get transaction history from the double-entry ledger' })
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
      `SELECT e.id, e.amount, e.metadata, e.created_at
       FROM entries e
       WHERE e.debit_account_id = $1 OR e.credit_account_id = $1
       ORDER BY e.created_at DESC
       LIMIT $2`,
      [accountId, maxRows],
    );

    const transactions = result.rows.map(row => ({
      id: row.id,
      type: row.metadata?.type || 'TRANSACTION',
      amount: parseFloat(row.amount) / 100, // convert cents to dollars
      timestamp: row.created_at,
      description: row.metadata?.description || row.metadata?.type || 'Ledger entry',
    }));

    return { transactions };
  }
}
