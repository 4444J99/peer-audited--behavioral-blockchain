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

### Smoke / Readiness Scripts

`scripts/smoke/` — deployment verification:
- `beta-readiness.sh` — comprehensive beta readiness suite (`npm run beta:readiness`); outputs `artifacts/beta-readiness-summary.json`
- `check-endpoints.sh`, `check-api-ready.sh`, `check-api-release.sh`, `check-web.sh` — individual endpoint checks
- `vanguard-ignition.sh` — vanguard deployment ignition

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

Path alias: `@styx/shared/*` → `./src/shared/*` (root `tsconfig.json`).

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

**Organ:** ORGAN-III (Commerce) | **Tier:** flagship | **Status:** PUBLIC_PROCESS
**Org:** `organvm-iii-ergon` | **Repo:** `peer-audited--behavioral-blockchain`

### Edges
- **Produces** → `unspecified`: product
- **Produces** → `organvm-vi-koinonia/community-hub`: community_signal
- **Produces** → `organvm-vii-kerygma/social-automation`: distribution_signal
- **Consumes** ← `ORGAN-IV`: governance-rules

### Siblings in Commerce
`classroom-rpg-aetheria`, `gamified-coach-interface`, `trade-perpetual-future`, `fetch-familiar-friends`, `sovereign-ecosystem--real-estate-luxury`, `public-record-data-scrapper`, `search-local--happy-hour`, `multi-camera--livestream--framework`, `universal-mail--automation`, `mirror-mirror`, `the-invisible-ledger`, `enterprise-plugin`, `virgil-training-overlay`, `tab-bookmark-manager`, `a-i-chat--exporter` ... and 12 more

### Governance
- Strictly unidirectional flow: I→II→III. No dependencies on Theory (I).

*Last synced: 2026-03-08T20:11:34Z*

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


## Active Directives

| Scope | Phase | Name | Description |
|-------|-------|------|-------------|
| system | any | prompting-standards | Prompting Standards |
| system | any | research-standards-bibliography | APPENDIX: Research Standards Bibliography |
| system | any | research-standards | METADOC: Architectural Typology & Research Standards |
| system | any | sop-ecosystem | METADOC: SOP Ecosystem — Taxonomy, Inventory & Coverage |
| system | any | autopoietic-systems-diagnostics | SOP: Autopoietic Systems Diagnostics (The Mirror of Eternity) |
| system | any | cicd-resilience-and-recovery | SOP: CI/CD Pipeline Resilience & Recovery |
| system | any | cross-agent-handoff | SOP: Cross-Agent Session Handoff |
| system | any | document-audit-feature-extraction | SOP: Document Audit & Feature Extraction |
| system | any | essay-publishing-and-distribution | SOP: Essay Publishing & Distribution |
| system | any | market-gap-analysis | SOP: Full-Breath Market-Gap Analysis & Defensive Parrying |
| system | any | pitch-deck-rollout | SOP: Pitch Deck Generation & Rollout |
| system | any | promotion-and-state-transitions | SOP: Promotion & State Transitions |
| system | any | repo-onboarding-and-habitat-creation | SOP: Repo Onboarding & Habitat Creation |
| system | any | research-to-implementation-pipeline | SOP: Research-to-Implementation Pipeline (The Gold Path) |
| system | any | security-and-accessibility-audit | SOP: Security & Accessibility Audit |
| system | any | session-self-critique | session-self-critique |
| system | any | source-evaluation-and-bibliography | SOP: Source Evaluation & Annotated Bibliography (The Refinery) |
| system | any | stranger-test-protocol | SOP: Stranger Test Protocol |
| system | any | strategic-foresight-and-futures | SOP: Strategic Foresight & Futures (The Telescope) |
| system | any | typological-hermeneutic-analysis | SOP: Typological & Hermeneutic Analysis (The Archaeology) |
| unknown | any | gpt-to-os | SOP_GPT_TO_OS.md |
| unknown | any | index | SOP_INDEX.md |
| unknown | any | obsidian-sync | SOP_OBSIDIAN_SYNC.md |

Linked skills: evaluation-to-growth


**Prompting (Anthropic)**: context 200K tokens, format: XML tags, thinking: extended thinking (budget_tokens)


## Task Queue (from pipeline)

**242** pending tasks | Last pipeline: unknown

- `7c5780b94db0` docs/research/research--behavioral-physics-manifesto.md — HVCS model → §2.3, §5.3 [playwright, postgresql, typescript]
- `cc9fec9ebcba` src/api/services/ledger/truth-log.service.ts — Theorem 2 (hash chain) [playwright, postgresql, typescript]
- `b2e58d4a4055` src/api/services/intelligence/honeypot.service.ts — Theorem 7 (honeypot convergence) [playwright, postgresql, typescript]
- `3a657dbcc3d2` src/api/services/health/recovery-protocol.service.ts — Theorem 8 (anti-isolation) [playwright, postgresql, typescript]
- `9122ae50f1b3` docs/legal/legal--performance-wagering.md — §2.8, §5.5 (legal classification) [playwright, postgresql, typescript]
- `550225719750` docs/research/research--breakup-psychology-loss-aversion.md — §5.4 (90-day recovery timeline) [playwright, postgresql, typescript]
- `a2f77f7eaa40` Plan: Tame the Styx GitHub Project — from chaotic sprawl to operational board [graphql]
- `941f9d6e576a` organvm-corpvs-testamentvm/registry-v2.json — Add Styx entry, bump counts [terraform]
- ... and 234 more

Cross-organ links: 115 | Top tags: `bash`, `typescript`, `react`, `terraform`, `mcp`

Run: `organvm atoms pipeline --write && organvm atoms fanout --write`

<!-- ORGANVM:AUTO:END -->
