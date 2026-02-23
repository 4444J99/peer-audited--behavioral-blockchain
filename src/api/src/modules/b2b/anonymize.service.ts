import { Injectable } from '@nestjs/common';
import { createHash } from 'crypto';

/**
 * Anonymization layer for B2B HR exports.
 * Strips PII (emails, names, IPs) from enterprise metric payloads
 * before they leave Styx boundaries. Phase Omega requirement.
 */

export interface AnonymizedEmployee {
  anonymousId: string;
  integrityScore: number;
  tier: string;
  completedContracts: number;
  failedContracts: number;
  activeContracts: number;
  completionRate: number;
  joinedMonth: string; // YYYY-MM only, no exact date
}

export interface AnonymizedExport {
  enterpriseId: string;
  generatedAt: string;
  employeeCount: number;
  employees: AnonymizedEmployee[];
  aggregate: {
    avgIntegrityScore: number;
    avgCompletionRate: number;
    totalContracts: number;
    completedContracts: number;
  };
}

const PII_FIELDS = ['email', 'password_hash', 'stripe_customer_id', 'ip_address', 'name', 'first_name', 'last_name', 'phone'] as const;

@Injectable()
export class AnonymizeService {
  private salt = process.env.ANONYMIZE_SALT || 'styx-anon-salt-v1'; // allow-secret

  /**
   * One-way hash a user ID into an anonymous identifier.
   * Consistent within an enterprise export (same user = same anon ID)
   * but not reversible without the salt.
   */
  hashUserId(userId: string, enterpriseId: string): string {
    const input = `${this.salt}:${enterpriseId}:${userId}`;
    return createHash('sha256').update(input).digest('hex').slice(0, 16);
  }

  /**
   * Strip all PII fields from a raw database row.
   * Returns only the allow-listed behavioral metrics.
   */
  stripPii(row: Record<string, unknown>): Record<string, unknown> {
    const cleaned: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(row)) {
      if ((PII_FIELDS as readonly string[]).includes(key)) continue;
      // Redact any field that looks like an email
      if (typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) continue;
      cleaned[key] = value;
    }
    return cleaned;
  }

  /**
   * Coarsen a timestamp to month granularity (YYYY-MM).
   * Prevents re-identification via exact join dates.
   */
  coarsenDate(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    const year = d.getUTCFullYear();
    const month = String(d.getUTCMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }

  /**
   * Build a fully anonymized export payload for enterprise HR consumers.
   */
  anonymizeEmployeeData(
    enterpriseId: string,
    employees: Array<{
      id: string;
      email: string;
      integrity_score: number;
      tier: string;
      created_at: string;
      contracts: { completed: number; failed: number; active: number };
    }>,
  ): AnonymizedExport {
    const anonymized: AnonymizedEmployee[] = employees.map((emp) => {
      const total = emp.contracts.completed + emp.contracts.failed + emp.contracts.active;
      return {
        anonymousId: this.hashUserId(emp.id, enterpriseId),
        integrityScore: emp.integrity_score,
        tier: emp.tier,
        completedContracts: emp.contracts.completed,
        failedContracts: emp.contracts.failed,
        activeContracts: emp.contracts.active,
        completionRate: total > 0 ? Math.round((emp.contracts.completed / total) * 100) : 0,
        joinedMonth: this.coarsenDate(emp.created_at),
      };
    });

    const totalContracts = anonymized.reduce(
      (sum, e) => sum + e.completedContracts + e.failedContracts + e.activeContracts,
      0,
    );
    const totalCompleted = anonymized.reduce((sum, e) => sum + e.completedContracts, 0);

    return {
      enterpriseId,
      generatedAt: new Date().toISOString(),
      employeeCount: anonymized.length,
      employees: anonymized,
      aggregate: {
        avgIntegrityScore: anonymized.length > 0
          ? Math.round(anonymized.reduce((s, e) => s + e.integrityScore, 0) / anonymized.length)
          : 0,
        avgCompletionRate: anonymized.length > 0
          ? Math.round(anonymized.reduce((s, e) => s + e.completionRate, 0) / anonymized.length)
          : 0,
        totalContracts,
        completedContracts: totalCompleted,
      },
    };
  }
}
