# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

**Styx** ("The Blockchain of Truth") — a peer-audited behavioral market that uses loss aversion (coefficient 1.955) to enforce habit follow-through via financial stakes. Users stake money into behavioral contracts; a decentralized "Fury" network audits compliance; hardware oracles and a double-entry ledger enforce integrity.

Turborepo monorepo in ORGAN-III (commercial products). Promotion status: **PUBLIC_PROCESS**.

## Build & Dev Commands

All commands run from the repo root. Package manager: **npm** (not yarn/pnpm). Node >= 20.

```bash
# First-time setup (Docker + install + build + test):
bash scripts/setup.sh

# Day-to-day:
make install          # npm install across all workspaces
make dev              # turbo run dev (API + Web + Mobile)
make build            # turbo run build
make test             # turbo run test
make docker-up        # docker-compose up -d (PostgreSQL + Redis)
npx turbo run lint    # strict TypeScript lint (tsc --noEmit per workspace)
npm run format        # prettier across all workspaces
npm run clean         # turbo clean + rm node_modules
```

Individual workspace dev:
```bash
cd src/api && npm run dev          # nest start --watch
cd src/web && npm run dev          # next dev -p 3001
cd src/mobile && npm start         # metro bundler (Expo)
cd src/mobile && npx expo run:ios  # iOS simulator
cd src/desktop && npm run dev      # vite dev
cd src/pitch && npm run dev        # vite dev (interactive pitch deck)
cd src/shared && npm run build     # tsc
cd src/api && npm run migrate      # run database migrations
```

API docs (Swagger/OpenAPI): `http://localhost:3000/api/docs` when API is running.

### Testing

Jest + ts-jest in all workspaces (except pitch, which has no tests). Test files co-located as `*.spec.ts` (API, shared, mobile, desktop) or `*.test.ts`/`*.test.tsx` (web).

```bash
make test                                                    # all workspaces via turbo
cd src/api && npx jest                                       # single workspace
cd src/api && npx jest services/ledger/ledger.service.spec.ts  # single file
cd src/api && npx jest --testNamePattern="should reject"      # single test by name
cd src/api && npx jest --coverage                             # with coverage report
```

**Turbo pipeline**: `"test": { "dependsOn": ["build"] }` — `@styx/shared` must build before other workspaces can test against it.

**API coverage thresholds** (enforced in `src/api/jest.config.cjs`): lines 70%, branches 60%, functions 60%, statements 70%.

### E2E Tests (Playwright)

```bash
make test-e2e                     # headless Playwright (chromium, firefox, webkit, mobile-chrome)
make test-e2e-ui                  # Playwright UI mode
npm run test:e2e:headed           # headed mode
```

Config: `playwright.config.ts`. Tests in `e2e/`. Base URL defaults to `http://localhost:3001`. Web server auto-starts via `webServer` config. E2E suites: auth, auth-guards, contract-lifecycle, dashboard, fury-workbench, recovery-contracts, wallet.

### Validation Gates

`scripts/validation/` — integration-level checks (Gates 04–07 run in CI):
1. `01-phantom-money-check.ts` — ledger prevents unbalanced entries
2. `02-simulator-spoof-check.ts` — hardware oracles reject manual data
3. `03-the-full-loop.ts` — end-to-end contract lifecycle
4. `04-redacted-build-check.sh` — no gambling terminology in production build (see also `scripts/gatekeeper-scan.sh`)
5. `05-behavioral-physics-check.ts` — core constants match spec (requires `CI_GATE05_API_URL` secret for live check)
6. `06-security-invariant-check.ts` — no hardcoded secrets or debug backdoors in production output
7. `07-claim-drift-check.js` — verifies file paths referenced in `docs/planning/implementation-status.md` still exist (`npm run validate:claims`)
8. `08-fury-crucible-simulation.ts` — Fury network simulation
9. `09-realm-sync-check.ts` — dual-source-of-truth check: `REALM_REGISTRY` (TS constant) and `realms` DB table must agree on IDs and stream-prefix mappings
10. `generate-handoff-index.js` — regenerates `docs/handoffs/INDEX.md` from blocked-handoff GH issues; invoked by the `docs: auto-update blocked handoff index` CI commits

### Smoke / Readiness Scripts

`scripts/smoke/` — deployment verification:
- `beta-readiness.sh` — comprehensive beta readiness suite (`npm run beta:readiness`); outputs `artifacts/beta-readiness-summary.json`
- `beta-smoke.sh`, `staging-smoke.sh` — environment-specific smoke runs
- `beta-deploy-preflight.sh` — pre-deploy gate (`npm run beta:deploy-preflight`)
- `check-endpoints.sh`, `check-api-ready.sh`, `check-api-release.sh`, `check-web.sh` — individual endpoint checks
- `vanguard-ignition.sh` — vanguard deployment ignition

### Project-Board & Audit Scripts (top-level `scripts/`)

Automation around the GitHub Projects board (config at `board.config.json` — project ID, field IDs, status/category option IDs):
- `audit-board.sh`, `setup-board.sh`, `sync-tracking-table.sh`, `transition-issue.sh` — board state transitions; audit trail at `docs/audit/transitions.log`
- `gatekeeper-scan.sh` — Stygian-terminology scan (paired with Gate 04)
- `detect-redundancy.{sh,py}` — duplicate-content scanner across docs/plans
- `build-chat-context.ts` — bundles repo state into a context payload for external agents

## Architecture

### Workspaces

| Workspace | Package | Stack | Role |
|-----------|---------|-------|------|
| `src/api` | `@styx/api` | NestJS 11, BullMQ, Stripe, pg, pino | Backend — ledger, escrow, Fury Router, oracles |
| `src/web` | `@styx/web` | Next.js 16, React 18, Tailwind, Zustand | Dashboard, Fury workbench |
| `src/mobile` | `@styx/mobile` | Expo 54, React Native 0.81, React Navigation 7 | Sensor bridge, camera, biometrics |
| `src/shared` | `@styx/shared` | TypeScript (pure) | Constants, types, algorithms |
| `src/desktop` | `@styx/desktop` | Tauri 2.0 beta, Vite, React | "The Judge" admin dashboard |
| `src/pitch` | `@styx/pitch` | Vite, React 18, p5.js, Tailwind | Interactive pitch deck (builds to `docs/` for GitHub Pages). No test/lint scripts. |
| `src/ask-styx` | `@styx/ask-styx` | Vite 6, React 18, Tailwind, Cloudflare Workers, Vitest | "Ask Styx" conversational front-end deployed as a Worker; tests via `vitest run` (not Jest) |
| `src/test-harness` | `@styx/test-harness` | TypeScript, Vitest, Playwright, zod, commander | ORGAN-III quality gate. Exposes the `ergon-test` CLI (`bin/ergon-test`). Audit suites: contract validator, aesthetic auditor (headless Playwright), seed.yaml/edge contracts |

Workspace globs (root `package.json`): `src/*` and `packages/*` (the `packages/` directory is currently empty but reserved).

Path alias: `@styx/shared/*` → `./src/shared/*` (root `tsconfig.json`).

**Test-runner heterogeneity**: most workspaces use Jest, but `ask-styx` and `test-harness` use **Vitest**. When invoking a single workspace's tests directly, use that workspace's `npm test` rather than assuming `npx jest`.

### API: Dual-Layer Structure

The API has **two parallel directory trees** — this is the most important structural detail:

- **`src/api/services/`** — Domain services (pure business logic, no HTTP). Each is an `@Injectable()` class with constructor-injected `Pool` or queue. These are the core building blocks.
- **`src/api/src/modules/`** — NestJS modules (controllers, route handlers, DI wiring). Each module imports domain services and exposes HTTP endpoints.

```
src/api/
├── services/                    # Domain layer (business logic)
│   ├── ledger/                  #   Double-entry transactions, hash-chained audit log
│   ├── fury-router/             #   BullMQ proof routing, consensus engine
│   ├── escrow/                  #   Stripe FBO hold/capture/cancel, disputes
│   ├── health/                  #   Aegis protocol (BMI floor, velocity caps) + Recovery Protocol (no-contact guardrails)
│   ├── intelligence/            #   Honeypot injection, Gemini AI client
│   ├── security/                #   Geofencing, moderation (bans)
│   ├── anomaly/                 #   pHash duplicate detection, EXIF validation
│   ├── b2b/                     #   Enterprise B2B analytics
│   ├── storage/                 #   R2 service
│   ├── realtime/                #   SSE/WebSocket helpers
│   ├── billing.ts               #   Pricing constants
│   └── geofencing.ts            #   Jurisdiction tier enum + state map
├── src/modules/                 # NestJS application layer (HTTP + DI)
│   ├── auth/                    #   Login, register, JWT, enterprise SSO
│   ├── contracts/               #   CRUD, proof submission, grace days, scheduler
│   ├── compliance/              #   KYC/AML, eligibility checks
│   ├── fury/                    #   Queue, verdicts, bounty economy, stats
│   ├── wallet/                  #   Balance, transaction history
│   ├── b2b/                     #   Enterprise metrics, billing, webhooks, anonymization, data lake
│   ├── ai/                      #   Grill-me, ELI5, goal ethics screening
│   ├── admin/                   #   Moderation, honeypot management
│   ├── users/                   #   Profile, settings, scheduler
│   ├── notifications/           #   SSE stream, unread count, mark-read
│   ├── payments/                #   Stripe webhook handler
│   ├── proofs/                  #   Proof submission and verification
│   ├── oracles/                 #   Hardware oracle integration
│   ├── ledger/                  #   Ledger HTTP endpoints
│   ├── feed/                    #   Activity feed
│   ├── beta/                    #   Beta feature gates
│   └── health/                  #   Health check endpoint
├── guards/auth.guard.ts         # JWT auth guard
├── config/queue.config.ts       # Redis/BullMQ connection
└── database/schema.sql          # PostgreSQL schema (init script for docker)
```

### Core Algorithms (`src/shared/libs/`)

**Integrity Score** (`integrity.ts`): `Base(50) + 5*completions - 15*frauds - 20*strikes - 1*inactive_months`. Floor at 0. Tier thresholds:
- `RESTRICTED_MODE` (score < 20): max stake $0
- `TIER_1_MICRO_STAKES` (< 50): max $20
- `TIER_2_STANDARD` (< 100): max $100
- `TIER_3_HIGH_ROLLER` (< 500): max $1,000
- `TIER_4_WHALE_VAULTS` (>= 500): unlimited

**Fury Accuracy** (`integrity.ts`): `(successful - false_accusations*3) / total`. Demotion at < 0.8 after 10-audit burn-in. Auditor stake: $2.00 per audit.

**Behavioral Logic** (`behavioral-logic.ts`): 7 oath categories (Biological, Cognitive, Professional, Creative, Environmental, Character, Recovery). Constants: grace days 2/month, onboarding bonus $5, loss aversion λ=1.955, downscale after 3 strikes, 7-day cool-off, BMI floor 18.5, 2% weekly loss velocity cap, recovery max 30 days, max 3 no-contact targets, 3 missed attestations = auto-fail.

**Money** (`money.ts`): Currency/amount utilities shared across workspaces.

### Web Routes

Next.js App Router: `/`, `/dashboard`, `/fury`, `/wallet`, `/pitch`, `/hr`, `/tavern`, `/admin`, `/settings`, `/profile`, `/login`, `/register`, `/contracts/new`, `/contracts/[id]`, `/legal`, `/whistleblower`.

**Linguistic Cloaker** (`src/web/utils/linguistic-cloak.ts`): Runtime vocabulary swap (stake→vault, bet→commitment, fury→peer review) for App Store/Stripe compliance.

### Mobile

Expo-managed React Native app. `src/mobile/screens/`: Dashboard, Login, Register, CreateContract, ContractList, ContractDetail, Fury, Wallet, Settings, Profile, Camera (placeholder — native Swift/Kotlin required).

`src/mobile/services/`: ApiClient (all endpoints), SessionService (AsyncStorage JWT), OfflineCache (TTL caching + mutation queue), UploadService (R2), NotificationService, EnterpriseSSO (deep links).

### Desktop Panels

`src/desktop/src/panels/`: LedgerInspector, MacroReview, ExilePanel, B2BOrchestration, LoginScreen.

### Infrastructure

- **Database**: PostgreSQL 15-alpine, double-entry ledger schema (`src/api/database/schema.sql`, seed: `src/api/database/seed.sql`)
- **Queue**: Redis 7-alpine + BullMQ (`FURY_ROUTER_QUEUE`)
- **Storage**: Cloudflare R2 (zero-egress, signed URLs only)
- **Payments**: Stripe FBO escrow (hold/capture/cancel)
- **AI (API services)**: Gemini 2.5 Flash (`gemini-2.5-flash-preview-09-2025`) for grill-me/ELI5
- **AI (Chat)**: Groq free tier + Llama 3.3 70B via OpenAI-compatible SDK (`src/web/app/api/chat/route.ts`). Configurable via `GROQ_API_KEY`, `LLM_BASE_URL`, `LLM_MODEL` env vars — works with any OpenAI-compatible endpoint (Groq, Together, Ollama, etc.)
- **CI**: GitHub Actions (`ci.yml`) — Node 20, security audit, turbo test + build + lint, Gates 04–07, beta readiness, Terraform validate, Playwright E2E (chromium + firefox), CodeQL
- **CD**: GitHub Actions (`deploy.yml`) — tag-triggered deploy to Render with smoke test. Also: `beta-promotion.yml`, `staging-promotion.yml`
- **IaC**: Terraform (`infra/terraform/`) — Render services, Cloudflare R2, WAF rules. Also `scripts/infra/` for R2 lifecycle, WAF rules, pg data lake extract
- **Render Blueprint**: `render.yaml` — API + Web + PostgreSQL + Redis (Oregon region, starter plan)
- **Docker**: `docker-compose.yml` (4 services: styx-api, styx-postgres, styx-redis, styx-web) and root `Dockerfile` (API-only image)

### Key Design Constraints

- **Zero Trust**: All biometric/financial validation is server-side.
- **No Egress**: Media files never leave R2; serve only via signed URLs.
- **Stygian Terminology**: Fury=auditor, Vault=escrow, Oath=contract. Swap to neutral terms in app store builds via linguistic cloaker + gatekeeper scan.
- **Native bridges**: HealthKit/Google Fit must be native Swift/Kotlin — placeholder stubs in place, not yet implemented.

## Conventions

- **Commits**: Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:`)
- **Branching**: `feat/fury-bounty-ui`, `fix/ledger-race`
- **Files**: kebab-case; double-hyphen separates function from descriptor (`research--behavioral-economics.md`)
- **TypeScript**: strict mode, named exports, async/await
- **NestJS testing pattern**: `@Injectable()` classes with constructor DI; mock `Pool` or service via `as any` cast in tests (see any `*.spec.ts` in `src/api/src/modules/`)

## Companion Governance Files (root)

These files at the repo root carry constraints that tooling reads but are easy to miss:

- **`AGENTS.md`** — Auto-generated org-context block (`<!-- ORGANVM:AUTO:START/END -->`) describing this repo's event subscriptions, production responsibilities, and external organ dependencies. Treated as a contract by the ORGANVM swarm; do not hand-edit between the auto markers.
- **`GEMINI.md`** — Parallel context file consumed by Gemini-based agents during dispatch. Kept in sync via `docs: context sync refresh` commits.
- **`board.config.json`** — GitHub Projects (V2) board IDs, field IDs, and option IDs used by the board-automation scripts. Editing requires re-resolving IDs via the GH GraphQL API; do not handcraft.
- **`seed.yaml`** — Organ membership, edges, governance constraints (consumed by `organvm` CLI and the auto-generated section at the bottom of this file).
- **`ecosystem.yaml`**, **`network-map.yaml`** — Ecosystem inventory and external-mirror map used by `organvm ecosystem show` and `organvm network map`.

## Environment

Copy `.env.example` → `.env`. Required vars: `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `DATABASE_URL`, `REDIS_URL`, `CLOUDFLARE_R2_ACCESS_KEY`, `CLOUDFLARE_R2_SECRET_KEY`, `JWT_SECRET`. Optional: `GEMINI_API_KEY`, `ANONYMIZE_SALT`, `SENTRY_DSN`, Salesforce/HubSpot keys.

Docker services: PostgreSQL `5432`, Redis `6379`, API `3000`, Web `3001`.

### Beta / Feature Flags

The `.env` includes a beta configuration system (all `STYX_*` and `NEXT_PUBLIC_STYX_*` prefixed):
- `STYX_PRIVATE_BETA` / `STYX_TEST_MONEY_MODE` — private beta mode with test money
- `STYX_ALLOWLIST_US_ONLY` — geofence to US only
- `STYX_PHASE1_MOBILE_PRIMARY` / `STYX_PHASE1_NO_CONTACT_ONLY` — Phase 1 scope limits
- `STYX_FEATURE_B2B_HR_UI` — enterprise HR dashboard toggle
- `KYC_ENFORCEMENT_ENABLED` / `STYX_IDENTITY_PROVIDER` — compliance toggles (mock provider in dev)

## Remaining Limitations

- **CameraModule**: Mobile camera requires native Swift/Kotlin — placeholder UI with text proof submission.
- **HealthKit/Google Fit**: Architectural stubs in `src/mobile/services/` but actual native bridges not implemented (requires Xcode/Android Studio).
- **High-risk merchant underwriting**: Business/legal process (Corepay/Allied Wallet application), not code.

<!-- ORGANVM:AUTO:START -->
## System Context (auto-generated — do not edit)

**Organ:** ORGAN-III (Commerce) | **Tier:** flagship | **Status:** GRADUATED
**Org:** `organvm-iii-ergon` | **Repo:** `peer-audited--behavioral-blockchain`

### Edges
- **Produces** → `unspecified`: product
- **Produces** → `organvm-vi-koinonia/community-hub`: community_signal
- **Produces** → `organvm-vii-kerygma/kerygma-pipeline`: distribution_signal
- **Produces** → `organvm-v-logos/essay-pipeline`: essay_material
- **Consumes** ← `organvm-i-theoria/styx-behavioral-economics-theory`: theory
- **Consumes** ← `organvm-ii-poiesis/styx-behavioral-art`: creative-artifact
- **Consumes** ← `organvm-iv-taxis/orchestration-start-here`: governance-rules

### Siblings in Commerce
`classroom-rpg-aetheria`, `gamified-coach-interface`, `trade-perpetual-future`, `fetch-familiar-friends`, `sovereign-ecosystem--real-estate-luxury`, `public-record-data-scrapper`, `search-local--happy-hour`, `multi-camera--livestream--framework`, `universal-mail--automation`, `mirror-mirror`, `the-invisible-ledger`, `enterprise-plugin`, `virgil-training-overlay`, `tab-bookmark-manager`, `a-i-chat--exporter` ... and 16 more

### Governance
- Strictly unidirectional flow: I→II→III. No dependencies on Theory (I).

*Last synced: 2026-05-16T19:47:45Z*

## Active Handoff Protocol

If `.conductor/active-handoff.md` exists, **READ IT FIRST** before doing any work.
It contains constraints, locked files, conventions, and completed work from the
originating agent. You MUST honor all constraints listed there.

If the handoff says "CROSS-VERIFICATION REQUIRED", your self-assessment will
NOT be trusted. A different agent will verify your output against these constraints.

## Session Review Protocol

At the end of each session that produces or modifies files:
1. Run `organvm session review --latest` to get a session summary
2. Check for unimplemented plans: `organvm session plans --project .`
3. Export significant sessions: `organvm session export <id> --slug <slug>`
4. Run `organvm prompts distill --dry-run` to detect uncovered operational patterns

Transcripts are on-demand (never committed):
- `organvm session transcript <id>` — conversation summary
- `organvm session transcript <id> --unabridged` — full audit trail
- `organvm session prompts <id>` — human prompts only


## System Library

Plans: 269 indexed | Chains: 5 available | SOPs: 8 active
Discover: `organvm plans search <query>` | `organvm chains list` | `organvm sop lifecycle`
Library: `/Users/4jp/Code/organvm/praxis-perpetua/library`


**Prompting (Anthropic)**: context 200K tokens, format: XML tags, thinking: extended thinking (budget_tokens)


## Atomization Pipeline

Run `organvm atoms pipeline --write && organvm atoms fanout --write` to generate task queue.


## System Density (auto-generated)

AMMOI: 25% | Edges: 0 | Tensions: 0 | Clusters: 0 | Adv: 27 | Events(24h): 37356
Structure: 8 organs / 148 repos / 1654 components (depth 17) | Inference: 0% | Organs: META-ORGANVM:63%, ORGAN-I:53%, ORGAN-II:48%, ORGAN-III:54% +5 more
Last pulse: 2026-05-16T19:47:45 | Δ24h: n/a | Δ7d: n/a


## Dialect Identity (Trivium)

**Dialect:** EXECUTABLE_ALGORITHM | **Classical Parallel:** Arithmetic | **Translation Role:** The Engineering — proves that proofs compute

Strongest translations: I (formal), II (structural), VII (structural)

Scan: `organvm trivium scan III <OTHER>` | Matrix: `organvm trivium matrix` | Synthesize: `organvm trivium synthesize`


## Logos Documentation Layer

**Status:** MISSING | **Symmetry:** 0.5 (GHOST)

Nature demands a documentation counterpart. This formation maintains its narrative record in `docs/logos/`.

### The Tetradic Counterpart
- **[Telos (Idealized Form)](../docs/logos/telos.md)** — The dream and theoretical grounding.
- **[Pragma (Concrete State)](../docs/logos/pragma.md)** — The honest account of what exists.
- **[Praxis (Remediation Plan)](../docs/logos/praxis.md)** — The attack vectors for evolution.
- **[Receptio (Reception)](../docs/logos/receptio.md)** — The account of the constructed polis.

### Alchemical I/O
- **[Source & Transmutation](../docs/logos/alchemical-io.md)** — Narrative of inputs, process, and returns.

- **[Public Essay](https://organvm-v-logos.github.io/public-process/)** — System-wide narrative entry.

*Compliance: Implementation exists without record.*

<!-- ORGANVM:AUTO:END -->
