import { ConsensusResolver } from './consensus.resolver';

describe('ConsensusResolver (shared/fury-logic)', () => {
  it('returns UNCERTAIN for empty decisions', () => {
    const resolver = new ConsensusResolver();
    expect(resolver.resolve([])).toBe('UNCERTAIN');
  });

  it('deduplicates duplicate auditorId entries with the same decision so a single auditor cannot double-weight', () => {
    const resolver = new ConsensusResolver();
    const decisions = [
      { auditorId: 'a', integrityScore: 1.0, decision: 'BREACH' as const },
      { auditorId: 'a', integrityScore: 1.0, decision: 'BREACH' as const },
      { auditorId: 'a', integrityScore: 1.0, decision: 'BREACH' as const },
      { auditorId: 'b', integrityScore: 1.5, decision: 'CLEAN' as const },
      { auditorId: 'c', integrityScore: 1.5, decision: 'CLEAN' as const },
    ];
    expect(resolver.resolve(decisions)).toBe('CLEAN');
  });

  it('fails closed to UNCERTAIN when the same auditorId submits conflicting decisions', () => {
    const resolver = new ConsensusResolver();
    const decisions = [
      { auditorId: 'a', integrityScore: 1.0, decision: 'BREACH' as const },
      { auditorId: 'a', integrityScore: 1.0, decision: 'CLEAN' as const },
      { auditorId: 'b', integrityScore: 1.0, decision: 'BREACH' as const },
      { auditorId: 'c', integrityScore: 1.0, decision: 'BREACH' as const },
    ];
    expect(resolver.resolve(decisions)).toBe('UNCERTAIN');
  });
});
