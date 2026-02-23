import { AnonymizeService } from './anonymize.service';

describe('AnonymizeService', () => {
  let service: AnonymizeService;

  beforeEach(() => {
    service = new AnonymizeService();
  });

  describe('hashUserId', () => {
    it('should return a 16-char hex string', () => {
      const hash = service.hashUserId('user-123', 'ent-001');
      expect(hash).toMatch(/^[0-9a-f]{16}$/);
    });

    it('should be deterministic for the same input', () => {
      const a = service.hashUserId('user-123', 'ent-001');
      const b = service.hashUserId('user-123', 'ent-001');
      expect(a).toBe(b);
    });

    it('should produce different hashes for different users', () => {
      const a = service.hashUserId('user-123', 'ent-001');
      const b = service.hashUserId('user-456', 'ent-001');
      expect(a).not.toBe(b);
    });

    it('should produce different hashes for same user in different enterprises', () => {
      const a = service.hashUserId('user-123', 'ent-001');
      const b = service.hashUserId('user-123', 'ent-002');
      expect(a).not.toBe(b);
    });
  });

  describe('stripPii', () => {
    it('should remove known PII fields', () => {
      const row = {
        id: 'abc',
        email: 'alice@example.com',
        password_hash: '$2b$10$...',
        stripe_customer_id: 'cus_abc',
        integrity_score: 75,
        ip_address: '192.168.1.1',
        name: 'Alice Smith',
      };
      const cleaned = service.stripPii(row);
      expect(cleaned).toEqual({ id: 'abc', integrity_score: 75 });
    });

    it('should remove values that look like emails even if key is not in PII list', () => {
      const row = {
        id: 'abc',
        contact: 'bob@test.io',
        score: 50,
      };
      const cleaned = service.stripPii(row);
      expect(cleaned).toEqual({ id: 'abc', score: 50 });
    });

    it('should pass through non-PII data unchanged', () => {
      const row = { id: 'x', integrity_score: 90, tier: 'STANDARD' };
      const cleaned = service.stripPii(row);
      expect(cleaned).toEqual(row);
    });
  });

  describe('coarsenDate', () => {
    it('should reduce a date to YYYY-MM', () => {
      expect(service.coarsenDate('2026-02-15T10:30:00Z')).toBe('2026-02');
    });

    it('should handle Date objects', () => {
      expect(service.coarsenDate(new Date('2025-12-25'))).toBe('2025-12');
    });

    it('should zero-pad single-digit months', () => {
      expect(service.coarsenDate('2026-03-01')).toBe('2026-03');
    });
  });

  describe('anonymizeEmployeeData', () => {
    const employees = [
      {
        id: 'user-1',
        email: 'alice@corp.io',
        integrity_score: 80,
        tier: 'STANDARD',
        created_at: '2026-01-15T00:00:00Z',
        contracts: { completed: 8, failed: 1, active: 1 },
      },
      {
        id: 'user-2',
        email: 'bob@corp.io',
        integrity_score: 60,
        tier: 'MICRO',
        created_at: '2026-02-10T00:00:00Z',
        contracts: { completed: 3, failed: 2, active: 0 },
      },
    ];

    it('should strip all PII from output', () => {
      const result = service.anonymizeEmployeeData('ent-001', employees);
      const json = JSON.stringify(result);
      expect(json).not.toContain('alice');
      expect(json).not.toContain('bob');
      expect(json).not.toContain('corp.io');
      expect(json).not.toContain('user-1');
      expect(json).not.toContain('user-2');
    });

    it('should include anonymous IDs instead of real IDs', () => {
      const result = service.anonymizeEmployeeData('ent-001', employees);
      expect(result.employees).toHaveLength(2);
      result.employees.forEach((emp) => {
        expect(emp.anonymousId).toMatch(/^[0-9a-f]{16}$/);
      });
    });

    it('should coarsen dates to month granularity', () => {
      const result = service.anonymizeEmployeeData('ent-001', employees);
      expect(result.employees[0].joinedMonth).toBe('2026-01');
      expect(result.employees[1].joinedMonth).toBe('2026-02');
    });

    it('should compute correct aggregate stats', () => {
      const result = service.anonymizeEmployeeData('ent-001', employees);
      expect(result.aggregate.avgIntegrityScore).toBe(70);
      expect(result.aggregate.totalContracts).toBe(15);
      expect(result.aggregate.completedContracts).toBe(11);
    });

    it('should handle empty employee list', () => {
      const result = service.anonymizeEmployeeData('ent-empty', []);
      expect(result.employeeCount).toBe(0);
      expect(result.employees).toEqual([]);
      expect(result.aggregate.avgIntegrityScore).toBe(0);
    });

    it('should compute per-employee completion rate', () => {
      const result = service.anonymizeEmployeeData('ent-001', employees);
      expect(result.employees[0].completionRate).toBe(80); // 8/10
      expect(result.employees[1].completionRate).toBe(60); // 3/5
    });
  });
});
