# Styx verification receipt — 2026-09-08

**Commit:** `3ca8c3452e7fa0f5185560f6e2e547bfb4a3d649`  
**Repository:** `4444J99/peer-audited--behavioral-blockchain`  
**Scope:** current-head Node 24 CI and public Pages observation  
**Observed at:** `2026-09-08T12:55:21Z`

This receipt records executed validation and live HTTP observations. It is not deployment or production-operation evidence.

## Current-head validation

GitHub Actions run `34228809266` executed the Styx CI/CD Pipeline on Node 24.x. The following completed successfully:

- dependency installation
- Turborepo tests
- coverage artifact upload
- Turborepo build
- lint
- redacted-build gate
- behavioral-physics gate
- security-invariant gate
- claim-drift gate
- compliance-artifact gate
- aggregate build-and-test verdict
- E2E gate verdict
- Terraform format, initialization, and validation

Secret Scan run `34228809357`, CodeQL run `34228809345`, and Release Drafter run `34228809330` also completed successfully at the same head.

The formerly failing zero-escrow behavioral test was corrected to match the existing custody rule: a zero-dollar contract does not request an external escrow hold. This is validation evidence for the repository implementation, not proof of a deployed payment or escrow service.

## Public Pages observation

A live HTTP request returned `200` for:

`https://4444j99.github.io/peer-audited--behavioral-blockchain/`

The returned Ask Styx HTML referenced:

- `/ask-styx/assets/index-D1Ny8FSA.js`
- `/ask-styx/assets/index-DlLXixHf.css`

Both referenced host-level assets returned `404`. The corresponding repository-root asset request also returned `404`. The public endpoint is therefore an HTML shell with missing required assets, not a usable deployed application.

## Evidence classification

- Source at the commit: implementation evidence.
- Successful Node 24 CI: validation evidence.
- Broken Pages shell: failed deployment evidence.
- No live payment, escrow, or production workflow was exercised; operational evidence remains absent.
