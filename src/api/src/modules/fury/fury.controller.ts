import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Pool } from 'pg';
import { AuthGuard } from '../../../guards/auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { FuryWorker } from './fury.worker';
import { TruthLogService } from '../../../services/ledger/truth-log.service';
import { SubmitVerdictDto } from './dto';
import { calculateAccuracy } from '../../../../shared/libs/integrity';

@ApiTags('Fury')
@ApiBearerAuth()
@Controller('fury')
@UseGuards(AuthGuard)
export class FuryController {
  constructor(
    private readonly pool: Pool,
    private readonly furyWorker: FuryWorker,
    private readonly truthLog: TruthLogService,
  ) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get audit statistics for the current Fury reviewer' })
  async getStats(@CurrentUser() user: { id: string }) {
    // Audit statistics
    const auditStats = await this.pool.query(
      `SELECT
         COUNT(*) FILTER (WHERE fa.verdict IS NOT NULL) as total_audits,
         COUNT(*) FILTER (WHERE (fa.verdict = 'PASS' AND p.status = 'VERIFIED')
                             OR (fa.verdict = 'FAIL' AND p.status = 'REJECTED')) as successful_audits,
         COUNT(*) FILTER (WHERE fa.verdict = 'FAIL' AND p.status = 'VERIFIED') as false_accusations,
         COUNT(*) FILTER (WHERE p.is_honeypot = true AND fa.verdict = 'FAIL') as honeypots_caught,
         COUNT(*) FILTER (WHERE p.is_honeypot = true AND fa.verdict = 'PASS') as honeypots_failed
       FROM fury_assignments fa
       JOIN proofs p ON fa.proof_id = p.id
       WHERE fa.fury_user_id = $1`,
      [user.id],
    );

    const stats = auditStats.rows[0];
    const totalAudits = Number(stats.total_audits);
    const successfulAudits = Number(stats.successful_audits);
    const falseAccusations = Number(stats.false_accusations);
    const honeypotsCaught = Number(stats.honeypots_caught);
    const honeypotsFailedOn = Number(stats.honeypots_failed);

    const accuracy = calculateAccuracy({
      furyId: user.id,
      successfulAudits,
      falseAccusations,
      totalAudits,
    });

    // Earnings from ledger
    const userResult = await this.pool.query(
      `SELECT account_id FROM users WHERE id = $1`,
      [user.id],
    );

    let totalBountiesEarned = 0;
    let totalPenaltiesPaid = 0;

    if (userResult.rows.length > 0 && userResult.rows[0].account_id) {
      const accountId = userResult.rows[0].account_id;

      const bountyResult = await this.pool.query(
        `SELECT COALESCE(SUM(amount), 0) as total
         FROM entries
         WHERE credit_account_id = $1 AND metadata->>'type' = 'FURY_BOUNTY'`,
        [accountId],
      );
      totalBountiesEarned = Number(bountyResult.rows[0].total);

      const penaltyResult = await this.pool.query(
        `SELECT COALESCE(SUM(amount), 0) as total
         FROM entries
         WHERE debit_account_id = $1 AND metadata->>'type' = 'FURY_PENALTY'`,
        [accountId],
      );
      totalPenaltiesPaid = Number(penaltyResult.rows[0].total);
    }

    return {
      totalAudits,
      successfulAudits,
      falseAccusations,
      accuracy: Math.round(accuracy * 1000) / 1000,
      totalBountiesEarned,
      totalPenaltiesPaid,
      netEarnings: totalBountiesEarned - totalPenaltiesPaid,
      honeypotsCaught,
      honeypotsFailedOn,
    };
  }

  @Get('queue')
  @ApiOperation({ summary: 'Get pending audit assignments for the current Fury reviewer' })
  async getAssignments(@CurrentUser() user: { id: string }) {
    const result = await this.pool.query(
      `SELECT fa.id AS assignment_id, fa.proof_id, fa.assigned_at,
              p.media_uri, p.contract_id, p.submitted_at
       FROM fury_assignments fa
       JOIN proofs p ON fa.proof_id = p.id
       WHERE fa.fury_user_id = $1 AND fa.verdict IS NULL
       ORDER BY fa.assigned_at ASC`,
      [user.id],
    );
    return { assignments: result.rows };
  }

  @Post('verdict')
  @ApiOperation({ summary: 'Submit a PASS or FAIL verdict on an assigned proof' })
  async submitVerdict(@CurrentUser() user: { id: string }, @Body() dto: SubmitVerdictDto) {
    // Record the verdict
    await this.pool.query(
      `UPDATE fury_assignments SET verdict = $1, reviewed_at = NOW()
       WHERE id = $2 AND fury_user_id = $3`,
      [dto.verdict, dto.assignmentId, user.id],
    );

    // Log to TruthLog
    await this.truthLog.appendEvent('FURY_VERDICT', {
      assignmentId: dto.assignmentId,
      furyUserId: user.id,
      verdict: dto.verdict,
    });

    // Get the proof ID to check consensus
    const assignment = await this.pool.query(
      `SELECT proof_id FROM fury_assignments WHERE id = $1`,
      [dto.assignmentId],
    );

    if (assignment.rows.length > 0) {
      await this.furyWorker.checkConsensus(assignment.rows[0].proof_id);
    }

    return { status: 'verdict_recorded' };
  }
}
