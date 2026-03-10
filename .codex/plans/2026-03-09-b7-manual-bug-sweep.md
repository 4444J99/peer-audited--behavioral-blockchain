# B7 Manual Bug Sweep Plan Note (2026-03-09)

Goal:

- run the `B7` manual exploratory sweep after `B1` through `B6`
- capture real defects missed by automated suites
- save the result as a repo artifact with release impact

What was exercised:

- local web app boot in `src/web`
- local API boot in `src/api`
- manual browser exploration of:
  - homepage
  - login
  - register
  - unauthenticated dashboard access
  - responsible-use legal page

Artifacts:

- [planning--b7-manual-defect-log--2026-03-09.md](/Users/4jp/Workspace/organvm-iii-ergon/peer-audited--behavioral-blockchain/docs/planning/planning--b7-manual-defect-log--2026-03-09.md)
- [b7-console.log](/Users/4jp/Workspace/organvm-iii-ergon/peer-audited--behavioral-blockchain/output/playwright/b7-console.log)
- [b7-register-network-error.png](/Users/4jp/Workspace/organvm-iii-ergon/peer-audited--behavioral-blockchain/output/playwright/b7-register-network-error.png)

Key outcome:

- the biggest defect is backend bootstrap failure in `ComplianceModule`
- secondary defects are degraded auth UX, noisy public-page auth bootstrap, and residual homepage claim drift

Next step:

- fix the backend bootstrap issue and rerun `B7` with a real authenticated session
