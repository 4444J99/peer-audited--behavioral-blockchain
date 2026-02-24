import { HttpException, HttpStatus } from '@nestjs/common';
import { RecoveryProtocolService, RecoveryMetadata } from './recovery-protocol.service';
import { MAX_NOCONTACT_DURATION_DAYS, MAX_NOCONTACT_TARGETS } from '../../../shared/libs/behavioral-logic';

describe('RecoveryProtocolService', () => {
  let service: RecoveryProtocolService;

  const validMetadata: RecoveryMetadata = {
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
    service = new RecoveryProtocolService();
  });

  it('should accept a valid RECOVERY_NOCONTACT contract', () => {
    expect(
      service.validateRecoveryContract('RECOVERY_NOCONTACT', 14, validMetadata),
    ).toBe(true);
  });

  it('should accept a valid RECOVERY_SUBSTANCE contract (no noContactIdentifiers needed)', () => {
    const meta: RecoveryMetadata = {
      ...validMetadata,
      noContactIdentifiers: [],
    };
    expect(
      service.validateRecoveryContract('RECOVERY_SUBSTANCE', 21, meta),
    ).toBe(true);
  });

  it('should reject when metadata is missing', () => {
    expect(() =>
      service.validateRecoveryContract('RECOVERY_NOCONTACT', 14, undefined),
    ).toThrow(HttpException);
    try {
      service.validateRecoveryContract('RECOVERY_NOCONTACT', 14, undefined);
    } catch (e) {
      expect((e as HttpException).getStatus()).toBe(HttpStatus.NOT_ACCEPTABLE);
    }
  });

  it('should reject when accountability partner email is empty', () => {
    const meta: RecoveryMetadata = {
      ...validMetadata,
      accountabilityPartnerEmail: '',
    };
    expect(() =>
      service.validateRecoveryContract('RECOVERY_NOCONTACT', 14, meta),
    ).toThrow(HttpException);
  });

  it('should reject when accountability partner email is whitespace', () => {
    const meta: RecoveryMetadata = {
      ...validMetadata,
      accountabilityPartnerEmail: '   ',
    };
    expect(() =>
      service.validateRecoveryContract('RECOVERY_NOCONTACT', 14, meta),
    ).toThrow(HttpException);
  });

  it(`should reject duration exceeding ${MAX_NOCONTACT_DURATION_DAYS} days`, () => {
    expect(() =>
      service.validateRecoveryContract('RECOVERY_NOCONTACT', 60, validMetadata),
    ).toThrow(HttpException);
  });

  it('should accept duration at exactly 30 days', () => {
    expect(
      service.validateRecoveryContract('RECOVERY_NOCONTACT', MAX_NOCONTACT_DURATION_DAYS, validMetadata),
    ).toBe(true);
  });

  it('should reject RECOVERY_NOCONTACT with 0 no-contact identifiers', () => {
    const meta: RecoveryMetadata = {
      ...validMetadata,
      noContactIdentifiers: [],
    };
    expect(() =>
      service.validateRecoveryContract('RECOVERY_NOCONTACT', 14, meta),
    ).toThrow(HttpException);
  });

  it(`should reject RECOVERY_NOCONTACT with more than ${MAX_NOCONTACT_TARGETS} targets`, () => {
    const meta: RecoveryMetadata = {
      ...validMetadata,
      noContactIdentifiers: ['h1', 'h2', 'h3', 'h4'],
    };
    expect(() =>
      service.validateRecoveryContract('RECOVERY_NOCONTACT', 14, meta),
    ).toThrow(HttpException);
  });

  it('should accept RECOVERY_NOCONTACT with exactly 3 targets', () => {
    const meta: RecoveryMetadata = {
      ...validMetadata,
      noContactIdentifiers: ['h1', 'h2', 'h3'],
    };
    expect(
      service.validateRecoveryContract('RECOVERY_NOCONTACT', 14, meta),
    ).toBe(true);
  });

  it('should reject when acknowledgments are incomplete (voluntary=false)', () => {
    const meta: RecoveryMetadata = {
      ...validMetadata,
      acknowledgments: { ...validMetadata.acknowledgments, voluntary: false },
    };
    expect(() =>
      service.validateRecoveryContract('RECOVERY_NOCONTACT', 14, meta),
    ).toThrow(HttpException);
  });

  it('should reject when acknowledgments are incomplete (noMinors=false)', () => {
    const meta: RecoveryMetadata = {
      ...validMetadata,
      acknowledgments: { ...validMetadata.acknowledgments, noMinors: false },
    };
    expect(() =>
      service.validateRecoveryContract('RECOVERY_NOCONTACT', 14, meta),
    ).toThrow(HttpException);
  });
});
