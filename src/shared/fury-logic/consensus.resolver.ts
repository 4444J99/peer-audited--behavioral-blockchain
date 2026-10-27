/**
 * ConsensusResolver
 * 
 * Determines the "Truth" of a whistleblower claim based on the weighted 
 * decisions of multiple peering auditors.
 */

export interface AuditorDecision {
  auditorId: string;
  integrityScore: number; // 0.0 to 1.0
  decision: 'BREACH' | 'CLEAN';
}

export class ConsensusResolver {
  /**
   * Resolves the final verdict based on weighted majority.
   * Deduplicates repeated auditorIds; fails closed ('UNCERTAIN') if the same
   * auditor submits conflicting decisions.
   */
  public resolve(decisions: AuditorDecision[]): 'BREACH' | 'CLEAN' | 'UNCERTAIN' {
    if (decisions.length === 0) return 'UNCERTAIN';

    const seenDecisions = new Map<string, 'BREACH' | 'CLEAN'>();
    const uniqueDecisions: AuditorDecision[] = [];

    for (const d of decisions) {
      const existing = seenDecisions.get(d.auditorId);
      if (existing === undefined) {
        seenDecisions.set(d.auditorId, d.decision);
        uniqueDecisions.push(d);
      } else if (existing !== d.decision) {
        return 'UNCERTAIN';
      }
    }

    let breachWeight = 0;
    let cleanWeight = 0;

    uniqueDecisions.forEach(d => {
      if (d.decision === 'BREACH') {
        breachWeight += d.integrityScore;
      } else {
        cleanWeight += d.integrityScore;
      }
    });

    const totalWeight = breachWeight + cleanWeight;
    if (totalWeight === 0) return 'UNCERTAIN';

    const breachConfidence = breachWeight / totalWeight;

    if (breachConfidence > 0.66) return 'BREACH';
    if (breachConfidence < 0.33) return 'CLEAN';
    
    return 'UNCERTAIN';
  }
}
