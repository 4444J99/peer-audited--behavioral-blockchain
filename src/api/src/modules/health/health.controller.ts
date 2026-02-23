import { Controller, Get } from '@nestjs/common';
import { Pool } from 'pg';
import Redis from 'ioredis';
import { REDIS_CONNECTION_CONFIG } from '../../../config/queue.config';
import { Public } from '../../common/decorators/current-user.decorator';

@Controller('health')
export class HealthController {
  private redis: Redis | null = null;

  constructor(private readonly pool: Pool) {
    try {
      this.redis = new Redis({ ...REDIS_CONNECTION_CONFIG, lazyConnect: true });
    } catch {
      // Redis not available — health check will report it
    }
  }

  @Get()
  @Public()
  async check() {
    const checks: Record<string, { status: string; latencyMs?: number }> = {};

    // Database probe
    const dbStart = Date.now();
    try {
      await this.pool.query('SELECT 1');
      checks.database = { status: 'ok', latencyMs: Date.now() - dbStart };
    } catch {
      checks.database = { status: 'error', latencyMs: Date.now() - dbStart };
    }

    // Redis probe
    const redisStart = Date.now();
    try {
      if (this.redis) {
        await this.redis.ping();
        checks.redis = { status: 'ok', latencyMs: Date.now() - redisStart };
      } else {
        checks.redis = { status: 'unavailable' };
      }
    } catch {
      checks.redis = { status: 'error', latencyMs: Date.now() - redisStart };
    }

    const allOk = Object.values(checks).every((c) => c.status === 'ok');

    return {
      status: allOk ? 'ok' : 'degraded',
      service: 'styx-api',
      timestamp: new Date().toISOString(),
      checks,
    };
  }
}
