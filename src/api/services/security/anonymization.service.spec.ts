import { AnonymizationService } from './anonymization.service';

describe('AnonymizationService', () => {
  let service: AnonymizationService;

  beforeEach(() => {
    service = new AnonymizationService();
  });

  describe('hash (keyed HMAC, PRV8)', () => {
    it('should return a consistent hash for the same email', () => {
      const hash1 = (service as any).hash('test@example.com');
      const hash2 = (service as any).hash('test@example.com');
      expect(hash1).toBe(hash2);
    });

    it('should be case-insensitive', () => {
      expect((service as any).hash('Test@Example.COM')).toBe((service as any).hash('test@example.com'));
    });

    it('should return a 64-char hex string (HMAC-SHA256)', () => {
      expect((service as any).hash('test@example.com')).toMatch(/^[0-9a-f]{64}$/);
    });

    it('should produce different hashes for different emails', () => {
      expect((service as any).hash('alice@example.com')).not.toBe((service as any).hash('bob@example.com'));
    });

    it('should not equal a bare sha256 of the email (it is keyed)', () => {
      const { createHash } = require('crypto');
      const bare = createHash('sha256').update('test@example.com').digest('hex');
      expect((service as any).hash('test@example.com')).not.toBe(bare);
    });
  });

  describe('pseudonymizeName (PRV9)', () => {
    it('should not leak initials and should be a stable salted token', () => {
      const a = (service as any).pseudonymizeName('John Doe');
      const b = (service as any).pseudonymizeName('John Doe');
      expect(a).toBe(b);
      expect(a).toMatch(/^user-[0-9a-f]{8}$/);
      // Distinct names -> distinct tokens.
      expect((service as any).pseudonymizeName('Alice B. Smith')).not.toBe(a);
    });
  });

  describe('anonymizeUser', () => {
    it('should redact email/name/phone and drop stripe id', () => {
      const out = service.anonymizeUser({
        email: 'jane@example.com',
        name: 'Jane Roe',
        phone: '555-1234',
        stripe_customer_id: 'cus_123',
      });
      expect(out.email).toBe('[REDACTED]');
      expect(out.email_hash).toMatch(/^[0-9a-f]{64}$/);
      expect(out.name).toMatch(/^user-[0-9a-f]{8}$/);
      expect(out.phone).toBe('[REDACTED]');
      expect(out.stripe_customer_id).toBeUndefined();
    });
  });

});
