# Code Review Log

Each entry documents a peer or external review of a code change that required more than CI-level scrutiny.

## Entry Template

```yaml
review: R-001
date: 2026-07-21
scope: "Escrow settlement batch flow"
files:
  - src/api/services/escrow/settlement.service.ts
  - src/api/services/escrow/settlement.service.spec.ts
reviewer: "@jtenen"
sha: abc123def
method: asynchronous PR review
findings:
  - severity: high
    description: "Race condition in batch settlement — two concurrent batches could double-withdraw"
    fix: "Added advisory lock on settlement_run_id"
  - severity: medium
    description: "Missing error logging for failed disbursements"
    fix: "Added structured error log with settlement_run context"
  - severity: low
    description: "Comment typo in line 147"
    fix: "Fixed typo"
outcome: approved
notes: "Overall logic is sound. The race condition was a real bug — recommend fuzz testing settlement paths."
```

## Entries
