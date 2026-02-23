import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';

const BCRYPT_ROUNDS = 10;
const TOKEN_EXPIRY = '24h';

function getJwtSecret(): string {
  return process.env.JWT_SECRET || 'styx-dev-secret-do-not-use-in-production'; // allow-secret
}

export interface AuthPayload {
  sub: string;
  email: string;
  iat?: number;
  exp?: number;
}

@Injectable()
export class AuthService {
  constructor(private readonly pool: Pool) {}

  async register(email: string, password: string): Promise<{ userId: string; token: string }> { // allow-secret
    // Check for existing user
    const existing = await this.pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    // Create ledger account for the user
    const accountResult = await this.pool.query(
      `INSERT INTO accounts (name, type) VALUES ($1, 'ASSET') RETURNING id`,
      [`USER_${email.split('@')[0]}_${Date.now()}`],
    );
    const accountId = accountResult.rows[0].id;

    // Insert user
    const userResult = await this.pool.query(
      `INSERT INTO users (email, password_hash, account_id, status, integrity_score)
       VALUES ($1, $2, $3, 'ACTIVE', 50)
       RETURNING id`,
      [email, passwordHash, accountId],
    );
    const userId = userResult.rows[0].id;

    const token = this.signToken(userId, email); // allow-secret
    return { userId, token };
  }

  async login(email: string, password: string): Promise<{ userId: string; token: string }> { // allow-secret
    const result = await this.pool.query(
      'SELECT id, email, password_hash, status FROM users WHERE email = $1',
      [email],
    );

    if (result.rows.length === 0) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const user = result.rows[0];

    if (!user.password_hash) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const token = this.signToken(user.id, user.email); // allow-secret
    return { userId: user.id, token };
  }

  signToken(userId: string, email: string): string {
    return jwt.sign({ sub: userId, email }, getJwtSecret(), { expiresIn: TOKEN_EXPIRY });
  }

  async exchangeEnterpriseToken(enterpriseToken: string): Promise<{ userId: string; token: string }> { // allow-secret
    // Verify the enterprise token is a valid JWT signed with our secret
    let payload: AuthPayload;
    try {
      payload = jwt.verify(enterpriseToken, getJwtSecret()) as AuthPayload;
    } catch {
      throw new UnauthorizedException('Invalid enterprise token');
    }

    // Look up the user by enterprise association
    const result = await this.pool.query(
      'SELECT id, email, enterprise_id, status FROM users WHERE id = $1 AND enterprise_id IS NOT NULL',
      [payload.sub],
    );

    if (result.rows.length === 0) {
      throw new UnauthorizedException('No enterprise user found for this token');
    }

    const user = result.rows[0];
    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Enterprise user account is not active');
    }

    const token = this.signToken(user.id, user.email); // allow-secret
    return { userId: user.id, token };
  }

  verifyToken(token: string): AuthPayload { // allow-secret
    return jwt.verify(token, getJwtSecret()) as AuthPayload;
  }
}
