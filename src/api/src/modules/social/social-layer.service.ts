import { Injectable, Logger } from '@nestjs/common';
import { Pool } from 'pg';
import { createHash } from 'crypto';

export interface PublicProfile {
  alias: string;
  integrityScore: number;
  badges: any[];
  activeContractsCount: number;
}

@Injectable()
export class SocialLayerService {
  private readonly logger = new Logger(SocialLayerService.name);

  constructor(private readonly pool: Pool) {}

  /**
   * F-SOCIAL-02: Anonymized Social Layer
   * Generates a pseudonymous public alias for a user.
   * The alias rotates monthly to prevent long-term tracking by malicious Furies.
   */
  async getPublicProfile(userId: string): Promise<PublicProfile> {
    const userResult = await this.pool.query(
      `SELECT integrity_score, badges, 
        (SELECT COUNT(*) FROM contracts WHERE user_id = users.id AND status = 'ACTIVE') as active_count
       FROM users WHERE id = $1`,
      [userId]
    );

    if (userResult.rows.length === 0) {
      throw new Error('User not found');
    }

    const user = userResult.rows[0];
    const monthKey = new Date().toISOString().substring(0, 7); // e.g. "2026-03"
    
    // Deterministic but non-reversible alias for the current month
    const hash = createHash('sha256')
      .update(`${userId}:${monthKey}:${process.env.APP_SECRET || 'styx-default-secret'}`)
      .digest('hex');
    
    const animalPrefixes = ['Stoic', 'Vigilant', 'Resilient', 'Honorable', 'Ancient', 'Silent'];
    const animals = ['Wolf', 'Owl', 'Bear', 'Eagle', 'Stag', 'Lynx'];
    
    const prefixIndex = parseInt(hash.substring(0, 2), 16) % animalPrefixes.length;
    const animalIndex = parseInt(hash.substring(2, 4), 16) % animals.length;
    const suffix = hash.substring(4, 8);
    
    const alias = `${animalPrefixes[prefixIndex]} ${animals[animalIndex]} ${suffix}`;

    return {
      alias,
      integrityScore: user.integrity_score,
      badges: user.badges || [],
      activeContractsCount: parseInt(user.active_count),
    };
  }

  /**
   * Returns the "Tavern Board" — a public leaderboard of top integrity performers.
   */
  async getLeaderboard(limit: number = 10): Promise<PublicProfile[]> {
    const topUsers = await this.pool.query(
      `SELECT id, integrity_score, badges
       FROM users 
       WHERE status = 'ACTIVE' 
       AND integrity_score > 50
       ORDER BY integrity_score DESC 
       LIMIT $1`,
      [limit]
    );

    const profiles = await Promise.all(
      topUsers.rows.map(user => this.getPublicProfile(user.id))
    );

    return profiles;
  }
}
