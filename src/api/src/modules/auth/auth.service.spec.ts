import { AuthService } from './auth.service';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';

const mockPool = {
  query: jest.fn(),
} as unknown as Pool;

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    service = new AuthService(mockPool);
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user and return userId + token', async () => {
      const email = 'test@styx.protocol';
      const password = 'secure123'; // allow-secret

      // No existing user
      (mockPool.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [] }) // check existing
        .mockResolvedValueOnce({ rows: [{ id: 'account-uuid' }] }) // insert account
        .mockResolvedValueOnce({ rows: [{ id: 'user-uuid' }] }); // insert user

      const result = await service.register(email, password);

      expect(result.userId).toBe('user-uuid');
      expect(result.token).toBeDefined();
      expect(typeof result.token).toBe('string');

      // Verify the token is valid
      const decoded = jwt.decode(result.token) as { sub: string; email: string };
      expect(decoded.sub).toBe('user-uuid');
      expect(decoded.email).toBe(email);
    });

    it('should reject registration with duplicate email', async () => {
      (mockPool.query as jest.Mock).mockResolvedValueOnce({ rows: [{ id: 'existing-id' }] });

      await expect(service.register('taken@styx.protocol', 'pass123'))
        .rejects
        .toThrow(ConflictException);
    });

    it('should hash the password before storing', async () => {
      (mockPool.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ id: 'account-uuid' }] })
        .mockResolvedValueOnce({ rows: [{ id: 'user-uuid' }] });

      await service.register('hash-test@styx.protocol', 'plaintext-pass');

      // The third query (insert user) should have a bcrypt hash, not plaintext
      const insertCall = (mockPool.query as jest.Mock).mock.calls[2];
      const storedHash = insertCall[1][1]; // password_hash parameter
      expect(storedHash).not.toBe('plaintext-pass');
      expect(storedHash.startsWith('$2b$10$')).toBe(true);
    });
  });

  describe('login', () => {
    const hashedPassword = bcrypt.hashSync('correct-password', 10);

    it('should return userId + token for valid credentials', async () => {
      (mockPool.query as jest.Mock).mockResolvedValueOnce({
        rows: [{ id: 'user-uuid', email: 'test@styx.protocol', password_hash: hashedPassword, status: 'ACTIVE' }],
      });

      const result = await service.login('test@styx.protocol', 'correct-password');

      expect(result.userId).toBe('user-uuid');
      expect(result.token).toBeDefined();
    });

    it('should reject login with wrong password', async () => {
      (mockPool.query as jest.Mock).mockResolvedValueOnce({
        rows: [{ id: 'user-uuid', email: 'test@styx.protocol', password_hash: hashedPassword, status: 'ACTIVE' }],
      });

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
        rows: [{ id: 'user-uuid', email: 'test@styx.protocol', password_hash: null, status: 'ACTIVE' }],
      });

      await expect(service.login('test@styx.protocol', 'any-password'))
        .rejects
        .toThrow(UnauthorizedException);
    });
  });

  describe('JWT signing/verification', () => {
    it('should sign and verify tokens correctly', () => {
      const token = service.signToken('user-123', 'test@styx.protocol'); // allow-secret
      const payload = service.verifyToken(token);

      expect(payload.sub).toBe('user-123');
      expect(payload.email).toBe('test@styx.protocol');
    });

    it('should reject tampered tokens', () => {
      const token = service.signToken('user-123', 'test@styx.protocol'); // allow-secret
      const tampered = token + 'x'; // allow-secret

      expect(() => service.verifyToken(tampered)).toThrow();
    });
  });
});
