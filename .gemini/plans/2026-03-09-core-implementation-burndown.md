# Plan: Core Implementation Burndown (2026-03-09)

I am focusing on the **Core Intelligence & Ledger Implementation** boundary. This involves codifying the mathematical theorems from the behavioral manifesto into the runtime services.

## Objectives
Implement Theorems 2, 7, and 8 in the Styx API services to ensure cryptographic integrity, auditor honesty, and psychological safety.

## Proposed Boundary
**API / Core Services**
- Files: `src/api/services/ledger/truth-log.service.ts`, `src/api/services/intelligence/honeypot.service.ts`, `src/api/services/health/recovery-protocol.service.ts`
- Focus: Hash chains, Honeypot convergence logic, and Anti-isolation guardrails.

## Sub-tasks
1. **[Truth Log]** Implement **Theorem 2 (Sequential Integrity)**:
   - Update `appendEvent` to include a sequence index and timestamp in the hash preimage.
   - Standardize `GENESIS_HASH` to a fixed 64-char hex value.
2. **[Honeypot]** Implement **Theorem 7 (Honeypot Convergence)**:
   - Add dynamic injection probability based on total audit volume.
   - Implement shadow-banning for Furies below an integrity threshold.
3. **[Recovery]** Implement **Theorem 8 (Anti-isolation Guardrails)**:
   - Add `checkIsolationRisk` to prevent excessive blocking across active contracts.
   - Validate accountability partner status before contract activation.

## Validation Strategy
- **Unit Tests**: Update existing `.spec.ts` files for each service to verify the new logic.
- **Ledger Audit**: Run `verifyChain()` after multiple events to ensure the new hash preimage logic works.
- **Honeypot Flow**: Manually trigger `injectHoneypot` and verify job creation in the Fury Router.
