# ADR-004: Fury Consensus Engine (3-Auditor Anonymous Routing)

## Status

Accepted

## Context

Styx contracts require human verification of proof submissions (photos, videos, sensor data). The verification system must:

1. Prevent self-review (submitter cannot audit their own proof)
2. Maintain auditor anonymity (auditors don't know who else is reviewing)
3. Reach consensus from multiple independent judgments
4. Incentivize honest review through financial stakes
5. Handle edge cases: ties, abstentions, auditor dropout

## Decision

Implement a **3-auditor anonymous routing engine** using BullMQ for asynchronous job dispatch:

```
Proof submitted
    ↓
FuryRouterService.routeProof()
    ↓
BullMQ enqueues "route-fury-review" job
    ↓
Worker selects 3 eligible auditors where:
  - auditor.id != submitter.id (no self-review)
  - auditor.integrity_score >= threshold
  - auditor.is_staked == true ($2.00 per audit)
  - auditor not already assigned to this proof
    ↓
3 independent review_assignments created
    ↓
Each auditor reviews proof in isolation
    ↓
Verdicts collected → consensus algorithm
    ↓
  2/3 or 3/3 agreement → verdict accepted
  3-way split → escalation to senior auditor pool
```

**Implementation**:
- Routing: `src/api/services/fury-router/fury-router.service.ts`
- Queue config: `src/api/config/queue.config.ts` (queue name: `FURY_ROUTER_QUEUE`)
- Module wiring: `src/api/src/modules/fury/`
- Accuracy tracking: `src/shared/libs/integrity.ts` (`calculateFuryAccuracy`)

### Accuracy & Incentives

- **Accuracy formula**: `(successful - false_accusations * 3) / total`
- **Burn-in**: First 10 audits are calibration — no demotion during this period
- **Demotion threshold**: Accuracy < 0.8 after burn-in triggers demotion
- **Auditor stake**: $2.00 per audit, forfeited on false accusation
- **False accusation penalty**: 3x weight in accuracy calculation

### Job Configuration

- Retry: 3 attempts with exponential backoff (2s base)
- Idempotent: job data includes `proofId` + `dispatchedAt` for deduplication

## Consequences

**Positive:**
- Anonymity prevents social pressure or collusion between auditors
- 3-auditor minimum provides statistical confidence in verdicts
- Financial stakes (auditor deposits) align incentives with honest review
- BullMQ provides reliable delivery, retry, and observability
- Asynchronous routing decouples proof submission from audit assignment

**Negative:**
- 3-auditor requirement means the platform needs a minimum auditor pool to function (cold-start problem)
- Auditor dropout mid-review requires re-routing (adds latency)
- $2.00 stake may be too low to attract serious auditors at scale, or too high for casual participants
- Consensus on subjective proofs (e.g., "did they really exercise?") has inherent ambiguity

## Alternatives Considered

1. **Single auditor** — rejected. Too easy to game, no consensus mechanism, single point of corruption.

2. **5-auditor panel** — considered for high-stakes contracts. Deferred to post-beta. 3 is sufficient for micro-stakes ($5-$100) and reduces auditor pool requirements.

3. **Automated AI review** — rejected as primary mechanism. AI can assist (flag obvious fakes via pHash duplicate detection in `src/api/services/anomaly/`), but human judgment is essential for subjective behavioral proofs. May be added as a pre-filter.

4. **On-chain consensus** — rejected for beta. Gas costs and latency are prohibitive for the target volume. The BullMQ approach gives equivalent guarantees for a centralized platform.

## Related

- ADR-001: Domain services (`services/fury-router/`) separated from NestJS modules (`src/modules/fury/`)
- ADR-002: FBO escrow funds the auditor bounty payouts
- Validation gate 08: `scripts/validation/08-fury-crucible-simulation.ts`
- Integrity score algorithm: `src/shared/libs/integrity.ts`
