# `scripts/smoke/` — Surface Index

Post-deploy smoke & readiness gates. **User/buyer:** release engineer / CI pipeline
verifying a staging or beta deploy is live and correct. Most read URLs from env vars and
exit nonzero on failure. Template: [`../SURFACE-PACKET.template.md`](../SURFACE-PACKET.template.md).

| Name | Problem solved | Run | Verify | Safety | Level |
|------|----------------|-----|--------|--------|-------|
| `beta-smoke.sh` | One-shot beta smoke: readiness + release + endpoints | `BETA_API_URL=… bash scripts/smoke/beta-smoke.sh` | All sub-checks exit 0 | Read-only HTTP to configured beta API | L1 |
| `staging-smoke.sh` | Same orchestration against staging | `STAGING_API_URL=… bash scripts/smoke/staging-smoke.sh` | All sub-checks exit 0 | Read-only HTTP to staging API | L1 |
| `check-api-ready.sh` | Wait for API `/health/ready` to come up | `API_URL=… bash scripts/smoke/check-api-ready.sh` | Exit 0 once ready within `MAX_ATTEMPTS`×`INTERVAL_SECONDS` | Read-only polling | L0 |
| `check-api-release.sh` | Assert `/meta/release` matches expected service/env | `API_URL=… EXPECTED_ENV_LABEL=… bash …/check-api-release.sh` | Exit 0 when service+env match | Read-only | L0 |
| `check-endpoints.sh` | Validate critical API routes respond | called by `*-smoke.sh` (`API_URL=…`) | Prints PASS/FAIL/WARN counts; exit 1 if any FAIL | Read-only route probes | L0 |
| `check-web.sh` | Web front-end smoke (skippable) | `WEB_URL=… bash scripts/smoke/check-web.sh` | Exit 0 when web responds; warns+skips if `WEB_URL` unset | Read-only | L0 |
| `beta-readiness.sh` | Produce a beta-readiness summary artifact | `npm run beta:readiness` | Writes `artifacts/beta-readiness-summary.json` | Read/aggregate; writes one artifact | L1 |
| `beta-deploy-preflight.sh` | Assert required env/secrets present before beta deploy | `npm run beta:deploy-preflight` | Writes `artifacts/release/evidence--beta-deploy-preflight.md`; fails on missing secrets | Inspects env presence (values not logged) | L1 |
| `vanguard-ignition.sh` | TestFlight/staging deploy pipeline (Vector 4) | `bash scripts/smoke/vanguard-ignition.sh` | Runs core validation gates then deploy steps | Triggers a deployment sequence — gate before prod | L1 |

> **Disable/uninstall (all):** stateless CLIs — stop invoking / remove from the CI workflow.
> **Proof:** each uses `set -euo pipefail` (except `vanguard-ignition.sh`: `set -e`) and
> requires its URL/secret env vars (`:?` guards). Capture a live run log on next deploy.
