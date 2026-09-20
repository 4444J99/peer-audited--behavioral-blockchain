import { browserRegistrationOptions } from './browser-registration';

describe('browser registration identity boundary', () => {
  it('sends validated registration fields without inventing a device identity', () => {
    expect(browserRegistrationOptions('1990-01-01')).toEqual({
      ageConfirmation: true, termsAccepted: true, dateOfBirth: '1990-01-01',
    });
  });
  it('never promotes browser-local identifiers into a fingerprint', () => {
    const first = browserRegistrationOptions('1990-01-01');
    const second = browserRegistrationOptions('1991-02-03');
    expect(first).not.toHaveProperty('deviceFingerprint');
    expect(second).not.toHaveProperty('deviceFingerprint');
    expect(first.dateOfBirth).toBe('1990-01-01');
  });
});
