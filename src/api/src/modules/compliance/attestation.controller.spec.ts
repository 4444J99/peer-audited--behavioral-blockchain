import { BadRequestException } from '@nestjs/common';
import { AttestationController } from './attestation.controller';
import { DeviceAttestationService } from '../../../services/security/device-attestation.service';

describe('AttestationController', () => {
  let controller: AttestationController;

  const mockDeviceAttestation = {
    registerIosAttestedKey: jest.fn(),
    verifyiOSAttestation: jest.fn(),
    verifyAndroidAttestation: jest.fn(),
    revokeKey: jest.fn(),
  } as unknown as DeviceAttestationService;

  const user = { id: 'user-1', email: 'u@styx.app', role: 'USER' };

  beforeEach(() => {
    controller = new AttestationController(mockDeviceAttestation);
    jest.clearAllMocks();
  });

  describe('registerIosKey', () => {
    it('delegates to registerIosAttestedKey with the authenticated user id', async () => {
      const body = {
        keyId: 'a'.repeat(44),
        attestationObject: 'b64-cbor',
        challenge: 'challenge-1',
      };
      const expected = { verified: true, platform: 'ios', deviceIntegrity: 'STRONG', riskFlags: [] };
      (mockDeviceAttestation.registerIosAttestedKey as jest.Mock).mockResolvedValue(expected);

      const result = await controller.registerIosKey(user, body);

      expect(result).toEqual(expected);
      expect(mockDeviceAttestation.registerIosAttestedKey).toHaveBeenCalledWith('user-1', body);
    });

    it('propagates service rejections (verified:false results pass through unchanged)', async () => {
      const expected = {
        verified: false,
        platform: 'ios',
        deviceIntegrity: 'NONE',
        reason: 'Certificate chain invalid: signature verification failed',
        riskFlags: ['invalid_certificate_chain'],
      };
      (mockDeviceAttestation.registerIosAttestedKey as jest.Mock).mockResolvedValue(expected);

      const result = await controller.registerIosKey(user, {
        keyId: 'k',
        attestationObject: 'x',
        challenge: 'c',
      });

      expect(result).toEqual(expected);
    });

    it('propagates BadRequestException from the service', async () => {
      (mockDeviceAttestation.registerIosAttestedKey as jest.Mock).mockRejectedValue(
        new BadRequestException('Incomplete App Attest registration'),
      );

      await expect(
        controller.registerIosKey(user, { keyId: '', attestationObject: '', challenge: '' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('verifyIosAssertion', () => {
    it('delegates to verifyiOSAttestation with the authenticated user id', async () => {
      const body = {
        keyId: 'key-1',
        authenticatorData: 'auth-data',
        clientDataJSON: 'client-data',
        signature: 'sig',
      };
      const expected = { verified: true, platform: 'ios', deviceIntegrity: 'STRONG', riskFlags: [] };
      (mockDeviceAttestation.verifyiOSAttestation as jest.Mock).mockResolvedValue(expected);

      const result = await controller.verifyIosAssertion(user, body);

      expect(result).toEqual(expected);
      expect(mockDeviceAttestation.verifyiOSAttestation).toHaveBeenCalledWith('user-1', body);
    });
  });

  describe('verifyAndroidVerdict', () => {
    it('delegates to verifyAndroidAttestation with the authenticated user id', async () => {
      const body = { tokenResult: 'h.p.s', requestPackageName: 'com.styx.app' };
      const expected = {
        verified: true,
        platform: 'android',
        deviceIntegrity: 'STRONG',
        riskFlags: [],
      };
      (mockDeviceAttestation.verifyAndroidAttestation as jest.Mock).mockResolvedValue(expected);

      const result = await controller.verifyAndroidVerdict(user, body);

      expect(result).toEqual(expected);
      expect(mockDeviceAttestation.verifyAndroidAttestation).toHaveBeenCalledWith('user-1', body);
    });
  });

  describe('revokeKey', () => {
    it('revokes the key for the authenticated user', async () => {
      (mockDeviceAttestation.revokeKey as jest.Mock).mockResolvedValue(undefined);

      const result = await controller.revokeKey(user, { keyId: 'key-abc' });

      expect(result).toEqual({ revoked: true, keyId: 'key-abc' });
      expect(mockDeviceAttestation.revokeKey).toHaveBeenCalledWith('user-1', 'key-abc');
    });

    it('throws BadRequestException when keyId is missing', async () => {
      await expect(controller.revokeKey(user, { keyId: '' })).rejects.toThrow(BadRequestException);
      expect(mockDeviceAttestation.revokeKey).not.toHaveBeenCalled();
    });
  });
});
