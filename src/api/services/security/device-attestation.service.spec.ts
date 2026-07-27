import { Pool } from 'pg';
import { BadRequestException } from '@nestjs/common';
import { DeviceAttestationService } from './device-attestation.service';

describe('DeviceAttestationService', () => {
  let service: DeviceAttestationService;
  let pool: jest.Mocked<Pool>;
  let truthLog: { appendEvent: jest.Mock };

  beforeEach(() => {
    pool = { query: jest.fn() } as any;
    truthLog = { appendEvent: jest.fn().mockResolvedValue(undefined) };
    service = new DeviceAttestationService(pool, truthLog as any);
  });

  describe('verifyiOSAttestation', () => {
    const baseAssertion = {
      authenticatorData: Buffer.alloc(37).toString('base64'), // 37 bytes: 32 rpIdHash + 1 flags + 4 counter
      clientDataJSON: Buffer.from(JSON.stringify({ type: 'webauthn.get' })).toString('base64'),
      keyId: 'test-key-id',
    };

    it('returns NONE when key not registered', async () => {
      pool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

      const result = await service.verifyiOSAttestation('user-1', baseAssertion);

      expect(result.verified).toBe(false);
      expect(result.deviceIntegrity).toBe('NONE');
      expect(result.riskFlags).toContain('unknown_key');
    });

    it('detects counter replay', async () => {
      pool.query
        // Key lookup
        .mockResolvedValueOnce({
          rows: [{ id: 'key-1', public_key: 'pub', sign_count: 10, device_info: {} }],
          rowCount: 1,
        } as any)
        // Update sign count
        .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

      // authenticatorData with counter = 5 (less than stored 10)
      const authData = Buffer.alloc(37);
      authData[32] = 0x01; // flags: user present
      authData.writeUInt32BE(5, 33); // counter = 5

      const result = await service.verifyiOSAttestation('user-1', {
        ...baseAssertion,
        authenticatorData: authData.toString('base64'),
      });

      expect(result.verified).toBe(true); // still verified, just weak
      expect(result.deviceIntegrity).toBe('WEAK');
      expect(result.riskFlags).toContain('counter_replay');
    });

    it('returns STRONG integrity for valid assertion', async () => {
      pool.query
        // Key lookup
        .mockResolvedValueOnce({
          rows: [{ id: 'key-1', public_key: 'pub', sign_count: 5, device_info: {} }],
          rowCount: 1,
        } as any)
        // Update sign count
        .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

      const authData = Buffer.alloc(37);
      authData[32] = 0x01; // flags: user present
      authData.writeUInt32BE(10, 33); // counter = 10 (greater than stored 5)

      const result = await service.verifyiOSAttestation('user-1', {
        ...baseAssertion,
        authenticatorData: authData.toString('base64'),
      });

      expect(result.verified).toBe(true);
      expect(result.deviceIntegrity).toBe('STRONG');
      expect(result.riskFlags).toEqual([]);
    });

    it('rejects malformed authenticatorData', async () => {
      pool.query.mockResolvedValueOnce({
        rows: [{ id: 'key-1', public_key: 'pub', sign_count: 0, device_info: {} }],
        rowCount: 1,
      } as any);

      const result = await service.verifyiOSAttestation('user-1', {
        ...baseAssertion,
        authenticatorData: Buffer.alloc(10).toString('base64'), // too short
      });

      expect(result.verified).toBe(false);
      expect(result.deviceIntegrity).toBe('NONE');
      expect(result.riskFlags).toContain('malformed_assertion');
    });

    it('throws on incomplete assertion', async () => {
      await expect(
        service.verifyiOSAttestation('user-1', {
          authenticatorData: '',
          clientDataJSON: '',
          keyId: '',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('verifyAndroidAttestation', () => {
    it('throws on incomplete verdict', async () => {
      await expect(
        service.verifyAndroidAttestation('user-1', {
          tokenResult: '',
          requestPackageName: '',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects malformed JWT', async () => {
      const result = await service.verifyAndroidAttestation('user-1', {
        tokenResult: 'not-a-jwt',
        requestPackageName: 'com.styx.app',
      });

      expect(result.verified).toBe(false);
      expect(result.deviceIntegrity).toBe('NONE');
      expect(result.riskFlags).toContain('malformed_token');
    });

    it('validates package name matches', async () => {
      const payload = {
        requestPackageName: 'com.styx.app',
        exp: Math.floor(Date.now() / 1000) + 3600,
        device_integrity: { device_recognition_result: 'MATCH' },
      };
      const token = `header.${Buffer.from(JSON.stringify(payload)).toString('base64')}.sig`;

      const result = await service.verifyAndroidAttestation('user-1', {
        tokenResult: token,
        requestPackageName: 'com.styx.app',
      });

      expect(result.verified).toBe(true);
      expect(result.deviceIntegrity).toBe('STRONG');
    });

    it('rejects mismatched package name', async () => {
      const payload = {
        requestPackageName: 'com.evil.app',
        exp: Math.floor(Date.now() / 1000) + 3600,
      };
      const token = `header.${Buffer.from(JSON.stringify(payload)).toString('base64')}.sig`;

      const result = await service.verifyAndroidAttestation('user-1', {
        tokenResult: token,
        requestPackageName: 'com.styx.app',
      });

      expect(result.verified).toBe(false);
      expect(result.riskFlags).toContain('package_mismatch');
    });

    it('detects expired token', async () => {
      const payload = {
        requestPackageName: 'com.styx.app',
        exp: Math.floor(Date.now() / 1000) - 3600, // expired
        device_integrity: { device_recognition_result: 'MATCH' },
      };
      const token = `header.${Buffer.from(JSON.stringify(payload)).toString('base64')}.sig`;

      const result = await service.verifyAndroidAttestation('user-1', {
        tokenResult: token,
        requestPackageName: 'com.styx.app',
      });

      expect(result.riskFlags).toContain('token_expired');
    });
  });

  describe('registerKey / revokeKey', () => {
    it('registers a new key', async () => {
      pool.query.mockResolvedValueOnce({ rows: [], rowCount: 1 } as any);

      await service.registerKey('user-1', 'ios', 'key-abc', 'pub-key-data');

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO device_attestation_keys'),
        ['user-1', 'ios', 'key-abc', 'pub-key-data', '{}'],
      );
      expect(truthLog.appendEvent).toHaveBeenCalledWith(
        'DEVICE_KEY_REGISTERED',
        expect.objectContaining({ platform: 'ios' }),
      );
    });

    it('revokes a key', async () => {
      pool.query.mockResolvedValueOnce({ rows: [], rowCount: 1 } as any);

      await service.revokeKey('user-1', 'key-abc');

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('SET revoked = true'),
        ['user-1', 'key-abc'],
      );
    });
  });
});
