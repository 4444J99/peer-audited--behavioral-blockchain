import { Inject, Injectable, Logger } from '@nestjs/common';
import { Pool } from 'pg';
import {
  JurisdictionDispositionMapper,
  REFUND_ONLY_FLAG_KEY,
} from './jurisdiction-disposition.mapper';

interface CacheEntry {
  value: unknown;
  expiresAt: number;
}

/**
 * Short in-process TTL so hot settlement paths do not pay a DB round-trip per
 * read, while every replica still converges onto persisted state within ~5s
 * of a change.
 */
const FLAG_CACHE_TTL_MS = 5_000;

/**
 * SystemFlagsService — durable system-wide operational flags.
 *
 * Backed by the system_flags table (key TEXT PK, value JSONB). Replaces
 * process-local statics (like the compliance REFUND_ONLY kill switch) that
 * were silently reset by every deploy and never shared across replicas.
 */
@Injectable()
export class SystemFlagsService {
  private readonly logger = new Logger(SystemFlagsService.name);
  private readonly cache = new Map<string, CacheEntry>();

  constructor(@Inject('DATABASE_POOL') private readonly pool: Pool) {}

  async get<T>(key: string): Promise<T | null> {
    const cached = this.cache.get(key);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.value as T | null;
    }

    const result = await this.pool.query(
      'SELECT value FROM system_flags WHERE key = $1',
      [key],
    );
    const value: T | null = result.rows.length > 0 ? result.rows[0].value : null;
    this.cache.set(key, { value, expiresAt: Date.now() + FLAG_CACHE_TTL_MS });
    return value;
  }

  async set(key: string, value: unknown, updatedBy?: string | null): Promise<void> {
    await this.pool.query(
      `INSERT INTO system_flags (key, value, updated_at, updated_by)
       VALUES ($1, $2, NOW(), $3)
       ON CONFLICT (key)
       DO UPDATE SET value = EXCLUDED.value, updated_at = NOW(), updated_by = EXCLUDED.updated_by`,
      [key, JSON.stringify(value), updatedBy ?? null],
    );
    this.cache.set(key, { value, expiresAt: Date.now() + FLAG_CACHE_TTL_MS });
    this.logger.log(`System flag updated: ${key}`);
  }

  /**
   * Reads the durable REFUND_ONLY kill-switch state and synchronizes the
   * mapper's in-process cache so synchronous settlement code sees fresh state.
   */
  async getRefundOnlyMode(): Promise<boolean> {
    return JurisdictionDispositionMapper.refreshFromStore(this);
  }

  async setRefundOnlyMode(enabled: boolean, updatedBy?: string | null): Promise<void> {
    await this.set(REFUND_ONLY_FLAG_KEY, enabled, updatedBy);
    JurisdictionDispositionMapper.setRefundOnlyMode(enabled);
  }

  /** Drops the in-process cache so the next read hits the database. */
  clearCache(): void {
    this.cache.clear();
  }
}
