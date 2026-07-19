import { LossAversionEngine } from '../../shared/behavioral-physics/loss-aversion.engine.ts';
import { VolatilityEngine } from '../../shared/behavioral-physics/volatility.engine.ts';
import { ConsensusResolver, AuditorDecision } from '../../shared/fury-logic/consensus.resolver.ts';
import { ZKExhaustVerifier } from '../../shared/privacy/zk-exhaust.verifier.ts';

/**
 * Core Logic Smoke Test
 * 
 * Exercises the newly implemented Aegis Protocol and Fury Consensus engines.
 */

async function runSmokeTest() {
  console.log('🧪 Starting Styx Core Logic Smoke Test...\n');

  // 1. Behavioral Physics
  const lae = new LossAversionEngine();
  const ve = new VolatilityEngine();
  
  const volatility = 0.5;
  const multiplier = lae.calculatePenaltyMultiplier(volatility);
  const heat = ve.calculateBehavioralHeat(volatility);
  
  console.log(`[Physics] Multiplier for ${volatility} volatility: ${multiplier.toFixed(3)}`);
  console.log(`[Physics] Behavioral Heat (Temporal): ${heat.toFixed(3)}`);

  // 2. Consensus Resolver
  const resolver = new ConsensusResolver();
  const decisions: AuditorDecision[] = [
    { auditorId: 'A1', integrityScore: 0.9, decision: 'BREACH' },
    { auditorId: 'A2', integrityScore: 0.8, decision: 'BREACH' },
    { auditorId: 'A3', integrityScore: 0.4, decision: 'CLEAN' },
  ];
  
  const verdict = resolver.resolve(decisions);
  console.log(`[Consensus] Weighted Verdict: ${verdict}`);

  // 3. Privacy Verifier
  const proof = ZKExhaustVerifier.generateProof('Hey baby', '555-0199');
  const isValid = ZKExhaustVerifier.verify(proof, proof.senderPseudonym);
  console.log(`[Privacy] ZK Proof Validated: ${isValid}`);

  console.log('\n✅ Smoke test completed successfully.');
}

runSmokeTest().catch(err => {
  console.error('❌ Smoke test failed:', err);
  process.exit(1);
});
