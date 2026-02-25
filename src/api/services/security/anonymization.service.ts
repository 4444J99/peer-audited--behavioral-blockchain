import { Injectable } from '@nestjs/common';
import { createHash } from 'crypto';

@Injectable()
export class AnonymizationService {
  
  anonymizeUser(user: any): any {
    if (!user) return null;

    // Deep copy to avoid mutating original
    const safeUser = { ...user };

    // Redact PII
    if (safeUser.email) {
      safeUser.email_hash = this.hash(safeUser.email);
      safeUser.email = '[REDACTED]';
    }

    if (safeUser.name) {
      safeUser.name = this.getInitials(safeUser.name);
    }

    if (safeUser.phone) {
      safeUser.phone = '[REDACTED]';
    }

    if (safeUser.stripe_customer_id) {
      delete safeUser.stripe_customer_id;
    }

    return safeUser;
  }

  private hash(input: string): string {
    return createHash('sha256').update(input).digest('hex');
  }

  private getInitials(name: string): string {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  }
}
