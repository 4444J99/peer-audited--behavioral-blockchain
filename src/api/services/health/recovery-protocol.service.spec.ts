import { HttpException, HttpStatus } from '@nestjs/common';
import { Pool } from 'pg';
import { RecoveryProtocolService, RecoveryMetadata } from './recovery-protocol.service';
import { MAX_NOCONTACT_DURATION_DAYS, MAX_NOCONTACT_TARGETS } from '../../../shared/libs/behavioral-logic';

describe('RecoveryProtocolService', () => {
  let service: RecoveryProtocolService;
  let mockPool: jest.Mocked<Pool>;

  const validMetadata: RecoveryMetadata = {
    accountabilityPartnerEmail: 'friend@example.com',
    noContactIdentifiers: ['hash_abc123'],
    acknowledgments: {
      voluntary: true,
      noMinors: true,
      noDependents: true,
      noLegalObligations: true,
    },
  };

  beforeEach(() => {
    mockPool = {
      query: jest.fn().mockResolvedValue({ rows: [{ status: 'ACTIVE' }] }), // Default mock for partner check
    } as any;
    service = new RecoveryProtocolService(mockPool);
  });

  it('should accept a valid RECOVERY_NOCONTACT contract', async () => {
    const result = await service.validateRecoveryContract('user-1', 'RECOVERY_NOCONTACT', 14, validMetadata);
    expect(result).toBe(true);
  });

  it('should accept a valid RECOVERY_SUBSTANCE contract (no noContactIdentifiers needed)', async () => {
    const meta: RecoveryMetadata = {
      ...validMetadata,
      noContactIdentifiers: [],
    };
    const result = await service.validateRecoveryContract('user-1', 'RECOVERY_SUBSTANCE', 21, meta);
    expect(result).toBe(true);
  });

  it('should reject when metadata is missing', async () => {
    await expect(
      service.validateRecoveryContract('user-1', 'RECOVERY_NOCONTACT', 14, undefined),
    ).rejects.toThrow(HttpException);
  });

  it('should reject when accountability partner email is empty', async () => {
    const meta: RecoveryMetadata = {
      ...validMetadata,
      accountabilityPartnerEmail: '',
    };
    await expect(
      service.validateRecoveryContract('user-1', 'RECOVERY_NOCONTACT', 14, meta),
    ).rejects.toThrow(HttpException);
  });

  it('should reject duration exceeding 30 days', async () => {
    await expect(
      service.validateRecoveryContract('user-1', 'RECOVERY_NOCONTACT', 60, validMetadata),
    ).rejects.toThrow(HttpException);
  });

  it('should reject RECOVERY_NOCONTACT with more than 3 targets', async () => {
    const meta: RecoveryMetadata = {
      ...validMetadata,
      noContactIdentifiers: ['h1', 'h2', 'h3', 'h4'],
    };
    await expect(
      service.validateRecoveryContract('user-1', 'RECOVERY_NOCONTACT', 14, meta),
    ).rejects.toThrow(HttpException);
  });

  it('should reject when total targets across contracts exceed 10 (Theorem 8)', async () => {
    mockPool.query
      .mockResolvedValueOnce({ rows: [{ status: 'ACTIVE' }] }) // partner check
      .mockResolvedValueOnce({
        rows: [
          { 
            metadata: { noContactIdentifiers: ['e1', 'e2', 'e3'] },
            oath_category: 'RECOVERY_NOCONTACT'
          },
          { 
            metadata: { noContactIdentifiers: ['e4', 'e5', 'e6'] },
            oath_category: 'RECOVERY_NOCONTACT'
          },
          { 
            metadata: { noContactIdentifiers: ['e7', 'e8'] },
            oath_category: 'RECOVERY_NOCONTACT'
          },
        ],
      });

    const meta: RecoveryMetadata = {
      ...validMetadata,
      noContactIdentifiers: ['n1', 'n2', 'n3'], // Total would be 3 + 3 + 2 + 3 = 11
    };

    await expect(
      service.validateRecoveryContract('user-1', 'RECOVERY_NOCONTACT', 14, meta),
    ).rejects.toThrow('Theorem 8 Violation');
  });

  describe('Theorem 8: Anti-Isolation Guardrails', () => {
    it('should pass if total targets is exactly the limit (10)', async () => {
      mockPool.query
        .mockResolvedValueOnce({ rows: [{ status: 'ACTIVE' }] }) // partner check
        .mockResolvedValueOnce({
          rows: [
            { 
              metadata: { noContactIdentifiers: ['e1', 'e2', 'e3', 'e4', 'e5', 'e6'] },
              oath_category: 'RECOVERY_NOCONTACT'
            },
            {
              metadata: {},
              oath_category: 'RECOVERY_SUBSTANCE' // +1 point
            }
          ],
        });

      const meta: RecoveryMetadata = {
        ...validMetadata,
        noContactIdentifiers: ['n1', 'n2', 'n3'], // 6 + 1 + 3 = 10
      };

      const result = await service.validateRecoveryContract('user-1', 'RECOVERY_NOCONTACT', 14, meta);
      expect(result).toBe(true);
    });

    it('should correctly handle contracts with missing metadata in DB', async () => {
      mockPool.query
        .mockResolvedValueOnce({ rows: [{ status: 'ACTIVE' }] }) // partner check
        .mockResolvedValueOnce({
          rows: [
            { metadata: null, oath_category: 'RECOVERY_NOCONTACT' },
            { metadata: { noContactIdentifiers: ['e1'] }, oath_category: 'RECOVERY_NOCONTACT' },
          ],
        });

      const meta: RecoveryMetadata = {
        ...validMetadata,
        noContactIdentifiers: ['n1'], // 0 + 1 + 1 = 2
      };

      const result = await service.validateRecoveryContract('user-1', 'RECOVERY_NOCONTACT', 14, meta);
      expect(result).toBe(true);
    });
  });
});
