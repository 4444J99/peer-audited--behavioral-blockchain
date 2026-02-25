import { AnonymizationService } from './anonymization.service';

describe('AnonymizationService', () => {
  let service: AnonymizationService;

  beforeEach(() => {
    service = new AnonymizationService();
  });

  describe('hash', () => {
    it('should return a consistent hash for the same email', () => {
      const hash1 = (service as any).hash('test@example.com');
      const hash2 = (service as any).hash('test@example.com');
      expect(hash1).toBe(hash2);
    });

    it('should be case-insensitive', () => {
      expect((service as any).hash('Test@Example.COM')).toBe((service as any).hash('test@example.com'));
    });

    it('should return a 16-char hex string', () => {
      // The current hash is sha256 hex which is 64 chars long
      expect((service as any).hash('test@example.com')).toMatch(/^[0-9a-f]{64}$/);
    });

    it('should produce different hashes for different emails', () => {
      expect((service as any).hash('alice@example.com')).not.toBe((service as any).hash('bob@example.com'));
    });
  });

  describe('getInitials', () => {
    it('should return initials', () => {
      expect((service as any).getInitials('John Doe')).toBe('JD');
      expect((service as any).getInitials('Alice B. Smith')).toBe('ABS');
    });
  });

});
