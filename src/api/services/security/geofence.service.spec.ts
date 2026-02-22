import { GeofenceService } from './geofence.service';
import { ForbiddenException } from '@nestjs/common';

describe('GeofenceService', () => {
  let service: GeofenceService;

  beforeEach(() => {
    service = new GeofenceService();
  });

  describe('checkJurisdiction', () => {
    it('should pass for a permissible TIER_1 jurisdiction IP (e.g. CA)', () => {
      // Mocks to CA
      expect(service.checkJurisdiction('203.0.113.1')).toBe(true);
    });

    it('should pass for a permissible TIER_2 jurisdiction IP (e.g. NY)', () => {
      // Mocks to NY
      expect(service.checkJurisdiction('172.16.5.5')).toBe(true);
    });

    it('should throw ForbiddenException if IP maps to a restricted TIER_3 state (WA)', () => {
      // Mocks to WA 
      expect(() => {
        service.checkJurisdiction('192.168.1.100');
      }).toThrow(ForbiddenException);
      expect(() => {
        service.checkJurisdiction('192.168.1.100');
      }).toThrow(/Jurisdiction Violation.*WA/);
    });

    it('should throw ForbiddenException if IP maps to a restricted TIER_3 state (AR)', () => {
      // Mocks to AR
      expect(() => {
        service.checkJurisdiction('10.0.0.50');
      }).toThrow(ForbiddenException);
      expect(() => {
        service.checkJurisdiction('10.0.0.50');
      }).toThrow(/Jurisdiction Violation.*AR/);
    });
  });
});
