import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { Pool } from 'pg';
import { AuthGuard } from '../../../guards/auth.guard';
import { FuryWorker } from './fury.worker';
import { TruthLogService } from '../../../services/ledger/truth-log.service';

interface SubmitVerdictDto {
  assignmentId: string;
  furyUserId: string;
  verdict: 'PASS' | 'FAIL';
}

@Controller('fury')
@UseGuards(AuthGuard)
export class FuryController {
  constructor(
    private readonly pool: Pool,
    private readonly furyWorker: FuryWorker,
    private readonly truthLog: TruthLogService,
  ) {}

  @Get('queue')
  async getAssignments(@Query('furyUserId') furyUserId: string) {
    const result = await this.pool.query(
      `SELECT fa.id AS assignment_id, fa.proof_id, fa.assigned_at,
              p.media_uri, p.contract_id, p.submitted_at
       FROM fury_assignments fa
       JOIN proofs p ON fa.proof_id = p.id
       WHERE fa.fury_user_id = $1 AND fa.verdict IS NULL
       ORDER BY fa.assigned_at ASC`,
      [furyUserId],
    );
    return { assignments: result.rows };
  }

  @Post('verdict')
  async submitVerdict(@Body() dto: SubmitVerdictDto) {
    // Record the verdict
    await this.pool.query(
      `UPDATE fury_assignments SET verdict = $1, reviewed_at = NOW()
       WHERE id = $2 AND fury_user_id = $3`,
      [dto.verdict, dto.assignmentId, dto.furyUserId],
    );

    // Log to TruthLog
    await this.truthLog.appendEvent('FURY_VERDICT', {
      assignmentId: dto.assignmentId,
      furyUserId: dto.furyUserId,
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
