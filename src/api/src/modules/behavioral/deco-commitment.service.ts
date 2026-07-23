import { Inject, Injectable } from "@nestjs/common";
import { Pool } from "pg";
import { createDecoProof, DecoProofRequest } from "../../../../shared/libs/behavioral-logic";

@Injectable()
export class DecoCommitmentService {
  constructor(@Inject("DATABASE_POOL") private readonly pool: Pool) {}

  async createCommitment(params: DecoProofRequest, userId?: string): Promise<{
    verified: boolean;
    commitmentHash: string;
    timestamp: string;
    stored: boolean;
  }> {
    const result = await createDecoProof(params);
    let stored = false;
    try {
      await this.pool.query(
        `INSERT INTO deco_commitments (user_id, url, selector, expected_value, commitment_hash, verified)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [userId ?? null, params.url, params.selector, params.expectedValue, result.commitmentHash, result.verified],
      );
      stored = true;
    } catch {
      stored = false;
    }
    return { verified: result.verified, commitmentHash: result.commitmentHash, timestamp: result.timestamp, stored };
  }

  async verifyCommitment(commitmentHash: string): Promise<{
    exists: boolean;
    originalClaim: DecoProofRequest | null;
    createdAt: Date | null;
  }> {
    const { rows } = await this.pool.query(
      `SELECT url, selector, expected_value, created_at FROM deco_commitments WHERE commitment_hash = $1 LIMIT 1`,
      [commitmentHash],
    );
    if (rows.length === 0) {
      return { exists: false, originalClaim: null, createdAt: null };
    }
    const row = rows[0];
    return {
      exists: true,
      originalClaim: { url: row.url, selector: row.selector, expectedValue: row.expected_value },
      createdAt: row.created_at,
    };
  }

  async getCommitmentHistory(userId: string, limit = 50): Promise<any[]> {
    const { rows } = await this.pool.query(
      `SELECT id, url, selector, expected_value, commitment_hash, verified, created_at
       FROM deco_commitments WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2`,
      [userId, limit],
    );
    return rows;
  }
}
