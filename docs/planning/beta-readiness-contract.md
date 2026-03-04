# Beta Readiness Contract (Phase 1 Private Beta)

This contract defines the canonical go/no-go checks for the Phase 1 private beta lane.

## Scope

- Surface: iOS-first private beta (`Test-Money Pilot`, `US Allowlist`)
- Supporting surfaces: internal web/admin and desktop judge workflows
- Objective: deterministic release readiness from executable evidence

## Readiness Command

Run the full suite with:

```bash
npm run beta:readiness
```

Default profile is `beta`.

To run against staging:

```bash
READINESS_PROFILE=staging npm run beta:readiness
```

## Environment Inputs

For `READINESS_PROFILE=beta`:

- `BETA_API_URL` (required target for full verification)
- `BETA_WEB_URL` (optional)
- `BETA_ENV_LABEL` (optional, defaults to `beta`)

For `READINESS_PROFILE=staging`:

- `STAGING_API_URL` (required target for full verification)
- `STAGING_WEB_URL` (optional)
- `STAGING_ENV_LABEL` (optional, defaults to `staging`)

Control flags:

- `READINESS_REQUIRE_TARGETS` (`true` or `false`, default `false`)
- `READINESS_OUTPUT_PATH` (defaults to `artifacts/beta-readiness-summary.json`)
- `READINESS_RUN_ID` (optional custom run identifier)

## Gate Matrix

| Gate | Required | Command | Owner | Notes |
|---|---|---|---|---|
| `api_ready` | Yes | `scripts/smoke/check-api-ready.sh` | API / Platform | Polls `/health/ready` until ready or timeout |
| `api_release_meta` | Yes | `scripts/smoke/check-api-release.sh` | API / Platform | Validates `/meta/release` contract |
| `web_availability` | No | `scripts/smoke/check-web.sh` | Web / Platform | Optional if `*_WEB_URL` is configured |
| `critical_endpoints` | Yes | `scripts/smoke/check-endpoints.sh` | API / Web | Validates health, auth guards, legal routes |
| `ledger_invariant` | Yes | `scripts/validation/01-phantom-money-check.ts` | API | Verifies no phantom-money behavior |
| `behavioral_constants` | No | `scripts/validation/05-behavioral-physics-check.ts` | API / Shared | Exit code `2` is recorded as `skipped` |
| `security_invariants` | Yes | `scripts/validation/06-security-invariant-check.ts` | Platform | Compiled-output secret/backdoor sweep |
| `claim_drift` | Yes | `scripts/validation/07-claim-drift-check.js` | Platform / Docs | Ensures docs path references remain valid |

## Status Semantics

- Gate statuses: `passed`, `failed`, `skipped`
- Overall statuses: `pass`, `fail`

Rules:

- Any failed required gate sets overall status to `fail`.
- Optional gate failures are recorded but do not fail overall.
- Missing target URLs are recorded as `skipped`; they fail overall only when `READINESS_REQUIRE_TARGETS=true`.

## Output Artifact

Path: `artifacts/beta-readiness-summary.json`

Schema:

```json
{
  "runId": "beta-readiness-20260303T210000Z",
  "profile": "beta",
  "startedAt": "2026-03-03T21:00:00Z",
  "finishedAt": "2026-03-03T21:04:00Z",
  "overallStatus": "pass",
  "gates": [
    {
      "name": "api_ready",
      "status": "passed",
      "durationMs": 11000,
      "message": "ok"
    }
  ]
}
```

## CI Policy

- CI runs the readiness suite in a dedicated `beta_readiness` job.
- CI sets `READINESS_REQUIRE_TARGETS=true` (missing target URLs fail readiness).
- Artifact upload is unconditional (`if: always()`).
- `beta_readiness` is required before E2E execution.

## Change Control

Any change to gate definitions, required/optional policy, or readiness env behavior must update:

- this contract,
- `docs/planning/phase1-private-beta-scope.md`,
- `docs/planning/implementation-status.md`.
