import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Pool } from 'pg';
import { R2StorageService } from '../../../services/storage/r2.service';

export interface ProofReadRequester {
  userId: string;
}

@Injectable()
export class ProofsService {
  constructor(
    private readonly pool: Pool,
    private readonly r2: R2StorageService,
  ) {}

  async getProofDetail(proofId: string, requester: ProofReadRequester) {
    const proof = await this.pool.query(
      `SELECT p.id, p.contract_id, p.user_id, p.status, p.content_type, p.description,
              p.media_uri, p.submitted_at, p.uploaded_at, p.is_honeypot,
              c.user_id AS contract_owner_id,
              requester.role AS requester_role,
              requester.enterprise_id AS requester_enterprise_id,
              contract_owner.enterprise_id AS contract_owner_enterprise_id,
              EXISTS(
                SELECT 1
                FROM fury_assignments fa
                WHERE fa.proof_id = p.id AND fa.fury_user_id = $2
              ) AS requester_is_assigned_fury
       FROM proofs p
       JOIN contracts c ON c.id = p.contract_id
       JOIN users requester ON requester.id = $2
       JOIN users contract_owner ON contract_owner.id = c.user_id
       WHERE p.id = $1`,
      [proofId, requester.userId],
    );

    if (proof.rows.length === 0) {
      throw new NotFoundException('Proof not found');
    }

    const row = proof.rows[0];

    const requesterRole = String(row.requester_role || 'USER').toUpperCase();
    const tenantAdminRoles = new Set(['ENTERPRISE_ADMIN', 'HR_ADMIN', 'TENANT_ADMIN']);
    const sameEnterprise =
      row.requester_enterprise_id &&
      row.contract_owner_enterprise_id &&
      row.requester_enterprise_id === row.contract_owner_enterprise_id;

    const canRead =
      row.user_id === requester.userId ||
      row.contract_owner_id === requester.userId ||
      requesterRole === 'ADMIN' ||
      row.requester_is_assigned_fury === true ||
      (sameEnterprise && tenantAdminRoles.has(requesterRole));

    if (!canRead) {
      throw new ForbiddenException('Cannot access this proof');
    }

    let viewUrl: string | null = null;
    if (row.media_uri) {
      viewUrl = await this.r2.generateViewUrl(row.media_uri);
    }

    return {
      id: row.id,
      contractId: row.contract_id,
      status: row.status,
      contentType: row.content_type,
      description: row.description,
      submittedAt: row.submitted_at,
      uploadedAt: row.uploaded_at,
      isHoneypot: row.is_honeypot,
      viewUrl,
    };
  }
}
