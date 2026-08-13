# Styx launch gates and truth boundary

## Current package boundary

The local package is a private synthetic demonstration. “Ready” means only that the recorded local demo command and its live-stack verification pass on an exact commit. It does not mean an external beta, real-money service, clinical deployment, or public launch is approved.

## External test-money beta — all gates required

| Gate | Owner | Proof required | Next command / action |
| --- | --- | --- | --- |
| Hosted test-money environment | Engineering owner | deployed API and web URLs tied to an exact commit | run the promotion receipt against the hosted URL |
| Stripe test credentials | Payments owner | test-only credential check; no live mode key | configure the hosted test environment, then run the payment gate |
| Geography behavior | Engineering + legal owner | verified allowed and blocked path with retained test receipt | run jurisdiction verification on the hosted environment |
| Consent and support operations | Founder / operations owner | approved participant consent, support route, and incident contact process | attach approved operational receipt |
| Repaired live verification | Engineering owner | API, database, browser, ledger, proof, and behavioral checks pass on the same hosted commit | run `npm run demo:verify` locally and the hosted equivalent |

Until every row is proven, the external beta remains blocked. The safe public statement is “private synthetic demo only.”

## Gate audit — 2026-08-13

Read-only audit of live state. No gate was attempted or cleared; this section records what is
actually true so the table above is not read from memory. Re-derive it, do not trust it stale.

| Gate | Status | Evidence read today |
| --- | --- | --- |
| Hosted test-money environment | **Open** | No hosted deployment has been promoted. The `beta` environment exists but no promotion receipt is attached to a commit. |
| Deployment credentials | **Materially advanced — no longer a blanket blocker** | The `beta` environment holds `RENDER_API_KEY`, `RENDER_BETA_API_SERVICE_ID`, `RENDER_BETA_WEB_SERVICE_ID`, `BETA_API_URL`, `BETA_WEB_URL`, `BETA_DATABASE_URL`, `BETA_ENV_LABEL`. One named gap remains: `.github/workflows/beta-promotion.yml` also consumes `secrets.BETA_DEMO_PASSWORD`, which is **not** set in any scope. |
| Stripe test credentials | **Open** | No Stripe credential exists at repository or environment scope. The local demo does not need one — `scripts/demo/local-secrets.sh` generates a process-local value and the test-money rail never contacts Stripe — so this gate blocks only the *hosted* beta. |
| Geography behavior | **Open** | Not verifiable without a hosted environment. `src/api/services/security/geofence.service.ts` and `compliance-policy.service.ts` are the implementing surfaces; the native demo runs with `GEOFENCE_FAIL_OPEN_ON_MISSING_HEADERS=true`, which is a demo posture, not a verified jurisdiction path. |
| Consent and support operations | **Open** | Founder/operations owner; no approved operational receipt is attached. |
| Repaired live verification | **Passed locally, on the Docker-free native path** | `npm run demo:reset:verify` exited 0 twice consecutively today, reporting the live API, browser, ledger, proof, behavioral, coach and enterprise-preview checks plus 12 synthetic identities. This is the local half only; the hosted equivalent remains unrun. |

Phase epics, read live: **#555 Beta, #556 Gamma, #557 Delta, #558 Omega — all four OPEN**, all
labelled `epic`, none updated since 2026-07-30.

Two findings outside the table, recorded so they are not rediscovered:

- `.github/workflows/deploy-ask-styx.yml` builds with `VITE_WORKER_URL: ${{ vars.ASK_STYX_WORKER_URL }}`,
  and **no Actions variable is defined at repository or environment scope**. The published Ask Styx
  page therefore ships an empty worker URL. This is the pre-existing state, not a regression.
- The `staging` and `github-pages` environments hold no secrets or variables.

## Real money or public launch — deliberately blocked

| Gate | Why it remains a gate |
| --- | --- |
| Legal, custody, and jurisdiction sign-off | Real-money movement and geographic availability cannot be inferred from a local demo. |
| Merchant and payment approval | No test-credit ledger is evidence of merchant approval or settlement readiness. |
| Deployment credentials and operations | A local Compose stack is not a hosted production service. |
| App-store readiness | A demo route is not an approved mobile release. |

These are safeguards, not missing engineering claims. They must be signed off by their accountable owners before the product is described as real-money or publicly launched.

## Supporting theory and art

Theory and art are supporting evidence only. Their companion-repository pull requests are intentionally not merged by this package; each needs a fresh passing-check receipt in its own repository before any integration decision.
