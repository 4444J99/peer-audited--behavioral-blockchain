import { Injectable, ConflictException, UnauthorizedException, BadRequestException, Optional, Inject } from '@nestjs/common';
import { ReferralService } from '../referrals/referral.service';
import { Pool, PoolClient } from 'pg';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { randomBytes, createHash, createHmac, scryptSync, timingSafeEqual } from 'crypto';

const BCRYPT_ROUNDS = 10;
const ACCESS_TOKEN_EXPIRY = '15m';
const TOKEN_EXPIRY = ACCESS_TOKEN_EXPIRY; // alias for backward compat
const REFRESH_TOKEN_EXPIRY_DAYS = 7;
const MAX_FAILED_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MINUTES = 15;
const DEFAULT_API_KEY_EXPIRY_DAYS = 90;
const MAX_API_KEY_EXPIRY_DAYS = 365;
const API_KEY_PREFIX = 'styx_live';

export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET; // allow-secret
  if (!secret) {
    throw new Error('JWT_SECRET must be set');
  }
  return secret;
}

export function getApiKeyPepper(): string {
  const pepper = process.env.STYX_API_KEY_PEPPER; // allow-secret
  if (!pepper) {
    throw new Error('STYX_API_KEY_PEPPER must be set');
  }
  return pepper;
}

// Constant-time placeholder hash compared against when no user exists, so that
// login latency does not reveal whether an email is registered (user enumeration).
// Exported so a unit test can assert it is a valid bcrypt hash that no password
// matches (AU6): a malformed hash makes bcrypt.compare return/throw immediately,
// re-introducing the timing oracle this dummy compare exists to remove.
export const DUMMY_BCRYPT_HASH = '$2a$10$CwTycUXWue0Thq9StjUM0uJ8DvHwz6T2x2vR5y6jHkn3vF3dWk3Iq'; // allow-secret

/**
 * Derives a CSRF token bound to a given session access token. Because the token
 * is an HMAC keyed by the JWT secret over the session token, only the server can
 * produce it and it is unique per session — defeating the unbound double-submit
 * weakness where any attacker-set cookie value would satisfy the check.
 */
export function deriveCsrfToken(sessionToken: string): string {
  return createHmac('sha256', getJwtSecret()).update(sessionToken).digest('hex');
}

export interface AuthPayload {
  sub: string;
  email: string;
  role?: string;
  token_type?: string;
  iat?: number;
  exp?: number;
}

export interface ApiKeyAuthPayload {
  sub: string;
  email: string;
  role: string;
  apiKeyId: string;
  apiKeyDbId: string;
}

export interface IssuedApiKey {
  id: string;
  keyId: string;
  name: string;
  prefix: string;
  apiKey: string;
  expiresAt: Date | null;
  createdAt: Date;
}

export interface ApiKeySummary {
  id: string;
  keyId: string;
  name: string;
  prefix: string;
  createdAt: Date;
  expiresAt: Date | null;
  lastUsedAt: Date | null;
  revokedAt: Date | null;
  status: 'active' | 'expired' | 'revoked';
}

export function parseApiKey(apiKey: string): { keyId: string; secret: string } | null { // allow-secret
  const match = /^styx_live_([a-f0-9]{24})_([A-Za-z0-9_-]+)$/.exec(apiKey);
  if (!match) {
    return null;
  }

  return { keyId: match[1], secret: match[2] }; // allow-secret
}

export function deriveApiKeyVerifier(secret: string): string { // allow-secret
  return scryptSync(secret, getApiKeyPepper(), 64, {
    N: 16_384,
    r: 8,
    p: 1,
  }).toString('hex');
}

function compareHashes(left: string, right: string): boolean {
  const leftBuf = Buffer.from(left, 'hex');
  const rightBuf = Buffer.from(right, 'hex');
  if (leftBuf.length !== rightBuf.length) {
    return false;
  }
  return timingSafeEqual(leftBuf, rightBuf);
}

@Injectable()
export class AuthService {
  constructor(
    private readonly pool: Pool,
    @Optional()
    @Inject(ReferralService)
    private readonly referralService?: ReferralService,
  ) {}

  async register(
    email: string,
    password: string, // allow-secret
    opts: { ageConfirmation: boolean; termsAccepted: boolean; dateOfBirth: string; referralCode?: string },
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
      if (!opts?.dateOfBirth) {
        throw new BadRequestException('Date of birth is required');
      }
      
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

      if (opts.referralCode && this.referralService) {
        this.referralService.attributeReferral(opts.referralCode, userId).catch((err: Error) => {
          console.error(`Failed to attribute referral: ${err.message}`);
        });
      }

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

  async login(email: string, password: string): Promise<{ userId: string; token: string; integrity: number }> { // allow-secret
    const result = await this.pool.query(
      'SELECT id, email, password_hash, status, integrity_score, role, failed_login_attempts, locked_until FROM users WHERE email = $1',
      [email],
    );

    if (result.rows.length === 0) {
      // Always run a bcrypt compare against a dummy hash so the response time
      // does not reveal whether the email is registered (user enumeration).
      await bcrypt.compare(password, DUMMY_BCRYPT_HASH);
      throw new UnauthorizedException('Invalid email or password');
    }

    const user = result.rows[0];

    // Check account lockout
    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      throw new UnauthorizedException('Account temporarily locked. Try again later.');
    }

    // Always perform a bcrypt compare (against a dummy hash if none is set) to
    // keep timing uniform across the missing-hash and wrong-password branches.
    const valid = await bcrypt.compare(password, user.password_hash || DUMMY_BCRYPT_HASH);

    if (!user.password_hash) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // AU2: validate the password (and run the failed-attempt UPDATE) BEFORE the
    // account-status check. Previously a non-ACTIVE account short-circuited here,
    // before the bcrypt-gated failed-login UPDATE that an ACTIVE+wrong-password
    // account performs, leaking a timing/enumeration oracle that distinguished
    // non-ACTIVE accounts. Performing the password branch first makes the work
    // identical regardless of account status, without weakening the blocked outcome.
    if (!valid) {
      // Atomically increment the failed-login counter and apply lockout in a
      // single UPDATE so concurrent failed attempts cannot lose increments.
      await this.pool.query(
        `UPDATE users
         SET failed_login_attempts = failed_login_attempts + 1,
             locked_until = CASE
               WHEN failed_login_attempts + 1 >= $2
               THEN NOW() + INTERVAL '${LOCKOUT_DURATION_MINUTES} minutes'
               ELSE locked_until
             END
         WHERE id = $1`,
        [user.id, MAX_FAILED_LOGIN_ATTEMPTS],
      );
      throw new UnauthorizedException('Invalid email or password');
    }

    // Password is correct: now enforce the account-status gate. A non-ACTIVE
    // account is still blocked, but only after the same bcrypt + UPDATE work path
    // as a wrong-password active account, so the timing does not differ.
    if (String(user.status || '').toUpperCase() !== 'ACTIVE') {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Successful login — reset lockout counters and track activity
    await this.pool.query(
      `UPDATE users SET failed_login_attempts = 0, locked_until = NULL, last_active_at = NOW() WHERE id = $1`,
      [user.id],
    );

    const token = this.signToken(user.id, user.email, user.role); // allow-secret
    return { userId: user.id, token, integrity: user.integrity_score };
  }

  private signToken(userId: string, email: string, role?: string): string {
    return jwt.sign({ sub: userId, email, role: role || 'USER' }, getJwtSecret(), { expiresIn: TOKEN_EXPIRY });
  }

  async exchangeEnterpriseToken(enterpriseToken: string): Promise<{ userId: string; token: string }> { // allow-secret
    // Verify the enterprise SSO assertion. The assertion is minted by the external
    // corporate IdP/portal and delivered to the app via the styx://enterprise/ deep
    // link (see mobile/services/EnterpriseSSO.ts), then POSTed to /auth/enterprise.
    //
    // SECURITY (AU3): the assertion MUST be cryptographically distinguishable from a
    // normal session token. The original vulnerability was that the assertion was
    // verified with the SAME JWT_SECRET as our own session tokens, so any session JWT
    // could be replayed here to impersonate an enterprise user.
    //
    // We require a DEDICATED enterprise IdP secret (ENTERPRISE_SSO_SECRET) and verify
    // the assertion against THAT key only. A token signed with JWT_SECRET then cannot
    // validate here at all — a clean cryptographic boundary. There is intentionally NO
    // fallback to JWT_SECRET: if the dedicated secret is not provisioned, enterprise
    // SSO is rejected outright rather than weakening to the shared session secret
    // (which anyone able to sign a session JWT could exploit to forge assertions).
    const enterpriseSecret = process.env.ENTERPRISE_SSO_SECRET; // allow-secret
    if (!enterpriseSecret) {
      throw new UnauthorizedException('Enterprise SSO is not configured');
    }
    let payload: AuthPayload;
    try {
      payload = jwt.verify(enterpriseToken, enterpriseSecret, { algorithms: ['HS256'] }) as AuthPayload;
    } catch (err) {
      if (err instanceof UnauthorizedException) {
        throw err;
      }
      throw new UnauthorizedException('Invalid enterprise token');
    }

    // Look up the user by enterprise association
    const result = await this.pool.query(
      'SELECT id, email, enterprise_id, status, role FROM users WHERE id = $1 AND enterprise_id IS NOT NULL',
      [payload.sub],
    );

    if (result.rows.length === 0) {
      throw new UnauthorizedException('No enterprise user found for this token');
    }

    const user = result.rows[0];
    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Enterprise user account is not active');
    }

    const token = this.signToken(user.id, user.email, user.role); // allow-secret
    return { userId: user.id, token };
  }

  verifyToken(token: string): AuthPayload { // allow-secret
    return jwt.verify(token, getJwtSecret(), { algorithms: ['HS256'] }) as AuthPayload;
  }

  /**
   * Verify a token's signature but ignore its expiry (AU10). Used by logout so an
   * expired-but-validly-signed access token still lets us identify the user and
   * revoke their (longer-lived) refresh tokens. The signature is still enforced, so
   * an attacker cannot pass an arbitrary token to revoke another user's sessions.
   */
  verifyTokenIgnoringExpiry(token: string): AuthPayload { // allow-secret
    return jwt.verify(token, getJwtSecret(), { algorithms: ['HS256'], ignoreExpiration: true }) as AuthPayload;
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
      `SELECT rt.id, rt.user_id, rt.expires_at, rt.revoked, u.email, u.status, u.role
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
    const accessToken = this.signToken(row.user_id, row.email, row.role); // allow-secret
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

  async issueApiKey(
    userId: string,
    opts: { name?: string; expiresInDays?: number } = {},
  ): Promise<IssuedApiKey> {
    const expiresInDays = opts.expiresInDays ?? DEFAULT_API_KEY_EXPIRY_DAYS;
    if (
      !Number.isInteger(expiresInDays) ||
      expiresInDays < 1 ||
      expiresInDays > MAX_API_KEY_EXPIRY_DAYS
    ) {
      throw new BadRequestException(
        `expiresInDays must be between 1 and ${MAX_API_KEY_EXPIRY_DAYS}`,
      );
    }

    const keyId = randomBytes(12).toString('hex');
    const secret = randomBytes(32).toString('base64url'); // allow-secret
    const apiKey = `${API_KEY_PREFIX}_${keyId}_${secret}`; // allow-secret
    const keyHash = deriveApiKeyVerifier(secret); // allow-secret
    const name = opts.name?.trim() || 'API key';
    const prefix = `${API_KEY_PREFIX}_${keyId}`;
    const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);

    const result = await this.pool.query(
      `INSERT INTO api_keys (user_id, key_id, key_hash, name, prefix, expires_at)
       SELECT id, $2, $3, $4, $5, $6
       FROM users
       WHERE id = $1 AND UPPER(status) = 'ACTIVE'
       RETURNING id, key_id, name, prefix, expires_at, created_at`,
      [userId, keyId, keyHash, name, prefix, expiresAt],
    );

    if (result.rows.length === 0) {
      throw new UnauthorizedException('User account is not active');
    }

    const row = result.rows[0];
    return {
      id: row.id,
      keyId: row.key_id,
      name: row.name,
      prefix: row.prefix,
      apiKey,
      expiresAt: row.expires_at,
      createdAt: row.created_at,
    };
  }

  async listApiKeys(userId: string): Promise<ApiKeySummary[]> {
    const result = await this.pool.query(
      `SELECT id, key_id, name, prefix, created_at, expires_at, last_used_at, revoked_at
       FROM api_keys
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId],
    );

    return result.rows.map((row) => {
      const revoked = !!row.revoked_at;
      const expired = !!row.expires_at && new Date(row.expires_at) < new Date();
      const status: ApiKeySummary['status'] = revoked
        ? 'revoked'
        : expired
          ? 'expired'
          : 'active';
      return {
        id: row.id,
        keyId: row.key_id,
        name: row.name,
        prefix: row.prefix,
        createdAt: row.created_at,
        expiresAt: row.expires_at,
        lastUsedAt: row.last_used_at,
        revokedAt: row.revoked_at,
        status,
      };
    });
  }

  async revokeApiKey(userId: string, keyId: string): Promise<{ revoked: boolean }> {
    const result = await this.pool.query(
      `UPDATE api_keys
       SET revoked_at = COALESCE(revoked_at, NOW())
       WHERE user_id = $1 AND key_id = $2
       RETURNING id`,
      [userId, keyId],
    );

    if (result.rows.length === 0) {
      throw new UnauthorizedException('API key not found');
    }

    return { revoked: true };
  }

  async verifyApiKey(apiKey: string): Promise<ApiKeyAuthPayload> { // allow-secret
    const parsed = parseApiKey(apiKey);
    if (!parsed) {
      throw new UnauthorizedException('Invalid API key');
    }

    const keyHash = deriveApiKeyVerifier(parsed.secret); // allow-secret
    const result = await this.pool.query(
      `SELECT ak.id, ak.user_id, ak.key_hash, ak.expires_at, ak.revoked_at,
              u.email, u.role, u.status
       FROM api_keys ak
       JOIN users u ON u.id = ak.user_id
       WHERE ak.key_id = $1`,
      [parsed.keyId],
    );

    if (result.rows.length === 0) {
      throw new UnauthorizedException('Invalid API key');
    }

    const row = result.rows[0];
    if (!compareHashes(row.key_hash, keyHash)) {
      throw new UnauthorizedException('Invalid API key');
    }

    if (row.revoked_at) {
      throw new UnauthorizedException('API key has been revoked');
    }

    if (row.expires_at && new Date(row.expires_at) < new Date()) {
      throw new UnauthorizedException('API key has expired');
    }

    if (String(row.status || '').toUpperCase() !== 'ACTIVE') {
      throw new UnauthorizedException('User account is not active');
    }

    await this.pool.query(
      `UPDATE api_keys SET last_used_at = NOW() WHERE id = $1`,
      [row.id],
    );

    return {
      sub: row.user_id,
      email: row.email,
      role: row.role || 'USER',
      apiKeyId: parsed.keyId,
      apiKeyDbId: row.id,
    };
  }
}
