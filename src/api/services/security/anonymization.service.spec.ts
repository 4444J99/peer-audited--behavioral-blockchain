import { AnonymizationService } from './anonymization.service';

describe('AnonymizationService', () => {
  let service: AnonymizationService;

  beforeEach(() => {
    service = new AnonymizationService();
  });

  describe('hashEmail', () => {
    it('should return a consistent hash for the same email', () => {
      const hash1 = service.hashEmail('test@example.com');
      const hash2 = service.hashEmail('test@example.com');
      expect(hash1).toBe(hash2);
    });

    it('should be case-insensitive', () => {
      expect(service.hashEmail('Test@Example.COM')).toBe(service.hashEmail('test@example.com'));
    });

    it('should return a 16-char hex string', () => {
      expect(service.hashEmail('test@example.com')).toMatch(/^[0-9a-f]{16}$/);
    });

    it('should produce different hashes for different emails', () => {
      expect(service.hashEmail('alice@example.com')).not.toBe(service.hashEmail('bob@example.com'));
    });
  });

  describe('anonymizeName', () => {
    it('should return Employee #N format', () => {
      expect(service.anonymizeName(0)).toBe('Employee #1');
      expect(service.anonymizeName(4)).toBe('Employee #5');
    });
  });

  describe('generateDateOffset', () => {
    it('should return an offset in the range of -30 to +30 days in ms', () => {
      const offset = service.generateDateOffset();
      const days = offset / 86400000;
      expect(days).toBeGreaterThanOrEqual(-30);
      expect(days).toBeLessThanOrEqual(30);
    });
  });

  describe('shiftDate', () => {
    it('should shift a date by the given offset', () => {
      const date = new Date('2025-06-15T00:00:00Z');
      const oneDay = 86400000;
      const shifted = service.shiftDate(date, oneDay);
      expect(shifted.toISOString()).toBe('2025-06-16T00:00:00.000Z');
    });
  });

  describe('stripPII', () => {
    it('should remove PII fields', () => {
      const data = {
        email: 'test@example.com',
        name: 'John Doe',
        phone: '555-1234',
        contractId: 'abc-123',
        score: 85,
      };
      const result = service.stripPII(data);
      expect(result).not.toHaveProperty('email');
      expect(result).not.toHaveProperty('name');
      expect(result).not.toHaveProperty('phone');
      expect(result).toHaveProperty('contractId', 'abc-123');
      expect(result).toHaveProperty('score', 85);
    });

    it('should not modify the original object', () => {
      const data = { email: 'test@example.com', score: 85 };
      service.stripPII(data);
      expect(data).toHaveProperty('email');
    });

    it('should handle objects with no PII fields', () => {
      const data = { contractId: 'abc', score: 42 };
      const result = service.stripPII(data);
      expect(result).toEqual(data);
    });
  });

  describe('anonymizeExport', () => {
    it('should anonymize all user data', () => {
      const result = service.anonymizeExport(
        'enterprise-1',
        [{ email: 'alice@corp.com', name: 'Alice Smith' }],
        [{
          userId: 'u1',
          email: 'alice@corp.com',
          eventType: 'contract_completed',
          timestamp: new Date('2025-01-15'),
          metadata: { email: 'alice@corp.com', score: 90 },
        }],
        { totalContracts: 10, completionRate: 0.85, avgIntegrityScore: 75, activeUsers: 5 },
      );

      expect(result.enterpriseId).toBe('enterprise-1');
      expect(result.events[0].employeeRef).toBe('Employee #1');
      expect(result.events[0].metadata).not.toHaveProperty('email');
      expect(result.events[0].metadata).toHaveProperty('score', 90);
      expect(result.aggregates.completionRate).toBe(0.85);
    });

    it('should compute relative days from the first event', () => {
      const result = service.anonymizeExport(
        'enterprise-1',
        [{ email: 'a@b.com', name: 'A' }],
        [
          {
            userId: 'u1', email: 'a@b.com', eventType: 'contract_created',
            timestamp: new Date('2025-01-01'), metadata: {},
          },
          {
            userId: 'u1', email: 'a@b.com', eventType: 'contract_completed',
            timestamp: new Date('2025-01-08'), metadata: {},
          },
        ],
        { totalContracts: 1, completionRate: 1, avgIntegrityScore: 80, activeUsers: 1 },
      );

      expect(result.events[0].relativeDay).toBe(0);
      expect(result.events[1].relativeDay).toBe(7);
    });

    it('should handle empty events array', () => {
      const result = service.anonymizeExport(
        'enterprise-1',
        [],
        [],
        { totalContracts: 0, completionRate: 0, avgIntegrityScore: 0, activeUsers: 0 },
      );
      expect(result.events).toEqual([]);
    });
  });
});
