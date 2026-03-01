import { Injectable, ConflictException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { Pool, PoolClient } from 'pg';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { randomBytes, createHash } from 'crypto';

const BCRYPT_ROUNDS = 10;
const ACCESS_TOKEN_EXPIRY = '15m';
const TOKEN_EXPIRY = ACCESS_TOKEN_EXPIRY; // alias for backward compat
const REFRESH_TOKEN_EXPIRY_DAYS = 7;
const MAX_FAILED_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MINUTES = 15;

export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET; // allow-secret
  if (!secret && process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET must be set in production');
  }
  return secret || 'styx-dev-secret-do-not-use-in-production'; // allow-secret
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

  async register(
    email: string,
    password: string, // allow-secret
    opts?: { ageConfirmation?: boolean; termsAccepted?: boolean; dateOfBirth?: string },
  ): Promise<{ userId: string; token: string }> { // allow-secret
    const maybeConnect = (this.pool as unknown as { connect?: () => Promise<PoolClient> }).connect;
    const client = typeof maybeConnect === 'function' ? await maybeConnect.call(this.pool) : null;
    const db: { query: PoolClient['query'] } = (client ?? this.pool) as any;
    const useTransaction = !!client;

    try {
      if (useTransaction) {
        await db.query('BEGIN');
      }

      // Enforce age gate and terms acceptance
      if (!opts?.ageConfirmation) {
        throw new BadRequestException('You must confirm you are 18 years or older');
      }
      if (!opts?.termsAccepted) {
        throw new BadRequestException('You must accept the Terms of Service and Privacy Policy');
      }
      if (opts?.dateOfBirth) {
        const dob = new Date(opts.dateOfBirth);
        if (isNaN(dob.getTime())) {
          throw new BadRequestException('Invalid date of birth format');
        }
        const now = new Date();
        const age = now.getFullYear() - dob.getFullYear() -
          (now < new Date(now.getFullYear(), dob.getMonth(), dob.getDate()) ? 1 : 0);
        if (age < 18) {
          throw new BadRequestException('You must be at least 18 years old to use Styx');
        }
      }

      // Check for existing user
      const existing = await db.query('SELECT id FROM users WHERE email = $1', [email]);
      if (existing.rows.length > 0) {
        throw new ConflictException('Email already registered');
      }

      const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

      // Create ledger account for the user
      const accountResult = await db.query(
        `INSERT INTO accounts (name, type) VALUES ($1, 'ASSET') RETURNING id`,
        [`USER_${email.split('@')[0]}_${Date.now()}`],
      );
      const accountId = accountResult.rows[0].id;

      // Insert user
      const userResult = await db.query(
        `INSERT INTO users (email, password_hash, account_id, status, integrity_score,
                            age_verification_status, terms_accepted_at, terms_version, date_of_birth)
         VALUES ($1, $2, $3, 'ACTIVE', 50, 'SELF_DECLARED', NOW(), '1.0', $4)
         RETURNING id`,
        [email, passwordHash, accountId, opts?.dateOfBirth || null],
      );
      const userId = userResult.rows[0].id;

      if (useTransaction) {
        await db.query('COMMIT');
      }

      const token = this.signToken(userId, email); // allow-secret
      return { userId, token };
    } catch (err) {
      if (useTransaction) {
        try {
          await db.query('ROLLBACK');
        } catch {
          // Preserve the original error.
        }
      }
      throw err;
    } finally {
      client?.release();
    }
  }

  async login(email: string, password: string): Promise<{ userId: string; token: string }> { // allow-secret
    const result = await this.pool.query(
      'SELECT id, email, password_hash, status, failed_login_attempts, locked_until FROM users WHERE email = $1',
      [email],
    );

    if (result.rows.length === 0) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const user = result.rows[0];

    // Check account lockout
    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      throw new UnauthorizedException('Account temporarily locked. Try again later.');
    }

    if (!user.password_hash) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (String(user.status || '').toUpperCase() !== 'ACTIVE') {
      throw new UnauthorizedException('Invalid email or password');
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      const attempts = (user.failed_login_attempts || 0) + 1;
      if (attempts >= MAX_FAILED_LOGIN_ATTEMPTS) {
        await this.pool.query(
          `UPDATE users SET failed_login_attempts = $1, locked_until = NOW() + INTERVAL '${LOCKOUT_DURATION_MINUTES} minutes' WHERE id = $2`,
          [attempts, user.id],
        );
      } else {
        await this.pool.query(
          'UPDATE users SET failed_login_attempts = $1 WHERE id = $2',
          [attempts, user.id],
        );
      }
      throw new UnauthorizedException('Invalid email or password');
    }

    // Successful login — reset lockout counters
    if (user.failed_login_attempts > 0 || user.locked_until) {
      await this.pool.query(
        'UPDATE users SET failed_login_attempts = 0, locked_until = NULL WHERE id = $1',
        [user.id],
      );
    }

    const token = this.signToken(user.id, user.email); // allow-secret
    return { userId: user.id, token };
  }

  private signToken(userId: string, email: string): string {
    return jwt.sign({ sub: userId, email }, getJwtSecret(), { expiresIn: TOKEN_EXPIRY });
  }

  async exchangeEnterpriseToken(enterpriseToken: string): Promise<{ userId: string; token: string }> { // allow-secret
    // Verify the enterprise token is a valid JWT signed with our secret
    let payload: AuthPayload;
    try {
      payload = jwt.verify(enterpriseToken, getJwtSecret(), { algorithms: ['HS256'] }) as AuthPayload;
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
    return jwt.verify(token, getJwtSecret(), { algorithms: ['HS256'] }) as AuthPayload;
  }

  /** Generate a refresh token, store its hash in DB, return the raw token. */
  async generateRefreshToken(userId: string): Promise<string> {
    const rawToken = randomBytes(32).toString('hex'); // allow-secret
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

    await this.pool.query(
      `INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)`,
      [userId, tokenHash, expiresAt],
    );

    return rawToken;
  }

  /** Validate a refresh token, rotate it (revoke old, issue new), and return a new access + refresh token pair. */
  async refreshAccessToken(refreshToken: string): Promise<{ userId: string; token: string; refreshToken: string }> { // allow-secret
    const tokenHash = createHash('sha256').update(refreshToken).digest('hex');

    const result = await this.pool.query(
      `SELECT rt.id, rt.user_id, rt.expires_at, rt.revoked, u.email, u.status
       FROM refresh_tokens rt
       JOIN users u ON rt.user_id = u.id
       WHERE rt.token_hash = $1`,
      [tokenHash],
    );

    if (result.rows.length === 0) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const row = result.rows[0];

    if (row.revoked) {
      throw new UnauthorizedException('Refresh token has been revoked');
    }

    if (new Date(row.expires_at) < new Date()) {
      throw new UnauthorizedException('Refresh token has expired');
    }

    if (String(row.status || '').toUpperCase() !== 'ACTIVE') {
      throw new UnauthorizedException('User account is not active');
    }

    // Revoke the old refresh token (rotation)
    await this.pool.query(
      `UPDATE refresh_tokens SET revoked = TRUE WHERE id = $1`,
      [row.id],
    );

    // Issue new tokens
    const accessToken = this.signToken(row.user_id, row.email); // allow-secret
    const newRefreshToken = await this.generateRefreshToken(row.user_id); // allow-secret

    return { userId: row.user_id, token: accessToken, refreshToken: newRefreshToken };
  }

  /** Revoke all refresh tokens for a user (used on logout and password change). */
  async revokeRefreshTokensForUser(userId: string): Promise<void> {
    await this.pool.query(
      `UPDATE refresh_tokens SET revoked = TRUE WHERE user_id = $1 AND revoked = FALSE`,
      [userId],
    );
  }
}
