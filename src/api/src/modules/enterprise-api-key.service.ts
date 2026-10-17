import { Injectable, Logger } from "@nestjs/common";
import { Pool } from "pg";

export interface EnterpriseApiKey {
  id: string;
  enterpriseId: string;
  userId: string;
  keyId: string;
  key: string;
  name: string;
  description: string;
  scopes: string[];
  expiresAt: string | null;
  revokedAt: string | null;
  lastUsedAt: string | null;
  status: "active" | "expired" | "revoked";
  createdAt: string;
  createdBy: string;
}

export interface CreateApiKeyInput {
  enterpriseId: string;
  userId: string;
  name: string;
  description: string;
  scopes: string[];
  expiresInDays?: number;
}

@Injectable()
export class EnterpriseApiKeyService {
  private readonly logger = new Logger(EnterpriseApiKeyService.name);

  constructor(private readonly pool: Pool) {}

  async createEnterpriseApiKey(
    input: CreateApiKeyInput,
    createdBy: string,
  ): Promise<EnterpriseApiKey> {
    const keyId = crypto.randomUUID();
    const key = this.generateApiKey();
    const expiresAt = input.expiresInDays
      ? new Date(Date.now() + input.expiresInDays * 24 * 60 * 60 * 1000)
      : null;

    const result = await this.pool.query(
      `INSERT INTO api_keys
       (enterprise_id, user_id, key_id, key_hash, name, prefix,
        expires_at, revoked_at, last_used_at, created_at, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), $10)
       RETURNING *`,
      [
        input.enterpriseId,
        input.userId,
        keyId,
        this.hashApiKey(key),
        input.name,
        `ent_${keyId.substring(0, 8)}`,
        expiresAt ? expiresAt.toISOString() : null,
        null,
        null,
        createdBy,
      ],
    );

    const row = result.rows[0];
    return {
      id: row.id,
      enterpriseId: row.enterprise_id,
      userId: row.user_id,
      keyId: row.key_id,
      key,
      name: row.name,
      description: row.description || "",
      scopes: row.api_key_scope || ["basic"],
      expiresAt: row.expires_at,
      revokedAt: row.revoked_at,
      lastUsedAt: row.last_used_at,
      status: this.calculateStatus(
        row.expires_at,
        row.revoked_at,
      ),
      createdAt: row.created_at,
      createdBy: row.created_by,
    };
  }

  async getEnterpriseApiKeys(
    enterpriseId: string,
    userId?: string,
  ): Promise<EnterpriseApiKey[]> {
    let query: string;
    let params: any[];

    if (userId) {
      query = `
        SELECT * FROM api_keys
        WHERE enterprise_id = $1 AND user_id = $2
        ORDER BY created_at DESC
      `;
      params = [enterpriseId, userId];
    } else {
      query = `
        SELECT * FROM api_keys
        WHERE enterprise_id = $1
        ORDER BY created_at DESC
      `;
      params = [enterpriseId];
    }

    const result = await this.pool.query(query, params);

    return result.rows.map((row) => ({
      id: row.id,
      enterpriseId: row.enterprise_id,
      userId: row.user_id,
      keyId: row.key_id,
      key: "",
      name: row.name,
      description: row.description || "",
      scopes: row.api_key_scope || ["basic"],
      expiresAt: row.expires_at,
      revokedAt: row.revoked_at,
      lastUsedAt: row.last_used_at,
      status: this.calculateStatus(
        row.expires_at,
        row.revoked_at,
      ),
      createdAt: row.created_at,
      createdBy: row.created_by,
    }));
  }

  async revokeEnterpriseApiKey(
    keyId: string,
    enterpriseId: string,
    userId: string,
  ): Promise<{ success: boolean }> {
    const result = await this.pool.query(
      `UPDATE api_keys
       SET revoked_at = NOW()
       WHERE key_id = $1 AND enterprise_id = $2 AND user_id = $3
       RETURNING id`,
      [keyId, enterpriseId, userId],
    );

    return { success: result.rows.length > 0 };
  }

  async validateEnterpriseApiKey(
    apiKey: string,
  ): Promise<EnterpriseApiKey | null> {
    const parsed = this.parseApiKey(apiKey);
    if (!parsed) {
      return null;
    }

    const result = await this.pool.query(
      `SELECT ak.*, u.email, u.enterprise_id, u.role
       FROM api_keys ak
       JOIN users u ON u.id = ak.user_id
       WHERE ak.key_id = $1 AND ak.revoked_at IS NULL
       AND (ak.expires_at IS NULL OR ak.expires_at > NOW())
       AND u.status = 'ACTIVE'`,
      [parsed.keyId],
    );

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    if (!compareHashes(row.key_hash, row.hash)) {
      return null;
    }

    await this.updateApiKeyUsage(row.id);

    return {
      id: row.id,
      enterpriseId: row.enterprise_id,
      userId: row.user_id,
      keyId: row.key_id,
      key: apiKey,
      name: row.name,
      description: row.description || "",
      scopes: row.api_key_scope || ["basic"],
      expiresAt: row.expires_at,
      revokedAt: row.revoked_at,
      lastUsedAt: new Date().toISOString(),
      status: this.calculateStatus(
        row.expires_at,
        row.revoked_at,
      ),
      createdAt: row.created_at,
      createdBy: row.created_by,
    };
  }

  async getApiKeyScopes(
    keyId: string,
  ): Promise<string[] | null> {
    const result = await this.pool.query(
      `SELECT api_key_scope FROM api_keys WHERE key_id = $1`,
      [keyId],
    );

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0].api_key_scope;
  }

  async updateApiKeyScopes(
    keyId: string,
    enterpriseId: string,
    userId: string,
    scopes: string[],
  ): Promise<{ success: boolean }> {
    const result = await this.pool.query(
      `UPDATE api_keys
       SET api_key_scope = $3
       WHERE key_id = $1 AND enterprise_id = $2 AND user_id = $3
       RETURNING id`,
      [keyId, enterpriseId, scopes],
    );

    return { success: result.rows.length > 0 };
  }

  private generateApiKey(): string {
    const keyId = crypto.randomUUID();
    const secret = crypto.randomBytes(24).toString("base64url");
    return `ent_${keyId}_${secret}`;
  }

  private hashApiKey(key: string): string {
    const secret = key.split("_")[2] || "";
    const hash = require("crypto").createHash("sha256");
    return hash.update(secret).digest("hex");
  }

  private calculateStatus(
    expiresAt: string | null,
    revokedAt: string | null,
  ): "active" | "expired" | "revoked" {
    if (revokedAt) return "revoked";
    if (expiresAt && new Date(expiresAt) < new Date()) return "expired";
    return "active";
  }

  private parseApiKey(
    apiKey: string,
  ): { keyId: string; secret: string } | null {
    const match = /^ent_([a-f0-9-]{36})_([A-Za-z0-9_-]+)$/.exec(apiKey);
    if (!match) return null;

    return { keyId: match[1], secret: match[2] };
  }

  private async updateApiKeyUsage(keyId: string): Promise<void> {
    await this.pool.query(
      `UPDATE api_keys
       SET last_used_at = NOW()
       WHERE key_id = $1`,
      [keyId],
    );
  }

  private compareHashes(left: string, right: string): boolean {
    const leftBuf = Buffer.from(left, "hex");
    const rightBuf = Buffer.from(right, "hex");
    if (leftBuf.length !== rightBuf.length) return false;

    const crypto = require("crypto");
    return crypto.timingSafeEqual(leftBuf, rightBuf);
  }
}

function requireApiKeyPepper(): string {
  const pepper = process.env.STYX_API_KEY_PEPPER;
  if (!pepper) {
    throw new Error("STYX_API_KEY_PEPPER must be set");
  }
  return pepper;
}

function deriveApiKeyVerifier(
  secret: string,
): string {
  const pepper = requireApiKeyPepper();
  const scrypt = require("crypto");

  return scrypt.scryptSync(secret, pepper, 64, {
    N: 16384,
    r: 8,
    p: 1,
  }).toString("hex");
}
function compareHashes(left: string, right: string): boolean {
  const leftBuf = Buffer.from(left, "hex");
  const rightBuf = Buffer.from(right, "hex");
  if (leftBuf.length !== rightBuf.length) return false;

  const crypto = require("crypto");
  return crypto.timingSafeEqual(leftBuf, rightBuf);
}

// Export hash function
Object.assign(
  module.exports,
  { compareHashes },
);