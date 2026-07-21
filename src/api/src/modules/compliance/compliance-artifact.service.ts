import { Injectable, Logger } from '@nestjs/common';
import { Pool } from 'pg';
import type { ComplianceArtifactStatus } from '../../../../shared/index';

@Injectable()
export class ComplianceArtifactService {
  private readonly logger = new Logger(ComplianceArtifactService.name);

  constructor(private readonly pool: Pool) {}

  async getActiveArtifact(artifactType: string): Promise<ComplianceArtifactStatus | null> {
    const result = await this.pool.query(
      `SELECT artifact_type, version, content_hash, signed_by,
              signed_at, expires_at, is_active, jurisdictions
       FROM compliance_artifacts
       WHERE artifact_type = $1 AND is_active = true
       LIMIT 1`,
      [artifactType],
    );

    if (result.rows.length === 0) return null;

    const row = result.rows[0];
    return {
      artifactType: row.artifact_type,
      version: row.version,
      contentHash: row.content_hash,
      signedBy: row.signed_by,
      signedAt: row.signed_at ? row.signed_at.toISOString() : null,
      expiresAt: row.expires_at ? row.expires_at.toISOString() : null,
      isActive: row.is_active,
      jurisdictions: row.jurisdictions || [],
    };
  }

  async getAllActiveArtifacts(): Promise<ComplianceArtifactStatus[]> {
    const result = await this.pool.query(
      `SELECT artifact_type, version, content_hash, signed_by,
              signed_at, expires_at, is_active, jurisdictions
       FROM compliance_artifacts
       WHERE is_active = true
       ORDER BY artifact_type`,
    );

    return result.rows.map((row: any) => ({
      artifactType: row.artifact_type,
      version: row.version,
      contentHash: row.content_hash,
      signedBy: row.signed_by,
      signedAt: row.signed_at ? row.signed_at.toISOString() : null,
      expiresAt: row.expires_at ? row.expires_at.toISOString() : null,
      isActive: row.is_active,
      jurisdictions: row.jurisdictions || [],
    }));
  }

  async getArtifactByVersion(artifactType: string, version: string): Promise<ComplianceArtifactStatus | null> {
    const result = await this.pool.query(
      `SELECT artifact_type, version, content_hash, signed_by,
              signed_at, expires_at, is_active, jurisdictions
       FROM compliance_artifacts
       WHERE artifact_type = $1 AND version = $2
       LIMIT 1`,
      [artifactType, version],
    );

    if (result.rows.length === 0) return null;

    const row = result.rows[0];
    return {
      artifactType: row.artifact_type,
      version: row.version,
      contentHash: row.content_hash,
      signedBy: row.signed_by,
      signedAt: row.signed_at ? row.signed_at.toISOString() : null,
      expiresAt: row.expires_at ? row.expires_at.toISOString() : null,
      isActive: row.is_active,
      jurisdictions: row.jurisdictions || [],
    };
  }
}
