import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { RegisterDto, LoginDto, CreateApiKeyDto } from './dto';

const mockAuthService = {
  register: jest.fn(),
  login: jest.fn(),
  exchangeEnterpriseToken: jest.fn(),
  generateRefreshToken: jest.fn().mockResolvedValue('mock-refresh-token'), // allow-secret
  revokeRefreshTokensForUser: jest.fn().mockResolvedValue(undefined),
  verifyToken: jest.fn(),
  verifyTokenIgnoringExpiry: jest.fn(),
  issueApiKey: jest.fn(),
  listApiKeys: jest.fn(),
  revokeApiKey: jest.fn(),
} as unknown as AuthService;

describe('AuthController', () => {
  let controller: AuthController;
  let mockResponse: any;

  beforeEach(() => {
    controller = new AuthController(mockAuthService);
    mockResponse = {
      cookie: jest.fn(),
      clearCookie: jest.fn(),
    };
    jest.clearAllMocks();
  });

  describe('POST /auth/register', () => {
    it('should call authService.register with valid input', async () => {
      (mockAuthService.register as jest.Mock).mockResolvedValue({
        userId: 'new-user-id',
        token: 'jwt-token', // allow-secret
      });

      const result = await controller.register(
        plainToInstance(RegisterDto, {
          email: '[email redacted]',
          password: 'secure123', // allow-secret
          ageConfirmation: true,
          termsAccepted: true,
        }),
        mockResponse,
      );

      expect(result.userId).toBe('new-user-id');
      expect(result.token).toBe('jwt-token');
      expect(mockAuthService.register).toHaveBeenCalledWith('[email redacted]', 'secure123', { // allow-secret
        ageConfirmation: true,
        termsAccepted: true,
        dateOfBirth: '',
      });
    });

    it('should reject missing email via DTO validation', async () => {
      const dto = plainToInstance(RegisterDto, { email: '', password: 'secure123' }); // allow-secret
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.property === 'email')).toBe(true);
    });

    it('should reject missing password via DTO validation', async () => {
      const dto = plainToInstance(RegisterDto, { email: '[email redacted]', password: '' });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.property === 'password')).toBe(true);
    });

    it('should reject short password via DTO validation', async () => {
      const dto = plainToInstance(RegisterDto, { email: '[email redacted]', password: '12345' }); // allow-secret
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.property === 'password')).toBe(true);
    });
  });

  describe('POST /auth/login', () => {
    it('should call authService.login with valid input', async () => {
      (mockAuthService.login as jest.Mock).mockResolvedValue({
        userId: 'user-id',
        token: 'jwt-token', // allow-secret
      });

      const result = await controller.login(
        plainToInstance(LoginDto, {
          email: '[email redacted]',
          password: 'secure123', // allow-secret
        }),
        mockResponse,
      );

      expect(result.userId).toBe('user-id');
      expect(result.token).toBe('jwt-token'); // allow-secret
    });

    it('should reject missing email via DTO validation', async () => {
      const dto = plainToInstance(LoginDto, { email: '', password: 'secure123' }); // allow-secret
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.property === 'email')).toBe(true);
    });

    it('should reject missing password via DTO validation', async () => {
      const dto = plainToInstance(LoginDto, { email: '[email redacted]', password: '' });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.property === 'password')).toBe(true);
    });

    it('AU13: should accept a short (legacy) password at login without re-imposing register policy', async () => {
      // A pre-existing account may have a stored password shorter than the current
      // registration complexity policy; login must not lock it out at the DTO layer.
      const dto = plainToInstance(LoginDto, { email: '[email redacted]', password: 'short' }); // allow-secret
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'password')).toBe(false);
    });
  });

  describe('POST /auth/logout (AU10)', () => {
    const makeReq = (cookie?: string) => ({ headers: cookie ? { cookie } : {} }) as any;

    it('revokes refresh tokens even when the access token is expired (verified ignoring expiry)', async () => {
      (mockAuthService.verifyTokenIgnoringExpiry as jest.Mock).mockReturnValue({ sub: 'user-9' });

      const result = await controller.logout(
        makeReq('styx_auth_token=expired.jwt.token'),
        mockResponse,
      );

      expect(mockAuthService.verifyTokenIgnoringExpiry).toHaveBeenCalledWith('expired.jwt.token');
      expect(mockAuthService.revokeRefreshTokensForUser).toHaveBeenCalledWith('user-9');
      expect(mockResponse.clearCookie).toHaveBeenCalled();
      expect(result).toEqual({ status: 'logged_out' });
    });

    it('still clears cookies when the token signature is invalid', async () => {
      (mockAuthService.verifyTokenIgnoringExpiry as jest.Mock).mockImplementation(() => {
        throw new Error('invalid signature');
      });

      const result = await controller.logout(
        makeReq('styx_auth_token=tampered'),
        mockResponse,
      );

      expect(mockAuthService.revokeRefreshTokensForUser).not.toHaveBeenCalled();
      expect(mockResponse.clearCookie).toHaveBeenCalled();
      expect(result).toEqual({ status: 'logged_out' });
    });
  });

  describe('API key endpoints', () => {
    it('should issue an API key for the authenticated user', async () => {
      (mockAuthService.issueApiKey as jest.Mock).mockResolvedValue({
        id: 'api-key-id',
        keyId: 'a'.repeat(24),
        name: 'automation',
        prefix: `styx_live_${'a'.repeat(24)}`,
        apiKey: `styx_live_${'a'.repeat(24)}_secret`, // allow-secret
        expiresAt: new Date(),
        createdAt: new Date(),
      });

      const result = await controller.createApiKey(
        { id: 'user-123' },
        plainToInstance(CreateApiKeyDto, {
          name: 'automation',
          expiresInDays: 90,
        }),
        { authSource: 'bearer' } as any,
      );

      expect(mockAuthService.issueApiKey).toHaveBeenCalledWith('user-123', {
        name: 'automation',
        expiresInDays: 90,
      });
      expect(result.apiKey).toContain('styx_live_');
    });

    it('should reject API-key authentication when issuing a new API key', async () => {
      await expect(
        controller.createApiKey(
          { id: 'user-123' },
          plainToInstance(CreateApiKeyDto, { name: 'automation' }),
          { authSource: 'api_key' } as any,
        ),
      ).rejects.toThrow('API key issuance requires session authentication');

      expect(mockAuthService.issueApiKey).not.toHaveBeenCalled();
    });

    it('should list API key metadata for the authenticated user', async () => {
      (mockAuthService.listApiKeys as jest.Mock).mockResolvedValue([
        {
          id: 'api-key-id',
          keyId: 'b'.repeat(24),
          name: 'automation',
          prefix: `styx_live_${'b'.repeat(24)}`,
          status: 'active',
        },
      ]);

      const result = await controller.listApiKeys({ id: 'user-123' });

      expect(mockAuthService.listApiKeys).toHaveBeenCalledWith('user-123');
      expect(result[0]).not.toHaveProperty('apiKey');
    });

    it('should revoke an API key for the authenticated user', async () => {
      (mockAuthService.revokeApiKey as jest.Mock).mockResolvedValue({ revoked: true });

      await expect(
        controller.revokeApiKey({ id: 'user-123' }, 'c'.repeat(24)),
      ).resolves.toEqual({ revoked: true });

      expect(mockAuthService.revokeApiKey).toHaveBeenCalledWith('user-123', 'c'.repeat(24));
    });

    it('should reject invalid API key expiry via DTO validation', async () => {
      const dto = plainToInstance(CreateApiKeyDto, {
        name: 'automation',
        expiresInDays: 366,
      });

      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'expiresInDays')).toBe(true);
    });
  });
});
