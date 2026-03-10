# Plan: Core Implementation Burndown - Theorems 2, 7, 8 (2026-03-09)

Implementing core mathematical theorems from the behavioral manifesto into the runtime services.

## Objectives
Codify Theorems 2, 7, and 8 in the Styx API services to ensure cryptographic integrity, auditor honesty, and psychological safety.

## Proposed Boundary
**API / Core Services**
- `src/api/services/ledger/truth-log.service.ts`
- `src/api/services/intelligence/honeypot.service.ts`
- `src/api/services/health/recovery-protocol.service.ts`
- `src/shared/libs/behavioral-logic.ts`

## Sub-tasks

1.  **[Shared] Standardize Constants**
    *   Move `ABSOLUTE_MAX_ISOLATION_TARGETS = 10` to `src/shared/libs/behavioral-logic.ts`.
    *   Add `GENESIS_HASH = '0000000000000000000000000000000000000000000000000000000000000000'` to `src/shared/libs/behavioral-logic.ts`.

2.  **[Truth Log] Implement Theorem 2 (Sequential Integrity)**
    *   Update `TruthLogService` to use constants from `behavioral-logic.ts`.
    *   Ensure `appendEvent` and `verifyChain` strictly follow `SHA256(index | timestamp | prev_hash | payload)`.
    *   Validate that `verifyChain` accurately detects index and hash mismatches.

3.  **[Honeypot] Implement Theorem 7 (Honeypot Convergence)**
    *   Update `HoneypotService` to use constants from `behavioral-logic.ts`.
    *   Refine `shouldInject` probability logic to ensure it aligns with the manifesto's adversarial equilibrium.
    *   Implement shadow-banning for Furies below the integrity threshold (`SHADOW_BAN_THRESHOLD = 20`).

4.  **[Recovery] Implement Theorem 8 (Anti-isolation Guardrails)**
    *   Update `RecoveryProtocolService` to use constants from `behavioral-logic.ts`.
    *   Refine `checkIsolationRisk` to include active substance/detox oaths if they imply isolation.

## Validation Strategy
- **Unit Tests**: Run `npm run test -- src/api/services/ledger/truth-log.service.spec.ts src/api/services/intelligence/honeypot.service.spec.ts src/api/services/health/recovery-protocol.service.spec.ts` after each change.
- **Regression Check**: Ensure existing tests for `ContractsService` (which uses these protocols) still pass where relevant.
