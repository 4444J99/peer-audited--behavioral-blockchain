"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const aegis_service_1 = require("./aegis.service");
describe('AegisProtocolService', () => {
    let service;
    beforeEach(() => {
        service = new aegis_service_1.AegisProtocolService();
    });
    describe('validatePsychologicalGuardrails', () => {
        it('should pass for a safe contract ($100 stake, 30 days, good score)', () => {
            const isValid = service.validatePsychologicalGuardrails(100, 30, 80, 0);
            expect(isValid).toBe(true);
        });
        it('should throw HttpException (406) if stake exceeds absolute ceiling ($500)', () => {
            expect(() => {
                service.validatePsychologicalGuardrails(600, 30, 90, 0);
            }).toThrow(/Proposed stake .* exceeds the absolute psychological safety ceiling/);
        });
        it('should throw HttpException (406) if duration is too short (< 7 days)', () => {
            expect(() => {
                service.validatePsychologicalGuardrails(50, 5, 80, 0);
            }).toThrow(/Proposed duration .* is beneath the clinical threshold/);
        });
        it('should throw HttpException (406) to prevent downward spiral (3+ failures & >$50 stake)', () => {
            expect(() => {
                service.validatePsychologicalGuardrails(100, 14, 80, 4);
            }).toThrow(/After 4 recent contract failures, your maximum allowed stake is strictly capped at \$50/);
        });
        it('should throw HttpException (406) if integrity score is low (< 40) and stake is high (>$100)', () => {
            expect(() => {
                service.validatePsychologicalGuardrails(200, 14, 30, 0);
            }).toThrow(/A low Integrity Score .* restricts stakes to a maximum of \$100/);
        });
    });
});
//# sourceMappingURL=aegis.service.spec.js.map