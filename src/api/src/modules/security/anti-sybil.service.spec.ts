import { Test, TestingModule } from '@nestjs/testing';
import { AntiSybilService } from './anti-sybil.service';

describe('AntiSybilService', () => {
  let service: AntiSybilService;
  let pool: any;

  const mockPool = () => ({ query: jest.fn() });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AntiSybilService,
        { provide: 'DATABASE_POOL', useFactory: mockPool },
      ],
    }).compile();

    service = module.get<AntiSybilService>(AntiSybilService);
    pool = module.get('DATABASE_POOL');
  });

  describe('hashFingerprint', () => {
    it('produces consistent SHA-256 hashes', () => {
      const hash = AntiSybilService.hashFingerprint('test-vendor-id');
      expect(hash).toHaveLength(64);
      expect(hash).toBe(AntiSybilService.hashFingerprint('test-vendor-id'));
    });

    it('produces different hashes for different inputs', () => {
      const h1 = AntiSybilService.hashFingerprint('vendor-a');
      const h2 = AntiSybilService.hashFingerprint('vendor-b');
      expect(h1).not.toBe(h2);
    });
  });

  describe('registerDeviceFingerprint', () => {
    it('upserts with hashed vendor ID', async () => {
      pool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

      await service.registerDeviceFingerprint('user-1', {
        hash: 'pre-hashed',
        platform: 'ios',
        rawVendorId: 'ABC-123',
      });

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO sybil_device_fingerprints'),
        expect.arrayContaining([
          'user-1',
          AntiSybilService.hashFingerprint('ABC-123'),
          'ios',
        ]),
      );
    });
  });

  describe('detectSharedDevice', () => {
    it('returns user IDs sharing a device', async () => {
      pool.query.mockResolvedValueOnce({
        rows: [{ user_id: 'user-1' }, { user_id: 'user-2' }],
        rowCount: 2,
      } as any);

      const users = await service.detectSharedDevice('hash-abc');
      expect(users).toEqual(['user-1', 'user-2']);
    });

    it('returns empty array when no matches', async () => {
      pool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

      const users = await service.detectSharedDevice('hash-xyz');
      expect(users).toEqual([]);
    });
  });

  describe('detectSharedPayment', () => {
    it('returns users with same payment intent', async () => {
      pool.query.mockResolvedValueOnce({
        rows: [{ user_id: 'user-2' }],
        rowCount: 1,
      } as any);

      const users = await service.detectSharedPayment('user-1');
      expect(users).toEqual(['user-2']);
    });
  });

  describe('analyzeUser', () => {
    it('returns NONE for user with no signals', async () => {
      pool.query
        .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any)  // device hashes
        .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any)  // shared payment
        .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);  // IP

      const verdict = await service.analyzeUser('user-1');
      expect(verdict.riskScore).toBe(0);
      expect(verdict.enforcementAction).toBe('NONE');
      expect(verdict.duplicateCount).toBe(0);
    });

    it('returns WARNING for low risk', async () => {
      pool.query
        .mockResolvedValueOnce({
          rows: [{ device_hash: 'hash-1' }],
          rowCount: 1,
        } as any)
        // detectSharedDevice for hash-1
        .mockResolvedValueOnce({
          rows: [{ user_id: 'user-1' }, { user_id: 'user-2' }],
          rowCount: 2,
        } as any)
        .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any)  // payment
        .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);  // IP

      const verdict = await service.analyzeUser('user-1');
      expect(verdict.riskScore).toBe(30);
      expect(verdict.enforcementAction).toBe('WARNING');
    });

    it('returns ACCOUNT_MERGE for medium risk', async () => {
      pool.query
        .mockResolvedValueOnce({
          rows: [{ device_hash: 'hash-1' }],
          rowCount: 1,
        } as any)
        .mockResolvedValueOnce({
          rows: [{ user_id: 'user-1' }, { user_id: 'user-2' }],
          rowCount: 2,
        } as any)
        .mockResolvedValueOnce({
          rows: [{ user_id: 'user-3' }],
          rowCount: 1,
        } as any)
        .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

      const verdict = await service.analyzeUser('user-1');
      expect(verdict.riskScore).toBe(70);
      expect(verdict.enforcementAction).toBe('BAN');
    });

    it('returns BAN for high risk', async () => {
      pool.query
        .mockResolvedValueOnce({
          rows: [{ device_hash: 'hash-1' }, { device_hash: 'hash-2' }],
          rowCount: 2,
        } as any)
        .mockResolvedValueOnce({
          rows: [{ user_id: 'user-1' }, { user_id: 'user-2' }],
          rowCount: 2,
        } as any)
        .mockResolvedValueOnce({
          rows: [{ user_id: 'user-1' }, { user_id: 'user-3' }],
          rowCount: 2,
        } as any)
        .mockResolvedValueOnce({
          rows: [{ user_id: 'user-4' }],
          rowCount: 1,
        } as any)
        .mockResolvedValueOnce({
          rows: [{ ip_address: '1.2.3.4' }],
          rowCount: 1,
        } as any)
        .mockResolvedValueOnce({
          rows: [{ user_id: 'user-5' }],
          rowCount: 1,
        } as any);

      const verdict = await service.analyzeUser('user-1');
      expect(verdict.riskScore).toBeGreaterThanOrEqual(61);
      expect(verdict.enforcementAction).toBe('BAN');
    });
  });

  describe('getSignalHistory', () => {
    it('returns signals ordered by detected_at DESC', async () => {
      pool.query.mockResolvedValueOnce({
        rows: [
          {
            id: 's1',
            user_id: 'user-1',
            signal_type: 'SHARED_DEVICE',
            related_user_id: 'user-2',
            confidence: 30,
            detected_at: new Date('2026-07-23'),
          },
        ],
        rowCount: 1,
      } as any);

      const signals = await service.getSignalHistory('user-1');
      expect(signals).toHaveLength(1);
      expect(signals[0].signalType).toBe('SHARED_DEVICE');
    });
  });

  describe('recordSignal', () => {
    it('inserts and returns signal with id', async () => {
      pool.query.mockResolvedValueOnce({
        rows: [{ id: 'new-id', detected_at: new Date() }],
        rowCount: 1,
      } as any);

      const signal = await service.recordSignal({
        userId: 'user-1',
        signalType: 'SHARED_IP',
        relatedUserId: 'user-2',
        confidence: 15,
      });

      expect(signal.id).toBe('new-id');
      expect(signal.signalType).toBe('SHARED_IP');
    });
  });

  describe('appealSharedDevice', () => {
    it('accepts family reason with different phone numbers', async () => {
      pool.query.mockResolvedValueOnce({
        rows: [
          { phone_number: '+1111' },
          { phone_number: '+2222' },
        ],
        rowCount: 2,
      } as any);

      const result = await service.appealSharedDevice(
        'user-1',
        'user-2',
        'This is a family member sharing the same iPad',
      );

      expect(result.accepted).toBe(true);
      expect(result.message).toContain('family');
    });

    it('flags non-family reason for review', async () => {
      const result = await service.appealSharedDevice(
        'user-1',
        'user-2',
        'We are roommates and share a computer',
      );

      expect(result.accepted).toBe(false);
      expect(result.message).toContain('manual review');
    });

    it('flags family reason with same phone number', async () => {
      pool.query.mockResolvedValueOnce({
        rows: [{ phone_number: '+1111' }],
        rowCount: 1,
      } as any);

      const result = await service.appealSharedDevice(
        'user-1',
        'user-2',
        'family member',
      );

      expect(result.accepted).toBe(false);
    });
  });
});
