import { Inject, Injectable } from "@nestjs/common";
import { Pool } from "pg";
import { createHash } from "crypto";
import { createDecoProof, DecoProofRequest } from "../../../../shared/libs/behavioral-logic";

@Injectable()
export class DecoCommitmentService {
  constructor(@Inject("DATABASE_POOL") private readonly pool: Pool) {}

  /**
   * Stores only the commitment and the timestamp that was hashed into it. The
   * URL, selector, and expected value are deliberately NOT persisted: a
   * commitment whose plaintext sits in the same row conceals nothing from a
   * database reader, and rows outlive the user (the FK only nulls user_id).
   * Verification recomputes the hash from a supplied claim instead.
   */
  async createCommitment(params: DecoProofRequest, userId?: string): Promise<{
    verified: boolean;
    commitmentHash: string;
    timestamp: string;
    stored: boolean;
  }> {
    const result = await createDecoProof(params);
    // Domain only — enough to tell commitments apart operationally without
    // revealing the path, selector, or the value being committed to.
    let domain: string | null = null;
    try {
      domain = new URL(params.url).hostname;
    } catch {
      domain = null;
    }

    let stored = false;
    try {
      await this.pool.query(
        `INSERT INTO deco_commitments (user_id, domain, committed_at, commitment_hash, verified)
         VALUES ($1, $2, $3, $4, $5)`,
        [userId ?? null, domain, result.timestamp, result.commitmentHash, result.verified],
      );
      stored = true;
    } catch {
      stored = false;
    }
    return {
      verified: result.verified,
      commitmentHash: result.commitmentHash,
      timestamp: result.timestamp,
      stored,
    };
  }

  /**
   * Proves a claim against a stored commitment by recomputing the hash over the
   * supplied claim plus the persisted timestamp. Database presence alone is not
   * evidence — without recomputation an altered claim would still verify.
   */
  async verifyCommitment(
    commitmentHash: string,
    claim?: DecoProofRequest,
  ): Promise<{
    exists: boolean;
    matches: boolean | null;
    committedAt: string | null;
    createdAt: Date | null;
  }> {
    const { rows } = await this.pool.query(
      `SELECT committed_at, created_at FROM deco_commitments WHERE commitment_hash = $1 LIMIT 1`,
      [commitmentHash],
    );
    if (rows.length === 0) {
      return { exists: false, matches: null, committedAt: null, createdAt: null };
    }

    const row = rows[0];
    const committedAt =
      row.committed_at instanceof Date
        ? row.committed_at.toISOString()
        : row.committed_at;

    if (!claim) {
      return { exists: true, matches: null, committedAt, createdAt: row.created_at };
    }

    const recomputed = createHash("sha256")
      .update(claim.url + claim.selector + claim.expectedValue + committedAt)
      .digest("hex");

    return {
      exists: true,
      matches: recomputed === commitmentHash,
      committedAt,
      createdAt: row.created_at,
    };
  }

  async getCommitmentHistory(userId: string, limit = 50): Promise<any[]> {
    const { rows } = await this.pool.query(
      `SELECT id, domain, commitment_hash, verified, committed_at, created_at
       FROM deco_commitments WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2`,
      [userId, limit],
    );
    return rows;
  }
}
