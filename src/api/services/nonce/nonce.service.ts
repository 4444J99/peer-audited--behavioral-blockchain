import { Injectable, BadRequestException, ConflictException } from '@nestjs/common';
import { randomBytes, timingSafeEqual } from 'crypto';
import { Pool } from 'pg';

const NONCE_EXPIRY_MS = 120_000;
const NONCE_BYTE_LENGTH = 16;

@Injectable()
export class NonceService {
  constructor(private readonly pool: Pool) {}

  async generateNonce(contractId: string, userId: string): Promise<{
    nonce: string;
    raw: string;
    expiresAt: number;
  }> {
    const raw = randomBytes(NONCE_BYTE_LENGTH).toString('hex');
    const timestamp = Date.now();
    const expiresAt = timestamp + NONCE_EXPIRY_MS;
    const nonce = `STYX::${raw}::${timestamp}::${this.sanitizeSegment(contractId)}`;

    await this.pool.query(
      `INSERT INTO capture_nonces (nonce, raw, contract_id, user_id, expires_at, used)
       VALUES ($1, $2, $3, $4, to_timestamp($5::double precision / 1000), FALSE)
       ON CONFLICT (nonce) DO NOTHING`,
      [nonce, raw, contractId, userId, expiresAt],
    );

    return { nonce, raw, expiresAt };
  }

  async verifyNonce(
    nonce: string,
    contractId: string,
    userId: string,
  ): Promise<boolean> {
    const result = await this.pool.query(
      `SELECT id, raw, user_id, contract_id, used, expires_at
       FROM capture_nonces
       WHERE nonce = $1
       FOR UPDATE`,
      [nonce],
    );

    if (result.rows.length === 0) {
      return false;
    }

    const row = result.rows[0];

    if (row.used) {
      return false;
    }

    if (row.user_id !== userId) {
      return false;
    }

    if (row.contract_id !== contractId) {
      return false;
    }

    const now = new Date();
    const expiresAt = new Date(row.expires_at);
    if (now > expiresAt) {
      return false;
    }

    const nonceEnding = `::${this.sanitizeSegment(contractId)}`;
    if (!nonce.endsWith(nonceEnding)) {
      return false;
    }

    await this.pool.query(
      'UPDATE capture_nonces SET used = TRUE, used_at = NOW() WHERE id = $1',
      [row.id],
    );

    return true;
  }

  async consumeNonce(
    nonce: string,
    proofId: string,
  ): Promise<boolean> {
    const result = await this.pool.query(
      `UPDATE capture_nonces
       SET used = TRUE, used_at = NOW(), proof_id = $2
       WHERE nonce = $1 AND used = FALSE
       RETURNING id`,
      [nonce, proofId],
    );
    return result.rows.length > 0;
  }

  private sanitizeSegment(value: string): string {
    return String(value || '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}
