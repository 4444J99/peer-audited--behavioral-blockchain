import { AuthService } from './auth.service';
import { BadRequestException, ConflictException, UnauthorizedException } from '@nestjs/common';
import { Pool } from 'pg';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';

const validRegisterOpts = { ageConfirmation: true, termsAccepted: true, dateOfBirth: '1990-01-01' };

const mockClient = {
  query: jest.fn(),
  release: jest.fn(),
};

const mockPool = {
  query: jest.fn(),
  connect: jest.fn().mockResolvedValue(mockClient),
} as unknown as Pool;

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    service = new AuthService(mockPool);
    (mockPool.query as jest.Mock).mockReset();
    (mockPool.connect as jest.Mock).mockReset();
    (mockClient.query as jest.Mock).mockReset();
    (mockClient.release as jest.Mock).mockReset();
    (mockPool.connect as jest.Mock).mockResolvedValue(mockClient);
  });

  describe('register', () => {
    it('should register a new user and return userId + token', async () => {
      const email = 'test@styx.protocol';
      const password = 'secure123'; // allow-secret

      // No existing user
      (mockClient.query as jest.Mock)
        .mockResolvedValueOnce(undefined) // BEGIN
        .mockResolvedValueOnce({ rows: [] }) // check existing
        .mockResolvedValueOnce({ rows: [{ id: 'account-uuid' }] }) // insert account
        .mockResolvedValueOnce({ rows: [{ id: 'user-uuid' }] }) // insert user
        .mockResolvedValueOnce(undefined); // COMMIT

      const result = await service.register(email, password, validRegisterOpts);

      expect(result.userId).toBe('user-uuid');
      expect(result.token).toBeDefined();
      expect(typeof result.token).toBe('string');

      // Verify the token is valid
      const decoded = jwt.decode(result.token) as { sub: string; email: string };
      expect(decoded.sub).toBe('user-uuid');
      expect(decoded.email).toBe(email);
    });

    it('should reject registration with duplicate email', async () => {
      (mockClient.query as jest.Mock)
        .mockResolvedValueOnce(undefined) // BEGIN
        .mockResolvedValueOnce({ rows: [{ id: 'existing-id' }] }) // check existing
        .mockResolvedValueOnce(undefined); // ROLLBACK

      await expect(service.register('taken@styx.protocol', 'pass123', validRegisterOpts))
        .rejects
        .toThrow(ConflictException);
    });

    it('should hash the password before storing', async () => {
      (mockClient.query as jest.Mock)
        .mockResolvedValueOnce(undefined) // BEGIN
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ id: 'account-uuid' }] })
        .mockResolvedValueOnce({ rows: [{ id: 'user-uuid' }] })
        .mockResolvedValueOnce(undefined); // COMMIT

      await service.register('hash-test@styx.protocol', 'plaintext-pass', validRegisterOpts);

      // The third query (insert user) should have a bcrypt hash, not plaintext
      const insertCall = (mockClient.query as jest.Mock).mock.calls[3];
      const storedHash = insertCall[1][1]; // password_hash parameter
      expect(storedHash).not.toBe('plaintext-pass');
      expect(storedHash.startsWith('$2b$10$')).toBe(true);
    });

    it('should reject registration with invalid dateOfBirth format', async () => {
      await expect(
        service.register('dob-test@styx.protocol', 'pass123', {
          ...validRegisterOpts,
          dateOfBirth: '2020-99-99',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should roll back account creation if user insert fails', async () => {
      (mockClient.query as jest.Mock)
        .mockResolvedValueOnce(undefined) // BEGIN
        .mockResolvedValueOnce({ rows: [] }) // existing user check
        .mockResolvedValueOnce({ rows: [{ id: 'account-uuid' }] }) // account insert
        .mockRejectedValueOnce(new Error('duplicate key value violates unique constraint users_email_key')) // user insert
        .mockResolvedValueOnce(undefined); // ROLLBACK

      await expect(service.register('race@styx.protocol', 'pass123', validRegisterOpts)).rejects.toThrow(
        'duplicate key value violates unique constraint users_email_key',
      );

      expect(mockClient.query).toHaveBeenNthCalledWith(1, 'BEGIN');
      expect(mockClient.query).toHaveBeenNthCalledWith(5, 'ROLLBACK');
      expect(mockClient.release).toHaveBeenCalled();
    });
  });

  describe('login', () => {
    const hashedPassword = bcrypt.hashSync('correct-password', 10);

    it('should return userId + token for valid credentials', async () => {
      (mockPool.query as jest.Mock).mockResolvedValueOnce({
        rows: [{ id: 'user-uuid', email: 'test@styx.protocol', password_hash: hashedPassword, status: 'ACTIVE', integrity_score: 50, failed_login_attempts: 0, locked_until: null }],
      });

      const result = await service.login('test@styx.protocol', 'correct-password');

      expect(result.userId).toBe('user-uuid');
      expect(result.token).toBeDefined();
      expect(result.integrity).toBe(50);
    });

    it('should reject login with wrong password', async () => {
      (mockPool.query as jest.Mock)
        .mockResolvedValueOnce({
          rows: [{ id: 'user-uuid', email: 'test@styx.protocol', password_hash: hashedPassword, status: 'ACTIVE', failed_login_attempts: 0, locked_until: null }],
        })
        .mockResolvedValueOnce(undefined); // UPDATE failed_login_attempts

      await expect(service.login('test@styx.protocol', 'wrong-password'))
        .rejects
        .toThrow(UnauthorizedException);
    });

    it('should reject login with unknown email', async () => {
      (mockPool.query as jest.Mock).mockResolvedValueOnce({ rows: [] });

      await expect(service.login('unknown@styx.protocol', 'any-password'))
        .rejects
        .toThrow(UnauthorizedException);
    });

    it('should reject login when user has no password hash', async () => {
      (mockPool.query as jest.Mock).mockResolvedValueOnce({
        rows: [{ id: 'user-uuid', email: 'test@styx.protocol', password_hash: null, status: 'ACTIVE', failed_login_attempts: 0, locked_until: null }],
      });

      await expect(service.login('test@styx.protocol', 'any-password'))
        .rejects
        .toThrow(UnauthorizedException);
    });

    it('should reject login when user account is inactive', async () => {
      (mockPool.query as jest.Mock)
        .mockResolvedValueOnce({
          rows: [{ id: 'user-uuid', email: 'test@styx.protocol', password_hash: hashedPassword, status: 'SUSPENDED', failed_login_attempts: 0, locked_until: null }],
        });

      await expect(service.login('test@styx.protocol', 'correct-password'))
        .rejects
        .toThrow(UnauthorizedException);
    });
  });

  describe('account lockout', () => {
    const hashedPw = bcrypt.hashSync('correct-password', 10);

    it('should lock account after 5 failed login attempts', async () => {
      (mockPool.query as jest.Mock)
        .mockResolvedValueOnce({
          rows: [{ id: 'lock-user', email: 'lock@styx.protocol', password_hash: hashedPw, status: 'ACTIVE', failed_login_attempts: 4, locked_until: null }],
        })
        .mockResolvedValueOnce(undefined); // UPDATE failed_login_attempts + locked_until

      await expect(service.login('lock@styx.protocol', 'wrong-password'))
        .rejects.toThrow(UnauthorizedException);

      // Verify the UPDATE query sets locked_until
      const updateCall = (mockPool.query as jest.Mock).mock.calls[1];
      expect(updateCall[1][0]).toBe(5); // attempts = 5
      expect(updateCall[0]).toContain('locked_until');
    });

    it('should reject login when account is locked', async () => {
      const futureDate = new Date(Date.now() + 15 * 60 * 1000).toISOString();
      (mockPool.query as jest.Mock).mockResolvedValueOnce({
        rows: [{ id: 'lock-user', email: 'lock@styx.protocol', password_hash: hashedPw, status: 'ACTIVE', failed_login_attempts: 5, locked_until: futureDate }],
      });

      await expect(service.login('lock@styx.protocol', 'correct-password'))
        .rejects.toThrow('Account temporarily locked. Try again later.');
    });

    it('should reset failed attempts on successful login', async () => {
      (mockPool.query as jest.Mock)
        .mockResolvedValueOnce({
          rows: [{ id: 'lock-user', email: 'lock@styx.protocol', password_hash: hashedPw, status: 'ACTIVE', failed_login_attempts: 3, locked_until: null }],
        })
        .mockResolvedValueOnce(undefined); // UPDATE reset

      const result = await service.login('lock@styx.protocol', 'correct-password');
      expect(result.userId).toBe('lock-user');

      const resetCall = (mockPool.query as jest.Mock).mock.calls[1];
      expect(resetCall[0]).toContain('failed_login_attempts = 0');
    });
  });

  describe('JWT signing/verification', () => {
    it('should sign and verify tokens correctly', () => {
      // signToken is private — use cast to access for testing
      const token = (service as any).signToken('user-123', 'test@styx.protocol'); // allow-secret
      const payload = service.verifyToken(token);

      expect(payload.sub).toBe('user-123');
      expect(payload.email).toBe('test@styx.protocol');
    });

    it('should reject tampered tokens', () => {
      const token = (service as any).signToken('user-123', 'test@styx.protocol'); // allow-secret
      const tampered = token + 'x'; // allow-secret

      expect(() => service.verifyToken(tampered)).toThrow();
    });
  });

  describe('refresh tokens', () => {
    it('should generate a refresh token and store its hash', async () => {
      (mockPool.query as jest.Mock).mockResolvedValueOnce(undefined); // INSERT

      const token = await service.generateRefreshToken('user-123'); // allow-secret

      expect(typeof token).toBe('string');
      expect(token.length).toBe(64); // 32 bytes hex
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO refresh_tokens'),
        expect.arrayContaining(['user-123']),
      );
    });

    it('should refresh an access token and rotate the refresh token', async () => {
      const crypto = require('crypto');
      const rawToken = crypto.randomBytes(32).toString('hex'); // allow-secret
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

      // Look up refresh token
      (mockPool.query as jest.Mock).mockResolvedValueOnce({
        rows: [{
          id: 'rt-1',
          user_id: 'user-123',
          expires_at: new Date(Date.now() + 86400000).toISOString(),
          revoked: false,
          email: 'test@styx.protocol',
          status: 'ACTIVE',
        }],
      });
      // Revoke old token
      (mockPool.query as jest.Mock).mockResolvedValueOnce(undefined);
      // Generate new refresh token (INSERT)
      (mockPool.query as jest.Mock).mockResolvedValueOnce(undefined);

      const result = await service.refreshAccessToken(rawToken);

      expect(result.userId).toBe('user-123');
      expect(result.token).toBeDefined();
      expect(result.refreshToken).toBeDefined();
    });

    it('should reject a revoked refresh token', async () => {
      const crypto = require('crypto');
      const rawToken = crypto.randomBytes(32).toString('hex'); // allow-secret

      (mockPool.query as jest.Mock).mockResolvedValueOnce({
        rows: [{
          id: 'rt-1',
          user_id: 'user-123',
          expires_at: new Date(Date.now() + 86400000).toISOString(),
          revoked: true,
          email: 'test@styx.protocol',
          status: 'ACTIVE',
        }],
      });

      await expect(service.refreshAccessToken(rawToken))
        .rejects.toThrow('Refresh token has been revoked');
    });

    it('should revoke all refresh tokens for a user', async () => {
      (mockPool.query as jest.Mock).mockResolvedValueOnce(undefined);

      await service.revokeRefreshTokensForUser('user-123');

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE refresh_tokens SET revoked = TRUE'),
        ['user-123'],
      );
    });
  });
});
