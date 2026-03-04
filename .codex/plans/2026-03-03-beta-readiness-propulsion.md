# Phase-1 Beta Reliability Propulsion Plan

## Summary
Create a single executable beta-readiness contract for go/no-go decisions, enforced in CI and backed by machine-readable artifacts.

## Deliverables
- Add orchestrator script: `scripts/smoke/beta-readiness.sh`
- Add npm command: `npm run beta:readiness`
- Add CI job: `beta_readiness` in `.github/workflows/ci.yml`
- Emit and upload artifact: `artifacts/beta-readiness-summary.json`
- Add contract doc: `docs/planning/beta-readiness-contract.md`
- Sync docs: `README.md`, `docs/planning/implementation-status.md`, `docs/planning/phase1-private-beta-scope.md`

## Gate Set
- Required: `api_ready`, `api_release_meta`, `critical_endpoints`, `ledger_invariant`, `security_invariants`, `claim_drift`
- Optional: `web_availability`, `behavioral_constants`

## Status Model
- Gate: `passed`, `failed`, `skipped`
- Overall: `pass`, `fail`

## Defaults
- `READINESS_PROFILE=beta`
- `READINESS_REQUIRE_TARGETS=false`
- Target URLs can be skipped unless strict mode is enabled.
