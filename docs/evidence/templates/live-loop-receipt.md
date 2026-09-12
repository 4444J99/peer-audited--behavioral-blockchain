# Live Loop Receipt Template

> Mandatory receipt for every PR or commit closing or advancing an issue through Phase Omega.
> No PR may be merged into `lane/*` or `main` without completing this verification receipt.

---

### LIVE LOOP RECEIPT
- **Date**: `YYYY-MM-DDTHH:MM:SSZ`
- **Environment**: `[local-synthetic | render-staging | render-prod | cloudflare-pages]`
- **Head SHA**: `[commit-sha]`
- **Owning Lane**: `[lane/verify | lane/heal | lane/expand-product | lane/expand-external | lane/evolve-platform]`
- **Issue(s) Addressed**: `[#issue-number]`
- **Money Mode**: `[Test Money (Stripe Mock/Dev) | Real Money (Stripe FBO Live)]`
- **Surfaces Exercised**: `[API | Web | Mobile | Desktop | Ask Styx]`

#### Verification Invariants
- [ ] **Contract Lifecycle**: `[Created -> Held -> Proof Submitted -> Fury Consensused -> Captured/Cancelled]`
- [ ] **Ledger Balance Integrity (Gate 01)**: Balanced debits and credits; zero phantom funds (`scripts/validation/01-phantom-money-check.ts`).
- [ ] **Linguistic Cloaker (Gate 04)**: Production build contains zero prohibited gambling terminology (`scripts/validation/04-redacted-build-check.sh`).
- [ ] **Behavioral Physics (Gate 05)**: $\lambda = 1.955$ and loss-aversion constants match ORGAN-I theory (`scripts/validation/05-behavioral-physics-check.ts`).
- [ ] **Claim Drift (Gate 07)**: Documentation and project records reflect observed reality (`scripts/validation/07-claim-drift-check.js`).

#### Telemetry & HTTP Observation
- **URL & Status Codes**:
  - `Root URL`: `HTTP [code]`
  - `Assets (JS/CSS)`: `HTTP [code]`
  - `Health Endpoint (/health)`: `HTTP [code]`
- **Readiness Artifact**: `[path/to/artifact.json or N/A]`
- **Fail-Closed Cases Tested**: `[e.g., Missing geo-headers rejected with 403; bad proof rejected with honeypot strike]`
- **User Count Band**: `[≤10 dogfood | 50–100 beta | 500+ open beta | 0 (CI only)]` *(Strictly no PII)*

---
*Signed by Autonomous Agent / Engineer: `[Agent ID / Name]`*
