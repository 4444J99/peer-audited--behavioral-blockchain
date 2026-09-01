# Styx: contribution and evaluation edition

> This page identifies what can be inspected, what the repository attributes to
> Anthony Padavano, and which ownership, deployment, and outcome claims the
> evidence does not support.

[Back to the project overview](../../README.md) ·
[Inspect technical architecture](technical.md) ·
[Audit claim evidence](../evidence/README.md)

## Initial condition and project scope

The repository records a project that grew into a Node/TypeScript monorepo with
API, web, mobile, desktop, shared, pitch, test-harness, deployment, compliance,
research, and operating-documentation surfaces. Its current wedge is a
test-money no-contact/breakup-recovery accountability flow; health/fitness and
enterprise wellness remain later applications.

The artifact is unusually broad: it combines a financial ledger, peer review,
behavioral product mechanics, multi-client interfaces, deployment automation,
and governance records. Breadth is inspectable in the tree. Production adoption
or behavioral efficacy is not inferable from that breadth.

## Anthony Padavano's recorded role

The repository's
[founder decisions of record](../planning/planning--founder-decisions-of-record.md)
assign business/commercial policy to Jessica Tenenbaum and product/technical
policy to Anthony Padavano. That ledger cites an **unsigned** founder-agreement
draft. It therefore supports a role statement, not a settled legal ownership
claim.

At the verified commit, git history attributes 191 commits to explicit Anthony
James Padavano identities and 181 to `4444jPPP` identities. Path-specific
history shows those identities across API, web, mobile, desktop, scripts, and
documentation. The repository record supports Anthony's leadership role; this
page does not rely on a legal identity inference for the `4444jPPP` name. Commit
volume is evidence of activity, not proof that every line or idea is exclusively
authored by one person.

## Inspectable contributions

| Contribution area        | What to inspect                                                            | Claim boundary                                                                                                                                |
| ------------------------ | -------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| System architecture      | Root architecture, workspace manifests, ADRs, API modules                  | Anthony led product/technical implementation according to the project record; individual files also include collaborative and automated work. |
| Ledger and payment flow  | `src/api/services`, payment/contract modules, migrations, validation gates | Source demonstrates implemented accounting and adapter paths; it does not prove production payment volume.                                    |
| Peer verification        | Fury/proof modules, reviewer scoring, consensus and honeypot tests         | Mechanisms and tests are inspectable; real-world reviewer accuracy is not established.                                                        |
| Multi-client product     | `src/web`, `src/mobile`, `src/desktop`                                     | Implemented interfaces are present; public availability is not established.                                                                   |
| Release and operations   | CI workflows, deploy scripts, beta-readiness contract, runbooks            | Automation and gates are present; the current public surface is incomplete.                                                                   |
| Documentation/governance | Decision ledgers, implementation matrix, legal/research boundaries         | The records show unusually explicit claim control; some earlier records have become stale and must be read with dates.                        |

## Evidence of engineering practice

An evaluator can inspect:

- strict TypeScript workspaces and framework-specific builds;
- unit and integration suites across API, mobile, web, and desktop;
- Playwright end-to-end configuration;
- double-entry and security invariant validation scripts;
- migration history and transactional service paths;
- CI, CodeQL, deployment, smoke, and readiness workflows;
- structured logs, trace IDs, health checks, Sentry hooks, and incident runbooks;
- decision records that separate implemented controls from research and plans.

The fresh-check caveat is material: `npm ci` currently fails because the root
manifest and lockfile are out of sync. A legacy-peer dependency installation can
support diagnostic test execution, but it is not a clean reproducible-install
receipt. See [test verification](../evidence/README.md#test-verification).

## Collaborative, generated, inherited, and external work

- **Collaborative:** Jessica Tenenbaum is identified as the business/commercial
  policy lead. The repository also contains named founder and working-session
  decisions that shape product behavior.
- **Generated or automated:** commit history includes Claude-identified and bot
  commits, plus automated dependency and workflow activity. AI assistance must
  not be collapsed into sole human authorship.
- **Inherited:** NestJS, Next.js, React Native, Tauri, PostgreSQL, Redis/BullMQ,
  Jest, Playwright, and other open-source frameworks provide substantial platform
  capabilities.
- **External:** Stripe, identity/KYC, Cloudflare R2, Gemini, Sentry, Render,
  Expo, and similar providers remain external systems and trust boundaries.

## What changed because of the work?

Within the repository, the project moved from a product proposition to a broad,
test-covered prototype with explicit contract, proof, ledger, compliance,
multi-client, release, and operating surfaces. That transformation is visible in
source and history.

This documentation intentionally stops there. It does not translate repository
scope into unverified claims of customer adoption, revenue, clinical benefit,
enterprise scale, or production reliability.

## What remains incomplete?

- Reconcile the package lock with workspace manifests so `npm ci` is clean.
- Restore or replace the broken public Pages artifact and publish a verifiable
  deployment receipt if a public demo is intended.
- Complete provider-backed and legal gates before any real-money release.
- Establish privacy, reviewer-error, reliability, and load evidence under an
  operated environment.
- Collect consented outcome and adoption data before making behavioral or
  commercial performance claims.
- Resolve the unsigned founder agreement outside the repository before making a
  definitive legal ownership statement.

## Recommended evaluation sequence

1. Read the [technical edition](technical.md) and
   [implementation matrix](../planning/planning--implementation-status.md).
2. Inspect one vertical slice: contract creation → proof → review → settlement →
   ledger/audit record.
3. Run the dependency, type, test, and claim-drift checks documented in the
   [evidence record](../evidence/README.md).
4. Review git history for the same slice rather than using commit totals alone.
5. Keep implementation quality, deployment state, authorship, and product
   outcomes as four separate evaluation questions.
