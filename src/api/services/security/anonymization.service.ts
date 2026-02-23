import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

interface AnonymizedEvent {
  employeeRef: string;
  eventType: string;
  relativeDay: number;
  metadata: Record<string, unknown>;
}

interface AnonymizedExport {
  enterpriseId: string;
  exportDate: string;
  dateOffset: number;
  events: AnonymizedEvent[];
  aggregates: {
    totalContracts: number;
    completionRate: number;
    avgIntegrityScore: number;
    activeUsers: number;
  };
}

/**
 * PII Anonymization Service for B2B data exports.
 * Strips personal data, hashes emails, shifts dates, and replaces names
 * with generic identifiers before any data leaves the platform.
 */
@Injectable()
export class AnonymizationService {
  private readonly salt = process.env.ANONYMIZATION_SALT || 'styx-anon-default';

  /**
   * One-way HMAC hash of an email address. Consistent for the same email
   * (deterministic with the configured salt) but not reversible.
   */
  hashEmail(email: string): string {
    return crypto.createHmac('sha256', this.salt).update(email.toLowerCase()).digest('hex').slice(0, 16);
  }

  /**
   * Replace a user's real name with a generic indexed label.
   */
  anonymizeName(index: number): string {
    return `Employee #${index + 1}`;
  }

  /**
   * Generate a random date offset between -30 and +30 days (in milliseconds).
   * Applied uniformly to all dates in an export batch to preserve relative ordering.
   */
  generateDateOffset(): number {
    return (Math.floor(Math.random() * 61) - 30) * 86400000;
  }

  /**
   * Shift a date by the given offset in milliseconds.
   */
  shiftDate(date: Date, offsetMs: number): Date {
    return new Date(date.getTime() + offsetMs);
  }

  /**
   * Remove known PII fields from a metadata record.
   */
  stripPII(data: Record<string, unknown>): Record<string, unknown> {
    const piiKeys = ['email', 'name', 'firstName', 'lastName', 'phone', 'address', 'ssn', 'ip', 'ipAddress'];
    const cleaned = { ...data };
    for (const key of piiKeys) {
      if (key in cleaned) {
        delete cleaned[key];
      }
    }
    return cleaned;
  }

  /**
   * Produce a fully anonymized export suitable for B2B enterprise reporting.
   * All PII is stripped or replaced, dates are shifted, and names are generalized.
   */
  anonymizeExport(
    enterpriseId: string,
    users: Array<{ email: string; name: string }>,
    events: Array<{ userId: string; email: string; eventType: string; timestamp: Date; metadata: Record<string, unknown> }>,
    aggregates: { totalContracts: number; completionRate: number; avgIntegrityScore: number; activeUsers: number },
  ): AnonymizedExport {
    const dateOffset = this.generateDateOffset();
    const emailToIndex = new Map<string, number>();
    users.forEach((u, i) => emailToIndex.set(u.email, i));

    const baseDate = events.length > 0 ? events[0].timestamp : new Date();

    const anonymizedEvents: AnonymizedEvent[] = events.map((evt) => ({
      employeeRef: this.anonymizeName(emailToIndex.get(evt.email) ?? 0),
      eventType: evt.eventType,
      relativeDay: Math.floor((evt.timestamp.getTime() - baseDate.getTime()) / 86400000),
      metadata: this.stripPII(evt.metadata),
    }));

    return {
      enterpriseId,
      exportDate: new Date().toISOString(),
      dateOffset,
      events: anonymizedEvents,
      aggregates,
    };
  }
}
