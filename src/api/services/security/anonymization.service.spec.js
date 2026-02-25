"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const anonymization_service_1 = require("./anonymization.service");
describe('AnonymizationService', () => {
    let service;
    beforeEach(() => {
        service = new anonymization_service_1.AnonymizationService();
    });
    describe('hash', () => {
        it('should return a consistent hash for the same email', () => {
            const hash1 = service.hash('test@example.com');
            const hash2 = service.hash('test@example.com');
            expect(hash1).toBe(hash2);
        });
        it('should be case-insensitive', () => {
            expect(service.hash('Test@Example.COM')).toBe(service.hash('test@example.com'));
        });
        it('should return a 16-char hex string', () => {
            expect(service.hash('test@example.com')).toMatch(/^[0-9a-f]{64}$/);
        });
        it('should produce different hashes for different emails', () => {
            expect(service.hash('alice@example.com')).not.toBe(service.hash('bob@example.com'));
        });
    });
    describe('getInitials', () => {
        it('should return initials', () => {
            expect(service.getInitials('John Doe')).toBe('JD');
            expect(service.getInitials('Alice B. Smith')).toBe('ABS');
        });
    });
});
//# sourceMappingURL=anonymization.service.spec.js.map