# Styx: The Blockchain of Truth

> A software prototype for creating behavioral commitments, collecting proof,
> and routing that proof through peer review, with test-money and payment-adapter
> paths for studying how financial stakes change follow-through.

[Start with the plain-language explanation](docs/audiences/general.md) ·
[Read the technical edition](docs/audiences/technical.md) ·
[Study the humanities questions](docs/audiences/humanities.md) ·
[Assess an operational use](docs/audiences/business.md) ·
[Inspect contribution evidence](docs/audiences/evaluator.md) ·
[Audit the claims](docs/evidence/README.md)

## What am I looking at?

This is the source repository and project record for Styx. A repository is the
organized collection of code, tests, documentation, design decisions, and
revision history used to build and inspect a software project.

Styx is currently a **prototype**, not a publicly verified production service.
The repository contains implemented API, web, mobile, desktop, synthetic-demo,
and deployment paths. On 2026-08-31, the public Pages URL returned an HTML shell,
but its required assets and the documented launch routes returned `404`; no
public API or full web deployment was independently verified. See the
[evidence record](docs/evidence/README.md) for the exact boundary.

## Choose your reading path

| I am reading as... | Start here | First question answered |
| --- | --- | --- |
| A general or nontechnical reader | [Plain-language edition](docs/audiences/general.md) | What is this, and what happens when someone uses it? |
| A software engineer | [Technical edition](docs/audiences/technical.md) | How is it built, tested, and bounded? |
| A humanities scholar, artist, or educator | [Humanities edition](docs/audiences/humanities.md) | What does peer judgment turn into knowledge, memory, and power? |
| An operator, founder, or prospective client | [Business edition](docs/audiences/business.md) | What workflow might this change, and what is only proposed? |
| A hiring manager, collaborator, or funder | [Evaluator edition](docs/audiences/evaluator.md) | What did Anthony contribute, and where is the evidence? |

## Project at a glance

| | |
| --- | --- |
| **What it is** | A multi-interface behavioral-commitment prototype with peer proof review, a double-entry ledger, and configurable payment/compliance controls. |
| **Problem addressed** | Ordinary accountability systems often separate the promise, the evidence, and the consequence; Styx explores one auditable workflow connecting all three. |
| **Current state** | `PROTOTYPE`. Local synthetic, test-money flows and deployment automation exist; a usable public product deployment was not verified on 2026-08-31. |
| **Intended users** | The current product wedge is adults using no-contact or breakup-recovery commitments. Fitness/wellness and employer-funded programs are later proposed applications. |
| **Anthony's role** | Product/technical policy and implementation lead, as recorded in the repository's founder decision ledger; that record cites an unsigned founder-agreement draft and does not establish sole authorship or ownership. |
| **Evidence** | Source modules, automated tests, CI and deployment workflows, architecture records, and the claim-to-control matrix. |
| **Known limitations** | No verified public adoption, revenue, behavioral outcome, enterprise-scale performance, or production payment settlement is claimed here. The current public Pages artifact is incomplete. |

## Canonical long-form documentation

The detailed project narrative continues below. Its architectural and product
depth is preserved; the audience editions above change the order and vocabulary,
not the underlying facts.

> **The expensive problem:** Accountability and corporate-wellness programs can
> spend heavily on participation without establishing whether commitments were
> completed. Styx prototypes an enforcement layer that joins payment hold /
> capture / cancel paths, a double-entry ledger, peer-audited proof via the Fury
> Router, loss-aversion modeling (λ = 1.955), and an enterprise tier designed to
> expose aggregate engagement rather than individual health records. The
> corporate-wellness application is proposed; it is not represented here as a
> customer deployment.
>
> [**Discuss a bounded prototype evaluation →**](mailto:padavano.anthony@gmail.com)<br>
> _(If you are a technical recruiter or engineering leader, this repository is
> inspectable proof of a NestJS + Next.js + React Native + Tauri monorepo with a
> double-entry ledger, payment-adapter paths, KYC and geofencing controls, CI
> gates, and extensive automated tests. [Inspect the contribution record →](docs/audiences/evaluator.md))_

![CI](https://github.com/4444J99/peer-audited--behavioral-blockchain/actions/workflows/ci.yml/badge.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue)
![Node](https://img.shields.io/badge/node-24%20LTS-339933)
![License](https://img.shields.io/badge/license-MIT-blue)

---

## Table of Contents

- [Quick Start](#quick-start)
- [Architecture](#architecture)
- [Live Status](#live-status)
- [Key Features](#key-features)
- [Testing](#testing)
- [Commands](#commands)
- [API Documentation](#api-documentation)
- [Environment](#environment)
- [CI Pipeline](#ci-pipeline)
- [Security](#security)

## Quick Start

```bash
## Prerequisites: Node.js 24 LTS, npm 10+, PostgreSQL, Redis

## Configure runtime values for this environment
cp .env.example .env

## Install dependencies across all workspaces
npm install

## Run database migrations
npm run dev:migrate

## Run the local application stack (API + Web)
npm run dev
```

`DATABASE_URL`, `REDIS_URL`, `STYX_API_PUBLIC_URL`, `STYX_WEB_PUBLIC_URL`, and `NEXT_PUBLIC_API_URL` define the runtime endpoints. Docker Compose uses the `STYX_DOCKER_*` variables from the same environment contract.

### One-command deploy

Prefer containers? Bring up the **entire stack** (API + Web + PostgreSQL + Redis) with a single command — no `.env` editing required:

```bash
make deploy        # ≡ bash scripts/deploy.sh local
## → API  http://localhost:3000   (health: /health, docs: /api/docs)
## → Web  http://localhost:3001
make deploy-down   # stop and remove the stack
```

It reads dev defaults from `.config/docker/compose.defaults.env` (a present repo-root `.env` is layered on top and wins). The same script deploys to production — `bash scripts/deploy.sh render`. Full guide: [docs/operations/one-command-deploy.md](docs/operations/one-command-deploy.md).

### Private synthetic demo

For the truth-labeled, test-money-only demo, use `npm run demo:launch`. It
uses Docker Compose when present, with an isolated native PostgreSQL/Redis
fallback for travel machines without Docker. Use `npm run demo:reset` to recreate the named synthetic stack, then
`npm run demo:verify` to prove the API, database, browser, ledger, proof, and
behavioral routes on that exact commit. Open `/tour` for the guided explanation.
This is not a hosted beta, real-money service, or public launch.

## Architecture

Turborepo monorepo with **npm** workspaces. Package scope: `@styx/*`.

| Workspace     | Package         | Stack                                 | Role                                           |
| ------------- | --------------- | ------------------------------------- | ---------------------------------------------- |
| `src/api`     | `@styx/api`     | NestJS 11, BullMQ, Stripe, PostgreSQL | Backend — ledger, escrow, Fury Router, oracles |
| `src/web`     | `@styx/web`     | Next.js 16, React 18, Tailwind        | Dashboard, Fury workbench                      |
| `src/mobile`  | `@styx/mobile`  | React Native 0.81                     | Sensor bridge, camera, biometrics              |
| `src/desktop` | `@styx/desktop` | Tauri 2.0, Vite, React                | "The Judge" admin dashboard                    |
| `src/shared`  | `@styx/shared`  | TypeScript                            | Constants, types, algorithms                   |
| `src/pitch`   | `@styx/pitch`   | Vite, React 18, p5.js                 | Interactive pitch deck                         |

```mermaid
flowchart TB
    subgraph Clients
        WEB["Web (Next.js)"]
        MOB["Mobile (React Native)"]
        DESK["Desktop (Tauri)"]
    end

    subgraph API["API (NestJS)"]
        AUTH[Auth Guard]
        CONTRACTS[Contracts]
        FURY[Fury Router]
        WALLET[Wallet]
        COMPLIANCE[Compliance]
        B2B[B2B / Enterprise]
    end

    subgraph Services["Domain Services"]
        LEDGER["Double-Entry Ledger"]
        ESCROW["Stripe FBO Escrow"]
        HEALTH["Aegis Protocol"]
        HONEYPOT["Honeypot Injection"]
        PHASH["pHash Dedup"]
        ETHICS["Goal Ethics (Gemini)"]
    end

    subgraph Infra
        PG[(PostgreSQL)]
        REDIS[(Redis + BullMQ)]
        R2["Cloudflare R2"]
        STRIPE["Stripe"]
    end

    WEB & MOB & DESK --> AUTH --> CONTRACTS & FURY & WALLET & COMPLIANCE & B2B
    CONTRACTS --> LEDGER & ESCROW & HEALTH
    FURY --> REDIS
    FURY --> HONEYPOT & PHASH
    COMPLIANCE --> ETHICS
    LEDGER --> PG
    ESCROW --> STRIPE
    PHASH --> R2
```

### Tech Stack

- **Runtime**: Node.js 24 LTS
- **Package Manager**: npm (workspaces + Turborepo)
- **Database**: PostgreSQL 15 (double-entry ledger with ACID)
- **Queue**: Redis 7 + BullMQ (Fury Router)
- **Payments**: Stripe (FBO escrow — hold/capture/cancel)
- **Storage**: Cloudflare R2 (zero-egress media hosting)
- **AI**: Gemini 2.5 Flash (goal ethics screening, VC questions, ELI5)
- **Logging**: Pino (structured JSON in production, pretty-print in dev)
- **Security**: Helmet, rate limiting, JWT auth, geofencing
- **CI/CD**: GitHub Actions (test + build + lint + gates + CodeQL + E2E)
- **IaC**: Terraform (Render services, Cloudflare R2, WAF rules)
- **API Docs**: OpenAPI/Swagger at `/api/docs`

## Live Status

Status below is a dated observation, not a deployment promise. It was checked on
**2026-08-31**.

| Surface | URL or location | Observed status |
| --- | --- | --- |
| Source repository | `https://github.com/4444J99/peer-audited--behavioral-blockchain` | Public source and documentation were accessible. |
| Current GitHub Pages root | `https://4444j99.github.io/peer-audited--behavioral-blockchain/` | Returned `200`, but the HTML identified itself as “Ask Styx” and referenced `/ask-styx/` assets that returned `404`; this is **not a usable demo receipt**. |
| Former organization Pages root | `https://a-organvm.github.io/peer-audited--behavioral-blockchain/` | Returned `404`; the older activation ledger is stale on this point. |
| Launch and Ask Styx routes | `/launch`, `/ask-styx` | Returned `404` under the current Pages root. |
| API and full web application | Render blueprints and workflows in the repository | Deployment paths exist in source. No public target was independently verified for this update. |

The historical [activation ledger](docs/activation/activation-ledger--peer-audited--2026-06-11.md)
remains useful as an earlier record, but its live-URL result has been superseded
by the dated [evidence check](docs/evidence/README.md#deployment-observation).

Verify the live surface (re-runnable by any user):

```bash
## Current Pages root
curl -sS -o /dev/null -w "%{http_code} %{url_effective}\n" \
  -L https://4444j99.github.io/peer-audited--behavioral-blockchain/

## Required Ask Styx asset referenced by that HTML shell
curl -sS -o /dev/null -w "%{http_code} %{url_effective}\n" \
  -L https://4444j99.github.io/ask-styx/assets/index-D1Ny8FSA.js

## API health (after deploy)
## curl -sS <api-url>/health

## Web (after deploy)
## curl -sS -o /dev/null -w "%{http_code}\n" <web-url>
```

**Observed on 2026-08-31:** the root returned `200`; the referenced asset returned
`404`. A root-page status alone proves only that an HTML shell responds.

### Deploying

A production deploy requires:

1. **Render secrets** set in GitHub Actions: `RENDER_API_SERVICE_ID`, `RENDER_API_KEY`, `RENDER_WEB_SERVICE_ID`, `API_URL`, `WEB_URL`, `DATABASE_URL`
2. **A `v*` tag** pushed to `main` — triggers [`deploy.yml`](.github/workflows/deploy.yml) which deploys API + Web to Render, runs migrations, and smoke-tests both services.
3. **Render dashboard** manual secrets for `sync: false` vars in `render.yaml` (`STRIPE_SECRET_KEY`, `JWT_SECRET`, `CLOUDFLARE_R2_*`, etc.)

Or trigger the same Render deploy from a laptop without a tag — set `RENDER_API_KEY`, `RENDER_API_SERVICE_ID`, `RENDER_WEB_SERVICE_ID` and run `bash scripts/deploy.sh render`. On each `v*` tag, [`docker-publish.yml`](.github/workflows/docker-publish.yml) also pushes versioned `styx-api` / `styx-web` images to GHCR for self-hosting.

See [`docs/operations/one-command-deploy.md`](docs/operations/one-command-deploy.md) for the fast path and [`docs/activation/activation-ledger--peer-audited--2026-06-11.md`](docs/activation/activation-ledger--peer-audited--2026-06-11.md) for the full activation checklist.

## Key Features

- **Double-Entry Ledger** — Every financial transaction is a balanced debit/credit pair. No phantom money.
- **Fury Peer Review** — Anonymous auditors verify proof submissions via BullMQ queue. Consensus engine aggregates verdicts.
- **Bounty Economy** — Furies earn bounties for correct verdicts and pay penalties for false accusations or honeypot failures.
- **Hash-Chained Audit Log** — SHA-256 linked event log for tamper-evident history.
- **Honeypot Injection** — System injects known-fail proofs to QA reviewer accuracy.
- **Aegis Protocol** — BMI floor (18.5), 2% weekly loss velocity cap, weekend multipliers for predictable vulnerability windows.
- **Geofencing** — Jurisdiction-based tier restrictions by US state (FULL_ACCESS / RESTRICTED / PROHIBITED).
- **Linguistic Cloaker** — Runtime vocabulary swap (stake/vault, bet/commitment) for App Store compliance.
- **Integrity Scoring** — `Base(50) + 5/completion - 15/fraud - 20/strike - 1/inactive_month`. Score determines financial tier access.
- **Goal Ethics Screening** — Gemini 2.5 Flash content policy check on user-submitted goals.
- **Identity Verification** — KYC/age verification via Stripe Identity (production) or mock adapter (dev).

## Testing

At commit `42c853ff514f26533d5308d21b117da85c7a1da2`, the repository
defines **3,382 Jest/Vitest tests across 290 files in 10 test-bearing workspaces**. A
fresh local diagnostic run on 2026-08-31 passed 3,378 and failed 4, so this is
not presented as an all-green release receipt. The former README said `1,107`
while its own four subtotals summed to `1,207`; both figures are obsolete.

| Workspace | Defined tests | Fresh result |
| --- | ---: | ---: |
| API | 2,108 | 2,104 passed; 4 failed |
| Web | 481 | 481 passed |
| Mobile | 324 | 324 passed |
| Desktop | 148 | 148 passed |
| Shared | 215 | 215 passed |
| Ask Styx | 46 | 46 passed |
| Test harness | 4 | 4 passed |
| Audience engine | 21 | 21 passed |
| Audit engine | 31 | 31 passed |
| Styx CLI | 4 | 4 passed |

The run also found root manifest/lockfile drift that prevents a clean `npm ci`.
See the exact commands, compatibility workaround, and failure classification in
the [2026-08-31 verification receipt](docs/evidence/verification--2026-08-31.md).

```bash
make test                                        # All unit/integration tests via Turborepo
cd src/api && npx jest                           # API tests only
cd src/mobile && npx jest                        # Mobile tests only
cd src/web && npx jest                           # Web tests only
cd src/desktop && npx jest                       # Desktop tests only
npx jest --testNamePattern="should reject"       # Single test by name

## E2E (Playwright)
make test-e2e                                    # Headless (chromium + firefox)
make test-e2e-ui                                 # Interactive UI mode
npm run test:e2e:headed                          # Headed browser
```

### Validation Gates

```bash
npx tsx scripts/validation/01-phantom-money-check.ts     # Ledger balance integrity
npx tsx scripts/validation/02-simulator-spoof-check.ts    # Oracle spoof detection
npx tsx scripts/validation/03-the-full-loop.ts            # End-to-end contract lifecycle
bash scripts/validation/04-redacted-build-check.sh        # Production vocabulary sweep
npx tsx scripts/validation/05-behavioral-physics-check.ts  # Algorithm constant validation
node scripts/validation/07-claim-drift-check.js           # Claim drift detection
```

### Beta Readiness

```bash
## Beta profile (default)
BETA_API_URL=https://api-beta.example.com npm run beta:readiness

## Staging profile
READINESS_PROFILE=staging \
STAGING_API_URL=https://api-staging.example.com \
npm run beta:readiness
```

This writes `artifacts/beta-readiness-summary.json` with gate-level `passed`/`failed`/`skipped` statuses.
Full policy and gate ownership live in
[`docs/planning/planning--beta-readiness-contract.md`](docs/planning/planning--beta-readiness-contract.md).

## Commands

| Command                         | Description                                              |
| ------------------------------- | -------------------------------------------------------- |
| `make install`                  | Install all workspace dependencies                       |
| `make dev`                      | Run API + Web with repo-root env resolution              |
| `make dev-turbo`                | Run the full Turbo dev pipeline                          |
| `make build`                    | Build all workspaces                                     |
| `make test`                     | Run all unit/integration tests                           |
| `make test-e2e`                 | Run Playwright E2E tests                                 |
| `npm run dev`                   | Run API + Web with repo-root env resolution              |
| `npm run dev:api`               | Run API with repo-root env resolution                    |
| `npm run dev:web`               | Run Web with repo-root env resolution                    |
| `npm run dev:migrate`           | Run database migrations with repo-root env resolution    |
| `make docker-up`                | Start services through Docker Compose                    |
| `make deploy`                   | One-command deploy: full local stack (zero config)       |
| `make deploy TARGET=render`     | Trigger a production deploy on Render                    |
| `make deploy-down`              | Stop and remove the local stack                          |
| `npx turbo run lint`            | TypeScript strict lint                                   |
| `npm run format`                | Prettier across all workspaces                           |
| `npm run clean`                 | Clean build artifacts + node_modules                     |
| `npm run beta:readiness`        | Run Phase 1 beta readiness contract + emit JSON artifact |
| `cd src/api && npm run migrate` | Run database migrations via the repo-root env resolver   |
| `bash scripts/setup.sh`         | Full bootstrap (docker + install + build + test)         |

## API Documentation

Customer-facing API and usage docs live at [`docs/api/api--spec.md`](docs/api/api--spec.md).
Interactive Swagger/OpenAPI docs are also available at `/api/docs` in
non-production environments when the API is running:

```bash
npm run dev:api
## Open <api-public-url>/api/docs
```

## Environment

Copy `.env.example` to `.env` and set:

| Variable                                | Required                                           | Description                                                             |
| --------------------------------------- | -------------------------------------------------- | ----------------------------------------------------------------------- |
| `STRIPE_SECRET_KEY`                     | Yes                                                | Stripe API secret key                                                   |
| `STRIPE_PUBLISHABLE_KEY`                | Yes                                                | Stripe publishable key                                                  |
| `DATABASE_URL`                          | Yes                                                | PostgreSQL connection string                                            |
| `REDIS_URL`                             | Yes                                                | Redis connection string                                                 |
| `STYX_API_PUBLIC_URL`                   | Yes                                                | Public API base URL for this environment                                |
| `STYX_WEB_PUBLIC_URL`                   | Yes                                                | Public web base URL for this environment                                |
| `NEXT_PUBLIC_API_URL`                   | Yes                                                | Web-visible API base URL                                                |
| `NEXT_PUBLIC_WEB_URL`                   | No                                                 | Web-visible canonical web URL when different from `STYX_WEB_PUBLIC_URL` |
| `CLOUDFLARE_R2_ACCESS_KEY`              | Yes                                                | R2 storage access key                                                   |
| `CLOUDFLARE_R2_SECRET_KEY`              | Yes                                                | R2 storage secret key                                                   |
| `JWT_SECRET`                            | Yes (prod)                                         | JWT signing secret (enforced in production)                             |
| `STYX_API_KEY_PEPPER`                   | Yes                                                | Scrypt pepper for stored user API-key verifiers                         |
| `GEMINI_API_KEY`                        | No                                                 | Gemini AI for goal ethics screening                                     |
| `KYC_ENFORCEMENT_ENABLED`               | No                                                 | Enable KYC gating (default: `false`)                                    |
| `GEOFENCE_FAIL_OPEN_ON_MISSING_HEADERS` | No                                                 | Fail-open when geo headers missing (default: `true`)                    |
| `BETA_API_URL`                          | No (required for full beta readiness verification) | Target API URL for `npm run beta:readiness`                             |
| `BETA_WEB_URL`                          | No                                                 | Optional target web URL for beta readiness                              |
| `BETA_ENV_LABEL`                        | No                                                 | Expected environment label for `/meta/release` (default: `beta`)        |
| `STYX_DEMO_PASSWORD`                    | No (required for authenticated hosted beta checks) | Runtime password for synthetic verification accounts only               |

The API loads env files through `src/api/src/config/env-path.ts` in this order:
repo `.env.local`, repo `.env`, `src/api/.env.local`, then `src/api/.env`.
Set `STYX_API_KEY_PEPPER` in the selected file or deployment secret store before
issuing or verifying API keys. Generate it with `openssl rand -base64 48`; do not
reuse `JWT_SECRET`.

User API keys are issued from an authenticated session:

```bash
curl -X POST "<api-public-url>/auth/api-keys" \
  -H "Authorization: Bearer <jwt>" \
  -H "Content-Type: application/json" \
  -d '{"name":"automation","expiresInDays":90}'
```

The `apiKey` field is returned once. Use it on protected API endpoints with:

```bash
curl "<api-public-url>/users/me" -H "x-api-key: <api-key>"
```

## CI Pipeline

`.github/workflows/ci.yml` runs on every push and PR:

1. **Install + Security Audit** — `npm ci`, `npm audit --audit-level=high`
2. **Tests** — `turbo run test`
3. **Build** — `turbo run build` (all workspaces)
4. **Lint** — `turbo run lint` (strict TypeScript)
5. **Gate 04** — Redacted build check (no gambling terminology in production)
6. **Gate 06** — Security invariant check (no hardcoded secrets)
7. **Gate 07** — Claim drift detection
8. **Hosted Beta Readiness** — the beta-promotion workflow runs `npm run beta:readiness` with required target URLs and uploads `artifacts/beta-readiness-summary.json`; PR CI makes no hosted-beta claim.
9. **Terraform** — `terraform fmt -check`, `terraform validate`
10. **E2E** — Playwright (chromium + firefox matrix)
11. **CodeQL** — JS/TS static analysis

## Security

See [SECURITY.md](.github/SECURITY.md) for vulnerability disclosure policy and security controls.

## License

MIT. See [LICENSE](LICENSE) for details.

<!-- SYSTEM-NAV-START -->

---

<sub>[Portfolio](https://4444j99.github.io/portfolio/) · [System Directory](https://4444j99.github.io/portfolio/directory/) · [ORGAN III · Ergon](https://organvm-iii-ergon.github.io/) · Part of the <a href="https://4444j99.github.io/portfolio/directory/">ORGANVM eight-organ system</a></sub>

<!-- SYSTEM-NAV-END -->
