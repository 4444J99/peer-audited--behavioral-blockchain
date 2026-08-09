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
