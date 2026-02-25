"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const geofence_service_1 = require("./geofence.service");
const common_1 = require("@nestjs/common");
describe('GeofenceService', () => {
    let service;
    beforeEach(() => {
        service = new geofence_service_1.GeofenceService();
    });
    describe('checkJurisdiction', () => {
        it('should pass for a permissible TIER_1 jurisdiction IP (e.g. CA)', () => {
            expect(service.checkJurisdiction('203.0.113.1')).toBe(true);
        });
        it('should pass for a permissible TIER_2 jurisdiction IP (e.g. NY)', () => {
            expect(service.checkJurisdiction('172.16.5.5')).toBe(true);
        });
        it('should throw ForbiddenException if IP maps to a restricted TIER_3 state (WA)', () => {
            expect(() => {
                service.checkJurisdiction('192.168.1.100');
            }).toThrow(common_1.ForbiddenException);
            expect(() => {
                service.checkJurisdiction('192.168.1.100');
            }).toThrow(/Jurisdiction Violation.*WA/);
        });
        it('should throw ForbiddenException if IP maps to a restricted TIER_3 state (AR)', () => {
            expect(() => {
                service.checkJurisdiction('10.0.0.50');
            }).toThrow(common_1.ForbiddenException);
            expect(() => {
                service.checkJurisdiction('10.0.0.50');
            }).toThrow(/Jurisdiction Violation.*AR/);
        });
    });
});
//# sourceMappingURL=geofence.service.spec.js.map