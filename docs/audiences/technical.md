# Styx: technical edition

> An inspectable TypeScript monorepo for behavioral commitments, peer proof
> review, double-entry accounting, configurable compliance gates, and synthetic
> end-to-end demonstrations.

[Back to the project overview](../../README.md) ·
[Inspect claim evidence](../evidence/README.md) ·
[Read the API specification](../api/api--spec.md)

## Implementation status

Styx is a **prototype** with substantial implemented surface area. The source
contains local runtime and deployment paths, but this page does not characterize
it as a verified public production service. The repository's
[claim-to-control matrix](../planning/planning--implementation-status.md)
distinguishes implemented, partial, planned, and research items at feature level.

## System shape

The repository is an npm-workspace/Turborepo monorepo targeting Node.js 24.

| Workspace     | Stack                                             | Primary responsibility                                                            |
| ------------- | ------------------------------------------------- | --------------------------------------------------------------------------------- |
| `src/api`     | NestJS, PostgreSQL, Redis/BullMQ, Stripe adapters | Contracts, proof routing, ledger, payments, identity, compliance, enterprise APIs |
| `src/web`     | Next.js, React                                    | Participant dashboard, guided demo, review and administrative surfaces            |
| `src/mobile`  | React Native                                      | Camera/sensor-facing client, attestations, notifications, device integration      |
| `src/desktop` | Tauri, Vite, React                                | Internal “Judge” and operational inspection surfaces                              |
| `src/shared`  | TypeScript                                        | Shared types, constants, and behavioral algorithms                                |
| `src/pitch`   | Vite, React, p5.js                                | Interactive presentation artifact                                                 |

At a high level, a client sends an authenticated commitment or proof request to
the API. Request guards apply identity and jurisdiction policy. Domain services
write state to PostgreSQL, enqueue review work in BullMQ/Redis, and call external
providers only through configured adapters. The review result feeds the
contract and ledger state; user interfaces render those states rather than
deciding settlement independently.

## Important boundaries

| Boundary       | Repository mechanism                                                        | Why it matters                                                                                    |
| -------------- | --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Money          | Double-entry ledger plus payment-provider hold/capture/cancel paths         | An external payment event and an internal accounting entry are separate facts and must reconcile. |
| Proof          | Fury routing, consensus, honeypots, and reviewer scoring                    | A submission is not automatically equivalent to completion.                                       |
| Policy         | Compliance service, KYC/age gates, jurisdiction tiers, feature flags        | Product policy is resolved before a monetized action is allowed.                                  |
| Privacy        | Role-scoped APIs and enterprise aggregation design                          | Organizational visibility should not imply access to individual health records.                   |
| Auditability   | Hash-linked truth log, structured events, trace IDs, reconciliation scripts | Operators need to reconstruct how an outcome was produced.                                        |
| Human judgment | Peer review and appeal paths                                                | Automated routing organizes judgment; it does not eliminate contested interpretation.             |

## Local setup

Prerequisites are Node.js 24, npm 10+, PostgreSQL, and Redis. Copy the environment
example and provide environment-specific values rather than committing secrets.

```bash
cp .env.example .env
npm ci
npm run dev:migrate
npm run dev
```

The checked-in lockfile must agree with workspace manifests for `npm ci` to be a
reproducible path. If that gate fails, treat it as dependency drift to repair;
do not silently reinterpret an ad-hoc install as a clean release receipt.

For an isolated, synthetic, test-money walkthrough:

```bash
npm run demo:reset
npm run demo:launch
npm run demo:verify
```

The demo verifier is designed to exercise the API, database, browser, ledger,
proof, and behavioral routes on one commit. It does not authorize real-money use.

## Tests and validation

Run the workspaces through the repository commands rather than relying on a
number copied into prose:

```bash
make test
make test-e2e
node scripts/validation/07-claim-drift-check.js
npm run beta:readiness
```

The historical README contained a direct arithmetic contradiction: it said
`1,107` total tests while its four workspace subtotals summed to `1,207`. The
current evidence record reports the result of fresh workspace execution and
keeps historical counts labeled as historical. See
[Test verification](../evidence/README.md#test-verification).

The validation scripts separately exercise ledger balance, simulator spoofing,
full contract lifecycle, production vocabulary, behavioral constants, security
invariants, and claim drift. Some are static; others require a live local target
and must report skipped or unverified rather than passing when that target is
absent.

## Observability and failure handling

The codebase includes structured Pino logging, trace IDs, Sentry integration,
health endpoints, smoke scripts, deployment checks, queue records, and a
reconciliation-oriented audit log. Operational documents cover monitoring,
incident response, backup/recovery, and beta readiness.

Material failure modes include:

- a payment provider succeeds while internal accounting fails, or the reverse;
- a proof is duplicated, adversarial, or ambiguously judged;
- a reviewer cohort colludes or produces insufficient consensus;
- jurisdiction or identity data is absent or wrong;
- Redis/worker failure delays review without losing the authoritative record;
- environment variables point clients and servers at different targets;
- a static HTML shell returns `200` while its required assets return `404`.

The repository has code and procedures for several of these conditions, but the
existence of a handler is not the same as a production reliability measurement.

## Security and approval boundaries

Production configuration requires explicit JWT and API-key secrets. KYC,
age, and geofence checks protect monetized paths; test overrides are intended to
remain non-production. Peer verdicts and appeals retain human decision points.
External identity, payment, storage, AI, and notification providers remain
separate trust boundaries.

Review [the security policy](../../.github/SECURITY.md), the
[implementation matrix](../planning/planning--implementation-status.md), and the
[beta-readiness contract](../planning/planning--beta-readiness-contract.md)
before evaluating a release.

## Known technical debt and verification gaps

- A fresh checkout currently has dependency-lock drift, so `npm ci` is not a
  clean reproducibility receipt until the lockfile is reconciled.
- The documented public Pages root is not a functioning application as of
  2026-08-31; its HTML references missing assets.
- A deployment workflow or Render blueprint proves deployability intent, not a
  presently healthy target.
- Several controls depend on provider credentials, databases, queues, or live
  endpoints and cannot be certified by static inspection alone.
- Product safety, regulatory suitability, and enterprise-scale performance
  require evidence beyond the repository's unit and integration tests.

## Fast inspection path

1. Read the [architecture overview](../architecture/README.md).
2. Trace current claims through the
   [implementation matrix](../planning/planning--implementation-status.md).
3. Inspect the API modules under [`src/api`](../../src/api/).
4. Run the local synthetic verifier and relevant workspace tests.
5. Compare any public statement with the [evidence record](../evidence/README.md).
