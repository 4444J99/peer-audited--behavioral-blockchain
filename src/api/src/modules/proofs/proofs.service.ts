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

  private getTenantAdminRoles(): Set<string> {
    return new Set(['ENTERPRISE_ADMIN', 'HR_ADMIN', 'TENANT_ADMIN']);
  }

  private async getRequesterAccessAgainstOwner(ownerUserId: string, requesterUserId: string) {
    return this.pool.query(
      `SELECT
         owner.enterprise_id AS owner_enterprise_id,
         requester.role AS requester_role,
         requester.enterprise_id AS requester_enterprise_id
       FROM users owner
       JOIN users requester ON requester.id = $2
       WHERE owner.id = $1`,
      [ownerUserId, requesterUserId],
    );
  }

  private canTenantAdminAccess(accessRow: any): boolean {
    const requesterRole = String(accessRow.requester_role || 'USER').toUpperCase();
    const sameEnterprise =
      accessRow.requester_enterprise_id &&
      accessRow.owner_enterprise_id &&
      accessRow.requester_enterprise_id === accessRow.owner_enterprise_id;
    return sameEnterprise && this.getTenantAdminRoles().has(requesterRole);
  }

  async getProofUploadContractAccess(contractId: string, requester: ProofReadRequester): Promise<{
    id: string;
    status: string;
    ownerUserId: string;
  }> {
    const contract = await this.pool.query(
      `SELECT c.id, c.status, c.user_id
       FROM contracts c
       WHERE c.id = $1`,
      [contractId],
    );

    if (contract.rows.length === 0) {
      throw new NotFoundException('Contract not found or does not belong to user');
    }

    const row = contract.rows[0];
    if (row.user_id !== requester.userId) {
      const accessResult = await this.getRequesterAccessAgainstOwner(row.user_id, requester.userId);
      if (accessResult.rows.length === 0) {
        throw new ForbiddenException('Cannot create proof for another user\'s contract');
      }

      const requesterRole = String(accessResult.rows[0].requester_role || 'USER').toUpperCase();
      if (requesterRole !== 'ADMIN' && !this.canTenantAdminAccess(accessResult.rows[0])) {
        throw new ForbiddenException('Cannot create proof for another user\'s contract');
      }
    }

    return {
      id: row.id,
      status: row.status,
      ownerUserId: row.user_id,
    };
  }

  async getProofUploadConfirmationAccess(proofId: string, requester: ProofReadRequester): Promise<{
    id: string;
    contractId: string;
    status: string;
    ownerUserId: string;
  }> {
    const proof = await this.pool.query(
      `SELECT p.id, p.contract_id, p.status, p.user_id
       FROM proofs p
       WHERE p.id = $1`,
      [proofId],
    );

    if (proof.rows.length === 0) {
      throw new NotFoundException('Proof not found or does not belong to user');
    }

    const row = proof.rows[0];
    if (row.user_id !== requester.userId) {
      const accessResult = await this.getRequesterAccessAgainstOwner(row.user_id, requester.userId);
      if (accessResult.rows.length === 0) {
        throw new ForbiddenException('Cannot confirm upload for another user\'s proof');
      }

      const requesterRole = String(accessResult.rows[0].requester_role || 'USER').toUpperCase();
      if (requesterRole !== 'ADMIN' && !this.canTenantAdminAccess(accessResult.rows[0])) {
        throw new ForbiddenException('Cannot confirm upload for another user\'s proof');
      }
    }

    return {
      id: row.id,
      contractId: row.contract_id,
      status: row.status,
      ownerUserId: row.user_id,
    };
  }

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
    const tenantAdminRoles = this.getTenantAdminRoles();
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
