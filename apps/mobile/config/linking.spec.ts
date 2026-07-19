import { linking, resolveNotificationDeepLink } from './linking';

describe('deep link configuration', () => {
  it('declares styx:// and com.styxprotocol.app:// prefixes', () => {
    expect(linking.prefixes).toContain('styx://');
    expect(linking.prefixes).toContain('com.styxprotocol.app://');
  });

  it('maps top-level tab screens', () => {
    const screens = linking.config?.screens as Record<string, any>;
    expect(screens.Dashboard).toBe('dashboard');
    expect(screens.Wallet).toBe('wallet');
    expect(screens.Fury).toBe('fury');
  });

  it('maps nested contracts screens', () => {
    const screens = linking.config?.screens as Record<string, any>;
    expect(screens.Contracts.screens.ContractList).toBe('contracts');
    expect(screens.Contracts.screens.ContractDetail).toBe('contracts/:contractId');
    expect(screens.Contracts.screens.Attestation).toBe('contracts/:contractId/attest');
    expect(screens.Contracts.screens.CreateContract).toBe('contracts/new');
  });

  it('maps nested profile screens', () => {
    const screens = linking.config?.screens as Record<string, any>;
    expect(screens.Profile.screens.ProfileMain).toBe('profile');
    expect(screens.Profile.screens.Settings).toBe('settings');
  });
});

describe('resolveNotificationDeepLink', () => {
  it('returns null for undefined data', () => {
    expect(resolveNotificationDeepLink(undefined)).toBeNull();
  });

  it('returns null for null data', () => {
    expect(resolveNotificationDeepLink(null as any)).toBeNull();
  });

  it('returns null for empty object', () => {
    expect(resolveNotificationDeepLink({})).toBeNull();
  });

  it('returns null for unknown notification type', () => {
    expect(resolveNotificationDeepLink({ type: 'unknown_type' })).toBeNull();
  });

  it('resolves attestation_reminder to attestation deep link', () => {
    const result = resolveNotificationDeepLink({
      type: 'attestation_reminder',
      contractId: 'abc-123',
    });
    expect(result).toBe('styx://contracts/abc-123/attest');
  });

  it('returns null for attestation_reminder without contractId', () => {
    expect(resolveNotificationDeepLink({ type: 'attestation_reminder' })).toBeNull();
  });

  it('resolves grace_day_reminder to contract detail', () => {
    const result = resolveNotificationDeepLink({
      type: 'grace_day_reminder',
      contractId: 'def-456',
    });
    expect(result).toBe('styx://contracts/def-456');
  });

  it('returns null for grace_day_reminder without contractId', () => {
    expect(resolveNotificationDeepLink({ type: 'grace_day_reminder' })).toBeNull();
  });

  it('resolves deadline_warning to contract detail', () => {
    const result = resolveNotificationDeepLink({
      type: 'deadline_warning',
      contractId: 'ghi-789',
    });
    expect(result).toBe('styx://contracts/ghi-789');
  });

  it('returns null for deadline_warning without contractId', () => {
    expect(resolveNotificationDeepLink({ type: 'deadline_warning' })).toBeNull();
  });

  it('resolves fury_assignment to fury screen', () => {
    expect(resolveNotificationDeepLink({ type: 'fury_assignment' })).toBe('styx://fury');
  });

  it('resolves verdict_result to contract detail', () => {
    const result = resolveNotificationDeepLink({
      type: 'verdict_result',
      contractId: 'jkl-012',
    });
    expect(result).toBe('styx://contracts/jkl-012');
  });

  it('returns null for verdict_result without contractId', () => {
    expect(resolveNotificationDeepLink({ type: 'verdict_result' })).toBeNull();
  });

  it('resolves wallet_update to wallet screen', () => {
    expect(resolveNotificationDeepLink({ type: 'wallet_update' })).toBe('styx://wallet');
  });
});
