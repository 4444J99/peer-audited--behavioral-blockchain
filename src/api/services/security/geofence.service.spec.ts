jest.mock('geoip-lite', () => ({ lookup: jest.fn() }));

import { GeofenceService } from './geofence.service';
import { ForbiddenException } from '@nestjs/common';
import * as geoip from 'geoip-lite';

const mockLookup = geoip.lookup as jest.Mock;

describe('GeofenceService', () => {
  let service: GeofenceService;

  beforeEach(() => {
    service = new GeofenceService();
    mockLookup.mockReset();
  });

  describe('lookupState', () => {
    it('should return the US state region for a US IP', () => {
      mockLookup.mockReturnValue({ country: 'US', region: 'CA' });
      expect(service.lookupState('8.8.8.8')).toBe('CA');
    });

    it('should return null for a non-US IP', () => {
      mockLookup.mockReturnValue({ country: 'DE', region: 'BE' });
      expect(service.lookupState('1.2.3.4')).toBeNull();
    });

    it('should return null for an unresolvable IP', () => {
      mockLookup.mockReturnValue(null);
      expect(service.lookupState('0.0.0.0')).toBeNull();
    });
  });

  describe('checkJurisdiction', () => {
    it('should pass for a permissible TIER_1 jurisdiction (CA)', () => {
      mockLookup.mockReturnValue({ country: 'US', region: 'CA' });
      expect(service.checkJurisdiction('8.8.8.8')).toBe(true);
    });

    it('should pass for a permissible TIER_2 jurisdiction (NY)', () => {
      mockLookup.mockReturnValue({ country: 'US', region: 'NY' });
      expect(service.checkJurisdiction('8.8.4.4')).toBe(true);
    });

    it('should throw ForbiddenException for restricted TIER_3 state (WA)', () => {
      mockLookup.mockReturnValue({ country: 'US', region: 'WA' });
      expect(() => service.checkJurisdiction('1.2.3.4')).toThrow(ForbiddenException);
      expect(() => service.checkJurisdiction('1.2.3.4')).toThrow(/Jurisdiction Violation.*WA/);
    });

    it('should throw ForbiddenException for restricted TIER_3 state (AR)', () => {
      mockLookup.mockReturnValue({ country: 'US', region: 'AR' });
      expect(() => service.checkJurisdiction('1.2.3.4')).toThrow(ForbiddenException);
      expect(() => service.checkJurisdiction('1.2.3.4')).toThrow(/Jurisdiction Violation.*AR/);
    });

    it('should pass for a non-US IP (defaults to TIER_1)', () => {
      mockLookup.mockReturnValue({ country: 'DE', region: 'BE' });
      expect(service.checkJurisdiction('1.2.3.4')).toBe(true);
    });

    it('should pass for an unresolvable IP (defaults to TIER_1)', () => {
      mockLookup.mockReturnValue(null);
      expect(service.checkJurisdiction('0.0.0.0')).toBe(true);
    });
  });
});
