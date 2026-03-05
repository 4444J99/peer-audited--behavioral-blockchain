# Evaluation-to-Growth Exhaustive Implementation Plan (2026-03-05)

## Scope
Implement and verify the remediation tasks identified in `docs/doc--evaluation-to-growth-review.md` for repository `peer-audited--behavioral-blockchain`.

## Execution
1. Baseline current status: tests, lint, security gate, and task-by-task current-state check.
2. Implement P0 and P1 tasks completely.
3. Implement all feasible P2 tasks end-to-end with tests.
4. Implement P3-S tasks and high-leverage parts of larger P3 tasks where practical in one pass.
5. Run targeted and workspace-level tests/validations.
6. Produce a final report mapping each suggestion to: implemented, partially implemented, or blocked with reason.

## Task List (from review)
1. Fix Gate 06 recursion parameter
2. Stripe idempotency keys
3. Linguistic cloaker word boundaries
4. DOB validation hardening
5. `signToken` private
6. Ledger indexes
7. Scheduled `verifyChain` + admin endpoint
8. Event log immutability trigger
9. JWT refresh-token flow
10. Fury store cookie-auth compatibility
11. Fury store SSE-with-polling fallback
12. Account lockout
13. Aegis BMI/velocity guardrails
14. Poll timer out of Zustand state
15. Ledger integer-cent migration
16. Explicit JWT algorithms in verify
17. GDPR export/erasure
18. Next.js middleware auth guard

## Notes
- No destructive git operations.
- Keep changes scoped and test-backed.
- If full implementation of XL items is impractical in one pass, ship concrete partials with migration-safe scaffolding and explicit completion deltas.
