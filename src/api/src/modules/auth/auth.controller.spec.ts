import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { RegisterDto, LoginDto } from './dto';

const mockAuthService = {
  register: jest.fn(),
  login: jest.fn(),
  exchangeEnterpriseToken: jest.fn(),
  generateRefreshToken: jest.fn().mockResolvedValue('mock-refresh-token'), // allow-secret
  revokeRefreshTokensForUser: jest.fn().mockResolvedValue(undefined),
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
          email: 'test@styx.protocol',
          password: 'secure123', // allow-secret
          ageConfirmation: true,
          termsAccepted: true,
        }),
        mockResponse,
      );

      expect(result.userId).toBe('new-user-id');
      expect(result.token).toBe('jwt-token');
      expect(mockAuthService.register).toHaveBeenCalledWith('test@styx.protocol', 'secure123', { // allow-secret
        ageConfirmation: true,
        termsAccepted: true,
        dateOfBirth: undefined,
      });
    });

    it('should reject missing email via DTO validation', async () => {
      const dto = plainToInstance(RegisterDto, { email: '', password: 'secure123' }); // allow-secret
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.property === 'email')).toBe(true);
    });

    it('should reject missing password via DTO validation', async () => {
      const dto = plainToInstance(RegisterDto, { email: 'test@styx.protocol', password: '' });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.property === 'password')).toBe(true);
    });

    it('should reject short password via DTO validation', async () => {
      const dto = plainToInstance(RegisterDto, { email: 'test@styx.protocol', password: '12345' }); // allow-secret
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
          email: 'test@styx.protocol',
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
      const dto = plainToInstance(LoginDto, { email: 'test@styx.protocol', password: '' });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.property === 'password')).toBe(true);
    });
  });
});
