import { Injectable, NotFoundException } from '@nestjs/common';
import { Pool } from 'pg';

@Injectable()
export class UsersService {
  constructor(private readonly pool: Pool) {}

  async getProfile(userId: string) {
    const result = await this.pool.query(
      'SELECT id, email, integrity_score, status, created_at FROM users WHERE id = $1',
      [userId],
    );
    if (result.rows.length === 0) {
      throw new NotFoundException(`User ${userId} not found`);
    }
    return result.rows[0];
  }

  async getPublicProfile(userId: string) {
    const result = await this.pool.query(
      'SELECT id, integrity_score, created_at FROM users WHERE id = $1',
      [userId],
    );
    if (result.rows.length === 0) {
      throw new NotFoundException(`User ${userId} not found`);
    }
    return result.rows[0];
  }

  async getLeaderboard(limit: number = 10) {
    const maxLimit = Math.min(limit, 100);
    const result = await this.pool.query(
      `SELECT id, email, integrity_score, created_at
       FROM users WHERE status = 'ACTIVE'
       ORDER BY integrity_score DESC
       LIMIT $1`,
      [maxLimit],
    );
    return result.rows;
  }
}
