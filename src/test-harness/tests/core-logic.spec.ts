import { describe, it, expect } from 'vitest';
import { LossAversionEngine } from '../../shared/behavioral-physics/loss-aversion.engine.ts';
import { VolatilityEngine } from '../../shared/behavioral-physics/volatility.engine.ts';
import { ConsensusResolver } from '../../shared/fury-logic/consensus.resolver.ts';
import { ZKExhaustVerifier } from '../../shared/privacy/zk-exhaust.verifier.ts';

describe('Styx Core Logic', () => {
  describe('LossAversionEngine', () => {
    it('calculates penalty multiplier with base coefficient 1.955', () => {
      const lae = new LossAversionEngine();
      const multiplier = lae.calculatePenaltyMultiplier(0.5);
      expect(multiplier).toBeCloseTo(1.955 * (1 + Math.log(1.5)), 3);
    });
  });

  describe('VolatilityEngine', () => {
    it('applies weekend multipliers', () => {
      const ve = new VolatilityEngine();
      const fridayNight = new Date('2026-03-13T20:00:00Z'); // Friday night
      expect(ve.getTemporalMultiplier(fridayNight)).toBe(1.25);
    });
  });

  describe('ConsensusResolver', () => {
    it('resolves BREACH when majority weight agrees', () => {
      const resolver = new ConsensusResolver();
      const verdict = resolver.resolve([
        { auditorId: 'A1', integrityScore: 0.9, decision: 'BREACH' },
        { auditorId: 'A2', integrityScore: 0.8, decision: 'BREACH' },
        { auditorId: 'A3', integrityScore: 0.4, decision: 'CLEAN' },
      ]);
      expect(verdict).toBe('BREACH');
    });
  });

  describe('ZKExhaustVerifier', () => {
    it('validates local proofs', () => {
      const proof = ZKExhaustVerifier.generateProof('Hey baby', '555-0199');
      const isValid = ZKExhaustVerifier.verify(proof, proof.senderPseudonym);
      expect(isValid).toBe(true);
    });
  });
});
