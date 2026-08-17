import 'reflect-metadata';
import { BadRequestException } from '@nestjs/common';
import { SecurityController } from './security.controller';
import { AntiSybilService } from './anti-sybil.service';
import { ROLES_KEY } from '../../common/guards/role.guard';

describe('SecurityController', () => {
  let controller: SecurityController;

  const mockAntiSybil = {
    registerDeviceFingerprint: jest.fn(),
    appealSharedDevice: jest.fn(),
    analyzeUser: jest.fn(),
    recordSignal: jest.fn(),
    getSignalHistory: jest.fn(),
    detectSharedDevice: jest.fn(),
    detectSharedPayment: jest.fn(),
    detectSharedIP: jest.fn(),
  } as unknown as AntiSybilService;

  const user = { id: 'user-1', email: 'u@example.com', role: 'USER' };

  beforeEach(() => {
    controller = new SecurityController(mockAntiSybil);
    jest.clearAllMocks();
  });

  describe('registerDeviceFingerprint', () => {
    it('registers a fingerprint for the authenticated user', async () => {
      (mockAntiSybil.registerDeviceFingerprint as jest.Mock).mockResolvedValue(
        undefined,
      );

      const result = await controller.registerDeviceFingerprint(user, {
        platform: 'ios',
        rawVendorId: 'VENDOR-123',
      });

      expect(result).toEqual({ registered: true });
      expect(mockAntiSybil.registerDeviceFingerprint).toHaveBeenCalledWith(
        'user-1',
        { hash: '', platform: 'ios', rawVendorId: 'VENDOR-123' },
      );
    });

    it('accepts a pre-hashed fingerprint without a vendor id', async () => {
      await controller.registerDeviceFingerprint(user, {
        hash: 'abc123',
        platform: 'web',
      });

      expect(mockAntiSybil.registerDeviceFingerprint).toHaveBeenCalledWith(
        'user-1',
        { hash: 'abc123', platform: 'web', rawVendorId: undefined },
      );
    });

    it('rejects an unknown platform', async () => {
      await expect(
        controller.registerDeviceFingerprint(user, {
          hash: 'abc',
          platform: 'windows' as any,
        }),
      ).rejects.toThrow(BadRequestException);
      expect(mockAntiSybil.registerDeviceFingerprint).not.toHaveBeenCalled();
    });

    it('rejects when neither hash nor rawVendorId is provided', async () => {
      await expect(
        controller.registerDeviceFingerprint(user, { platform: 'android' }),
      ).rejects.toThrow(BadRequestException);
      expect(mockAntiSybil.registerDeviceFingerprint).not.toHaveBeenCalled();
    });
  });

  describe('appealSharedDevice', () => {
    it('delegates the appeal for the authenticated user', async () => {
      const expected = { accepted: true, message: 'ok' };
      (mockAntiSybil.appealSharedDevice as jest.Mock).mockResolvedValue(
        expected,
      );

      const result = await controller.appealSharedDevice(user, {
        relatedUserId: 'user-2',
        reason: 'family iPad',
      });

      expect(result).toEqual(expected);
      expect(mockAntiSybil.appealSharedDevice).toHaveBeenCalledWith(
        'user-1',
        'user-2',
        'family iPad',
      );
    });

    it('rejects a missing relatedUserId or reason', async () => {
      await expect(
        controller.appealSharedDevice(user, {
          relatedUserId: '',
          reason: 'family',
        }),
      ).rejects.toThrow(BadRequestException);
      await expect(
        controller.appealSharedDevice(user, {
          relatedUserId: 'user-2',
          reason: '',
        }),
      ).rejects.toThrow(BadRequestException);
      expect(mockAntiSybil.appealSharedDevice).not.toHaveBeenCalled();
    });
  });

  describe('analyzeUser', () => {
    it('returns the sybil verdict for a user', async () => {
      const verdict = {
        userId: 'user-9',
        riskScore: 70,
        signals: [],
        enforcementAction: 'BAN',
        duplicateCount: 2,
      };
      (mockAntiSybil.analyzeUser as jest.Mock).mockResolvedValue(verdict);

      const result = await controller.analyzeUser('user-9');
      expect(result).toEqual(verdict);
      expect(mockAntiSybil.analyzeUser).toHaveBeenCalledWith('user-9');
    });
  });

  describe('enforce', () => {
    it('persists every detected signal and returns the verdict with recorded signals', async () => {
      const detected = [
        {
          id: '',
          userId: 'user-9',
          signalType: 'SHARED_DEVICE',
          relatedUserId: 'user-2',
          confidence: 30,
          detectedAt: new Date(),
        },
        {
          id: '',
          userId: 'user-9',
          signalType: 'SHARED_PAYMENT',
          relatedUserId: 'user-3',
          confidence: 40,
          detectedAt: new Date(),
        },
      ];
      (mockAntiSybil.analyzeUser as jest.Mock).mockResolvedValue({
        userId: 'user-9',
        riskScore: 70,
        signals: detected,
        enforcementAction: 'BAN',
        duplicateCount: 2,
      });
      (mockAntiSybil.recordSignal as jest.Mock).mockImplementation(
        async (signal: any) => ({ ...signal, id: `id-${signal.relatedUserId}`, detectedAt: new Date() }),
      );

      const result = await controller.enforce('user-9');

      expect(mockAntiSybil.recordSignal).toHaveBeenCalledTimes(2);
      expect(mockAntiSybil.recordSignal).toHaveBeenCalledWith({
        userId: 'user-9',
        signalType: 'SHARED_DEVICE',
        relatedUserId: 'user-2',
        confidence: 30,
      });
      expect(result.enforcementAction).toBe('BAN');
      expect(result.signals.map((s: any) => s.id)).toEqual([
        'id-user-2',
        'id-user-3',
      ]);
    });

    it('records nothing for a clean user', async () => {
      (mockAntiSybil.analyzeUser as jest.Mock).mockResolvedValue({
        userId: 'user-clean',
        riskScore: 0,
        signals: [],
        enforcementAction: 'NONE',
        duplicateCount: 0,
      });

      const result = await controller.enforce('user-clean');
      expect(mockAntiSybil.recordSignal).not.toHaveBeenCalled();
      expect(result.enforcementAction).toBe('NONE');
    });
  });

  describe('getSignalHistory', () => {
    it('delegates to the service', async () => {
      const signals = [{ id: 's1', signalType: 'SHARED_IP' }];
      (mockAntiSybil.getSignalHistory as jest.Mock).mockResolvedValue(signals);

      const result = await controller.getSignalHistory('user-9');
      expect(result).toEqual(signals);
      expect(mockAntiSybil.getSignalHistory).toHaveBeenCalledWith('user-9');
    });
  });

  describe('recordSignal', () => {
    const validBody = {
      userId: 'user-1',
      signalType: 'SHARED_PHONE' as const,
      relatedUserId: 'user-2',
      confidence: 35,
    };

    it('records a valid manual signal', async () => {
      const expected = { ...validBody, id: 'sig-1', detectedAt: new Date() };
      (mockAntiSybil.recordSignal as jest.Mock).mockResolvedValue(expected);

      const result = await controller.recordSignal(validBody);
      expect(result).toEqual(expected);
      expect(mockAntiSybil.recordSignal).toHaveBeenCalledWith(validBody);
    });

    it('rejects an invalid signalType', async () => {
      await expect(
        controller.recordSignal({ ...validBody, signalType: 'BOGUS' as any }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects an out-of-range confidence', async () => {
      await expect(
        controller.recordSignal({ ...validBody, confidence: 101 }),
      ).rejects.toThrow(BadRequestException);
      await expect(
        controller.recordSignal({ ...validBody, confidence: NaN }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects missing user ids', async () => {
      await expect(
        controller.recordSignal({ ...validBody, userId: '' }),
      ).rejects.toThrow(BadRequestException);
      await expect(
        controller.recordSignal({ ...validBody, relatedUserId: '' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('lookupDevice', () => {
    it('returns users sharing a device hash', async () => {
      (mockAntiSybil.detectSharedDevice as jest.Mock).mockResolvedValue([
        'user-1',
        'user-2',
      ]);

      const result = await controller.lookupDevice('hash-abc');
      expect(result).toEqual({
        deviceHash: 'hash-abc',
        userIds: ['user-1', 'user-2'],
      });
    });
  });

  describe('sharedPayment', () => {
    it('returns users sharing a payment method', async () => {
      (mockAntiSybil.detectSharedPayment as jest.Mock).mockResolvedValue([
        'user-2',
      ]);

      const result = await controller.sharedPayment('user-1');
      expect(result).toEqual({ userId: 'user-1', userIds: ['user-2'] });
    });
  });

  describe('sharedIp', () => {
    it('returns users sharing an IP', async () => {
      (mockAntiSybil.detectSharedIP as jest.Mock).mockResolvedValue(['user-3']);

      const result = await controller.sharedIp('user-1', '1.2.3.4');
      expect(result).toEqual({
        userId: 'user-1',
        ip: '1.2.3.4',
        userIds: ['user-3'],
      });
      expect(mockAntiSybil.detectSharedIP).toHaveBeenCalledWith(
        'user-1',
        '1.2.3.4',
      );
    });

    it('rejects when the ip query parameter is missing', async () => {
      await expect(controller.sharedIp('user-1', undefined)).rejects.toThrow(
        BadRequestException,
      );
      expect(mockAntiSybil.detectSharedIP).not.toHaveBeenCalled();
    });
  });

  describe('role metadata', () => {
    // Guards themselves are unit-tested elsewhere; here we pin the intelligence
    // routes to ADMIN so a refactor cannot silently drop the restriction.
    const adminHandlers = [
      'analyzeUser',
      'enforce',
      'getSignalHistory',
      'recordSignal',
      'lookupDevice',
      'sharedPayment',
      'sharedIp',
    ] as const;

    it.each(adminHandlers)('%s requires the ADMIN role', (handler) => {
      const roles = Reflect.getMetadata(
        ROLES_KEY,
        SecurityController.prototype[handler],
      );
      expect(roles).toEqual(['ADMIN']);
    });

    it('leaves self-service routes without a role restriction', () => {
      expect(
        Reflect.getMetadata(
          ROLES_KEY,
          SecurityController.prototype.registerDeviceFingerprint,
        ),
      ).toBeUndefined();
      expect(
        Reflect.getMetadata(
          ROLES_KEY,
          SecurityController.prototype.appealSharedDevice,
        ),
      ).toBeUndefined();
    });
  });
});
