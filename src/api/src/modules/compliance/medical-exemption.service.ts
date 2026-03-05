import { Injectable, Logger } from '@nestjs/common';
import { Pool } from 'pg';
import { TruthLogService } from '../../../services/ledger/truth-log.service';

export interface MedicalExemptionRequest {
  contractId: string;
  userId: string;
  reason: string;
  documentationUri?: string;
}

@Injectable()
export class MedicalExemptionService {
  private readonly logger = new Logger(MedicalExemptionService.name);

  constructor(
    private readonly pool: Pool,
    private readonly truthLog: TruthLogService,
  ) {}

  /**
   * F-AEGIS-07: Medical Exemption Service
   * Initiates a compassionate audit for a contract due to medical emergency.
   * Contracts in EXEMPTED status stop accruing strikes and are eventually resolved
   * as REFUNDED by the Judge.
   */
  async requestExemption(req: MedicalExemptionRequest): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      // 1. Verify contract ownership
      const contractResult = await client.query(
        'SELECT status FROM contracts WHERE id = $1 AND user_id = $2',
        [req.contractId, req.userId]
      );

      if (contractResult.rows.length === 0) {
        throw new Error('Contract not found or unauthorized');
      }

      // 2. Update contract status to EXEMPT_PENDING
      await client.query(
        `UPDATE contracts 
         SET status = 'EXEMPT_PENDING', 
             metadata = metadata || jsonb_build_object(
               'medical_exemption_requested_at', NOW(),
               'medical_exemption_reason', $2,
               'medical_exemption_doc', $3
             )
         WHERE id = $1`,
        [req.contractId, req.reason, req.documentationUri]
      );

      // 3. Log event
      await this.truthLog.appendEvent('MEDICAL_EXEMPTION_REQUESTED', {
        contractId: req.contractId,
        userId: req.userId,
        reason: req.reason,
      });

      await client.query('COMMIT');
      this.logger.log(`Medical exemption requested for contract ${req.contractId}`);
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  /**
   * Finalizes an exemption after Judge review.
   */
  async approveExemption(contractId: string, judgeId: string): Promise<void> {
    await this.pool.query(
      `UPDATE contracts 
       SET status = 'EXEMPTED',
           metadata = metadata || jsonb_build_object(
             'medical_exemption_approved_at', NOW(),
             'approved_by_judge', $2
           )
       WHERE id = $1`,
      [contractId, judgeId]
    );

    await this.truthLog.appendEvent('MEDICAL_EXEMPTION_APPROVED', {
      contractId,
      judgeId,
    });
  }
}
