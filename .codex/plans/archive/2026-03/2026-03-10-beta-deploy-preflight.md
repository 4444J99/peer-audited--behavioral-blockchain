# Beta Deploy Preflight Note (2026-03-10)

Goal:

- verify the readiness script fix behaves correctly without deployed targets
- harden the beta promotion workflow so it checks the full blocker set before deploy
- audit what GitHub `beta` environment configuration actually exists today

What changed:

- confirmed `scripts/smoke/beta-readiness.sh` now runs local gates even when `BETA_API_URL` is unset
- added `scripts/smoke/beta-deploy-preflight.sh`
- added root script `npm run beta:deploy-preflight`
- updated `.github/workflows/beta-promotion.yml` preflight to require:
  - `RENDER_API_KEY`
  - `RENDER_BETA_API_SERVICE_ID`
  - `RENDER_BETA_WEB_SERVICE_ID`
  - `BETA_API_URL`
  - `BETA_WEB_URL`
  - `BETA_DATABASE_URL`
- updated the TestFlight runbook so `BETA_WEB_URL` is treated as required for the promotion workflow

CLI verification:

- `npm run beta:readiness` => `overallStatus: incomplete`
- `READINESS_REQUIRE_TARGETS=true npm run beta:readiness` => `overallStatus: fail`
- `npm run beta:deploy-preflight` => wrote `artifacts/release/evidence--beta-deploy-preflight.md`
- `gh api repos/organvm-iii-ergon/peer-audited--behavioral-blockchain/environments/beta` => environment exists
- `gh secret list --repo ...` => no repo-level secrets visible
- `gh secret list --env beta --repo ...` => no beta-environment secrets visible
- `gh variable list --env beta --repo ...` => no beta-environment variables visible

Current blocker state:

- all required beta promotion secrets are currently absent from the GitHub `beta` environment
- the workflow is now aligned with that reality and will fail immediately instead of reaching deploy/migrate/smoke with partial config

Primary artifact:

- [evidence--beta-deploy-preflight.md](/Users/4jp/Workspace/organvm-iii-ergon/peer-audited--behavioral-blockchain/artifacts/release/evidence--beta-deploy-preflight.md)
