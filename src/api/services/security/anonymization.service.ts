import { Injectable } from '@nestjs/common';
import { createHmac } from 'crypto';

/**
 * Resolve the keyed-anonymization secret. PRV8: a bare sha256(email) is reversible
 * via rainbow tables and forms a stable cross-record join key, so pseudonymization
 * must be keyed with a server-side secret the data consumer never sees. Reuse the
 * existing ANONYMIZE_SALT / APP_SECRET env convention. Fail CLOSED in production if
 * neither is set (refuse to emit a guessable hash); dev/test gets a clearly-labelled
 * non-secret fallback so local flows still work.
 */
function resolveAnonymizeSecret(): string {
  const secret = process.env.ANONYMIZE_SALT || process.env.APP_SECRET; // allow-secret
  if (secret) return secret;
  if (process.env.NODE_ENV === 'production') {
    throw new Error('ANONYMIZE_SALT (or APP_SECRET) must be set in production for PII pseudonymization');
  }
  return 'dev-only-insecure-anonymize-secret';
}

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
      // PRV9: initials still narrow re-identification in small populations. Replace
      // the name with a stable, non-identifying salted pseudonym token instead.
      safeUser.name = this.pseudonymizeName(safeUser.name);
    }

    if (safeUser.phone) {
      safeUser.phone = '[REDACTED]';
    }

    if (safeUser.stripe_customer_id) {
      delete safeUser.stripe_customer_id;
    }

    return safeUser;
  }

  /**
   * PRV8: keyed HMAC-SHA256 over the normalized email. Unlike a bare sha256, this is
   * not reversible without the server secret and cannot be precomputed.
   */
  private hash(input: string): string {
    return createHmac('sha256', resolveAnonymizeSecret())
      .update(input.toLowerCase())
      .digest('hex');
  }

  /**
   * PRV9: derive a stable, non-identifying token from a name (e.g. "user-1a2b3c4d").
   * It is consistent for the same name (so records still correlate within an export)
   * but reveals no initials / structure that could re-identify in a small cohort.
   */
  private pseudonymizeName(name: string): string {
    const token = createHmac('sha256', resolveAnonymizeSecret())
      .update(`name:${name.trim().toLowerCase()}`)
      .digest('hex')
      .slice(0, 8);
    return `user-${token}`;
  }
}
