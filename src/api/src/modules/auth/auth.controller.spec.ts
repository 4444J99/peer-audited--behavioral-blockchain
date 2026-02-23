import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { BadRequestException } from '@nestjs/common';

const mockAuthService = {
  register: jest.fn(),
  login: jest.fn(),
} as unknown as AuthService;

describe('AuthController', () => {
  let controller: AuthController;

  beforeEach(() => {
    controller = new AuthController(mockAuthService);
    jest.clearAllMocks();
  });

  describe('POST /auth/register', () => {
    it('should call authService.register with valid input', async () => {
      (mockAuthService.register as jest.Mock).mockResolvedValue({
        userId: 'new-user-id',
        token: 'jwt-token', // allow-secret
      });

      const result = await controller.register({
        email: 'test@styx.protocol',
        password: 'secure123', // allow-secret
      });

      expect(result.userId).toBe('new-user-id');
      expect(result.token).toBe('jwt-token');
      expect(mockAuthService.register).toHaveBeenCalledWith('test@styx.protocol', 'secure123'); // allow-secret
    });

    it('should reject missing email', async () => {
      await expect(
        controller.register({ email: '', password: 'secure123' }), // allow-secret
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject missing password', async () => {
      await expect(
        controller.register({ email: 'test@styx.protocol', password: '' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject short password', async () => {
      await expect(
        controller.register({ email: 'test@styx.protocol', password: '12345' }), // allow-secret
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('POST /auth/login', () => {
    it('should call authService.login with valid input', async () => {
      (mockAuthService.login as jest.Mock).mockResolvedValue({
        userId: 'user-id',
        token: 'jwt-token', // allow-secret
      });

      const result = await controller.login({
        email: 'test@styx.protocol',
        password: 'secure123', // allow-secret
      });

      expect(result.userId).toBe('user-id');
      expect(result.token).toBe('jwt-token'); // allow-secret
    });

    it('should reject missing email', async () => {
      await expect(
        controller.login({ email: '', password: 'secure123' }), // allow-secret
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject missing password', async () => {
      await expect(
        controller.login({ email: 'test@styx.protocol', password: '' }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
