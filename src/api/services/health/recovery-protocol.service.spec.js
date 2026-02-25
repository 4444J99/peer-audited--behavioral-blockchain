"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const recovery_protocol_service_1 = require("./recovery-protocol.service");
const behavioral_logic_1 = require("../../../shared/libs/behavioral-logic");
describe('RecoveryProtocolService', () => {
    let service;
    const validMetadata = {
        accountabilityPartnerEmail: 'friend@example.com',
        noContactIdentifiers: ['hash_abc123'],
        acknowledgments: {
            voluntary: true,
            noMinors: true,
            noDependents: true,
            noLegalObligations: true,
        },
    };
    beforeEach(() => {
        service = new recovery_protocol_service_1.RecoveryProtocolService();
    });
    it('should accept a valid RECOVERY_NOCONTACT contract', () => {
        expect(service.validateRecoveryContract('RECOVERY_NOCONTACT', 14, validMetadata)).toBe(true);
    });
    it('should accept a valid RECOVERY_SUBSTANCE contract (no noContactIdentifiers needed)', () => {
        const meta = {
            ...validMetadata,
            noContactIdentifiers: [],
        };
        expect(service.validateRecoveryContract('RECOVERY_SUBSTANCE', 21, meta)).toBe(true);
    });
    it('should reject when metadata is missing', () => {
        expect(() => service.validateRecoveryContract('RECOVERY_NOCONTACT', 14, undefined)).toThrow(common_1.HttpException);
        try {
            service.validateRecoveryContract('RECOVERY_NOCONTACT', 14, undefined);
        }
        catch (e) {
            expect(e.getStatus()).toBe(common_1.HttpStatus.NOT_ACCEPTABLE);
        }
    });
    it('should reject when accountability partner email is empty', () => {
        const meta = {
            ...validMetadata,
            accountabilityPartnerEmail: '',
        };
        expect(() => service.validateRecoveryContract('RECOVERY_NOCONTACT', 14, meta)).toThrow(common_1.HttpException);
    });
    it('should reject when accountability partner email is whitespace', () => {
        const meta = {
            ...validMetadata,
            accountabilityPartnerEmail: '   ',
        };
        expect(() => service.validateRecoveryContract('RECOVERY_NOCONTACT', 14, meta)).toThrow(common_1.HttpException);
    });
    it(`should reject duration exceeding ${behavioral_logic_1.MAX_NOCONTACT_DURATION_DAYS} days`, () => {
        expect(() => service.validateRecoveryContract('RECOVERY_NOCONTACT', 60, validMetadata)).toThrow(common_1.HttpException);
    });
    it('should accept duration at exactly 30 days', () => {
        expect(service.validateRecoveryContract('RECOVERY_NOCONTACT', behavioral_logic_1.MAX_NOCONTACT_DURATION_DAYS, validMetadata)).toBe(true);
    });
    it('should reject RECOVERY_NOCONTACT with 0 no-contact identifiers', () => {
        const meta = {
            ...validMetadata,
            noContactIdentifiers: [],
        };
        expect(() => service.validateRecoveryContract('RECOVERY_NOCONTACT', 14, meta)).toThrow(common_1.HttpException);
    });
    it(`should reject RECOVERY_NOCONTACT with more than ${behavioral_logic_1.MAX_NOCONTACT_TARGETS} targets`, () => {
        const meta = {
            ...validMetadata,
            noContactIdentifiers: ['h1', 'h2', 'h3', 'h4'],
        };
        expect(() => service.validateRecoveryContract('RECOVERY_NOCONTACT', 14, meta)).toThrow(common_1.HttpException);
    });
    it('should accept RECOVERY_NOCONTACT with exactly 3 targets', () => {
        const meta = {
            ...validMetadata,
            noContactIdentifiers: ['h1', 'h2', 'h3'],
        };
        expect(service.validateRecoveryContract('RECOVERY_NOCONTACT', 14, meta)).toBe(true);
    });
    it('should reject when acknowledgments are incomplete (voluntary=false)', () => {
        const meta = {
            ...validMetadata,
            acknowledgments: { ...validMetadata.acknowledgments, voluntary: false },
        };
        expect(() => service.validateRecoveryContract('RECOVERY_NOCONTACT', 14, meta)).toThrow(common_1.HttpException);
    });
    it('should reject when acknowledgments are incomplete (noMinors=false)', () => {
        const meta = {
            ...validMetadata,
            acknowledgments: { ...validMetadata.acknowledgments, noMinors: false },
        };
        expect(() => service.validateRecoveryContract('RECOVERY_NOCONTACT', 14, meta)).toThrow(common_1.HttpException);
    });
});
//# sourceMappingURL=recovery-protocol.service.spec.js.map