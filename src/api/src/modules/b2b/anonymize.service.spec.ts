import { AnonymizeService } from './anonymize.service';

describe('AnonymizeService', () => {
  let service: AnonymizeService;

  beforeEach(() => {
    service = new AnonymizeService();
  });

  describe('hashUserId', () => {
    it('should return a 32-char hex string', () => {
      // Pseudonym truncation was widened from 64-bit (16 hex) to 128-bit (32 hex)
      // to make brute-force reversal/collisions infeasible.
      const hash = service.hashUserId('user-123', 'ent-001');
      expect(hash).toMatch(/^[0-9a-f]{32}$/);
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
        subscription_id: 'sub_abc',
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
    // Use a cohort of >= K_ANONYMITY (5) so per-employee rows are released (not
    // suppressed). The first two carry the values the aggregate assertions check.
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
      {
        id: 'user-3',
        email: 'carol@corp.io',
        integrity_score: 70,
        tier: 'STANDARD',
        created_at: '2026-03-01T00:00:00Z',
        contracts: { completed: 5, failed: 0, active: 0 },
      },
      {
        id: 'user-4',
        email: 'dave@corp.io',
        integrity_score: 70,
        tier: 'STANDARD',
        created_at: '2026-03-05T00:00:00Z',
        contracts: { completed: 5, failed: 0, active: 0 },
      },
      {
        id: 'user-5',
        email: 'erin@corp.io',
        integrity_score: 70,
        tier: 'STANDARD',
        created_at: '2026-03-08T00:00:00Z',
        contracts: { completed: 5, failed: 0, active: 0 },
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
      expect(result.employees).toHaveLength(5);
      result.employees.forEach((emp) => {
        expect(emp.anonymousId).toMatch(/^[0-9a-f]{32}$/);
      });
    });

    it('should coarsen dates to month granularity', () => {
      const result = service.anonymizeEmployeeData('ent-001', employees);
      expect(result.employees[0].joinedMonth).toBe('2026-01');
      expect(result.employees[1].joinedMonth).toBe('2026-02');
    });

    it('should compute correct aggregate stats', () => {
      const result = service.anonymizeEmployeeData('ent-001', employees);
      expect(result.aggregate.totalContracts).toBe(30);
      expect(result.aggregate.completedContracts).toBe(26);
    });

    it('should handle empty employee list', () => {
      const result = service.anonymizeEmployeeData('ent-empty', []);
      expect(result.employeeCount).toBe(0);
      expect(result.employees).toEqual([]);
      expect(result.suppressed).toBe(false);
      expect(result.aggregate.avgIntegrityScore).toBe(0);
    });

    it('should compute per-employee completion rate', () => {
      const result = service.anonymizeEmployeeData('ent-001', employees);
      expect(result.employees[0].completionRate).toBe(80); // 8/10
      expect(result.employees[1].completionRate).toBe(60); // 3/5
    });

    it('should suppress per-employee rows for cohorts below K (PRV10)', () => {
      const smallCohort = employees.slice(0, 2); // 2 < 5
      const result = service.anonymizeEmployeeData('ent-small', smallCohort);
      expect(result.suppressed).toBe(true);
      expect(result.employees).toEqual([]);
      // employeeCount and aggregates remain available.
      expect(result.employeeCount).toBe(2);
      expect(result.aggregate.avgIntegrityScore).toBe(70);
    });

    it('should NOT suppress rows for cohorts at or above K (PRV10)', () => {
      const result = service.anonymizeEmployeeData('ent-001', employees); // 5
      expect(result.suppressed).toBe(false);
      expect(result.employees).toHaveLength(5);
    });
  });
});
