# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

**Styx** ("The Blockchain of Truth") — a peer-audited behavioral market that uses loss aversion (coefficient 1.955) to enforce habit follow-through via financial stakes. Users stake money into behavioral contracts; a decentralized "Fury" network audits compliance; hardware oracles and a double-entry ledger enforce integrity.

Turborepo monorepo in ORGAN-III (commercial products). Promotion status: **PUBLIC_PROCESS**. 425 tests across 5 workspaces.

## Build & Dev Commands

All commands run from the repo root. Package manager: **npm** (not yarn/pnpm).

```bash
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
cd src/web && npm run dev          # next dev
cd src/mobile && npm start         # metro bundler
cd src/desktop && npm run dev      # vite dev
cd src/shared && npm run build     # tsc
```

### Testing

Jest + ts-jest in all workspaces. Test files co-located as `*.spec.ts` (or `*.test.ts` in web).

```bash
make test                                                    # all workspaces via turbo
cd src/api && npx jest                                       # single workspace
cd src/api && npx jest services/ledger/ledger.service.spec.ts  # single file
cd src/api && npx jest --testNamePattern="should reject"      # single test by name
```

Note: turbo config has `"test": { "dependsOn": ["build"] }` — tests run after build in the pipeline.

### Validation Gates

`scripts/validation/` — integration-level checks, run manually (Gates 04+05 also run in CI):
1. `01-phantom-money-check.ts` — ledger prevents unbalanced entries
2. `02-simulator-spoof-check.ts` — hardware oracles reject manual data
3. `03-the-full-loop.ts` — end-to-end contract lifecycle
4. `04-redacted-build-check.sh` — no gambling terminology in production build
5. `05-behavioral-physics-check.ts` — core constants match spec

## Architecture

### Workspaces

| Workspace | Package | Stack | Role |
|-----------|---------|-------|------|
| `src/api` | `@styx/api` | NestJS 10, BullMQ, Stripe, pg | Backend — ledger, escrow, Fury Router, oracles |
| `src/web` | `@styx/web` | Next.js 16, React 18, Tailwind, p5.js | Dashboard, Fury workbench, pitch deck |
| `src/mobile` | `@styx/mobile` | React Native 0.76 | Sensor bridge, camera, biometrics |
| `src/shared` | `@styx/shared` | TypeScript | Constants, types, algorithms |
| `src/desktop` | `@styx/desktop` | Tauri 2.0 beta, Vite, React | "The Judge" admin dashboard |

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
│   ├── health/                  #   Aegis protocol (BMI floor, velocity caps)
│   ├── intelligence/            #   Honeypot injection, Gemini AI client
│   ├── security/                #   Geofencing, moderation (bans)
│   ├── anomaly/                 #   pHash duplicate detection, EXIF validation
│   ├── storage/                 #   R2 service
│   ├── realtime/                #   SSE/WebSocket helpers
│   ├── billing.ts               #   Pricing constants
│   └── geofencing.ts            #   Jurisdiction tier enum + state map
├── src/modules/                 # NestJS application layer (HTTP + DI)
│   ├── auth/                    #   Login, register, JWT, enterprise SSO
│   ├── contracts/               #   CRUD, proof submission, grace days, scheduler
│   ├── fury/                    #   Queue, verdicts, bounty economy, stats
│   ├── wallet/                  #   Balance, transaction history
│   ├── b2b/                     #   Enterprise metrics, billing, webhooks, anonymization, data lake
│   ├── ai/                      #   Grill-me, ELI5, goal ethics screening
│   ├── admin/                   #   Moderation, honeypot management
│   ├── users/                   #   Profile, settings, scheduler
│   ├── notifications/           #   SSE stream, unread count, mark-read
│   ├── payments/                #   Stripe webhook handler
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

**Behavioral Logic** (`behavioral-logic.ts`): 6 oath categories (Biological, Cognitive, Professional, Creative, Environmental, Character). Constants: grace days 2/month, onboarding bonus $5, loss aversion λ=1.955, downscale after 3 strikes, 7-day cool-off, BMI floor 18.5, 2% weekly loss velocity cap.

### Web Routes

Next.js App Router: `/`, `/dashboard`, `/fury`, `/wallet`, `/pitch`, `/hr`, `/tavern`, `/admin`, `/settings`, `/profile`, `/login`, `/register`, `/contracts/new`, `/contracts/[id]`.

**Linguistic Cloaker** (`src/web/utils/linguistic-cloak.ts`): Runtime vocabulary swap (stake→vault, bet→commitment, fury→peer review) for App Store/Stripe compliance.

### Mobile Screens

`src/mobile/screens/`: Dashboard, Login, Register, CreateContract, ContractList, ContractDetail, Fury, Wallet, Settings, Profile, Camera (placeholder — native Swift/Kotlin required).

`src/mobile/services/`: ApiClient (all endpoints), SessionService (AsyncStorage JWT), OfflineCache (TTL caching + mutation queue), UploadService (R2), NotificationService, EnterpriseSSO (deep links).

### Desktop Panels

`src/desktop/src/panels/`: LedgerInspector, MacroReview, ExilePanel, B2BOrchestration, LoginScreen.

### Infrastructure

- **Database**: PostgreSQL 15-alpine, double-entry ledger schema (`src/api/database/schema.sql`)
- **Queue**: Redis 7-alpine + BullMQ (`FURY_ROUTER_QUEUE`)
- **Storage**: Cloudflare R2 (zero-egress, signed URLs only)
- **Payments**: Stripe FBO escrow (hold/capture/cancel)
- **AI**: Gemini 2.5 Flash (`gemini-2.5-flash-preview-09-2025`)
- **CI**: GitHub Actions — Node 20, turbo test + build + lint, Gate 04 + Gate 05
- **CD**: GitHub Actions (`deploy.yml`) — tag-triggered deploy to Render with smoke test
- **IaC**: Terraform (`infra/terraform/`) — Render services, Cloudflare R2, WAF rules

### Key Design Constraints

- **Zero Trust**: All biometric/financial validation is server-side.
- **No Egress**: Media files never leave R2; serve only via signed URLs.
- **Stygian Terminology**: Fury=auditor, Vault=escrow, Oath=contract. Swap to neutral terms in app store builds via linguistic cloaker.
- **Native bridges**: HealthKit/Google Fit must be native Swift/Kotlin — placeholder stubs in place, not yet implemented.

## Conventions

- **Commits**: Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:`)
- **Branching**: `feat/fury-bounty-ui`, `fix/ledger-race`
- **Files**: kebab-case; double-hyphen separates function from descriptor (`research--behavioral-economics.md`)
- **TypeScript**: strict mode, named exports, async/await
- **NestJS testing pattern**: `@Injectable()` classes with constructor DI; mock `Pool` or service via `as any` cast in tests (see any `*.spec.ts` in `src/api/src/modules/`)

## Environment

Copy `.env.example` → `.env`. Required vars: `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `DATABASE_URL`, `REDIS_URL`, `CLOUDFLARE_R2_ACCESS_KEY`, `CLOUDFLARE_R2_SECRET_KEY`, `JWT_SECRET`. Optional: `GEMINI_API_KEY`, `ANONYMIZE_SALT`, Salesforce/HubSpot keys.

Docker services: PostgreSQL `5432`, Redis `6379`, API `3000`, Web `3001`.

## Remaining Limitations

- **CameraModule**: Mobile camera requires native Swift/Kotlin — placeholder UI with text proof submission.
- **HealthKit/Google Fit**: Architectural stubs in `src/mobile/services/` but actual native bridges not implemented (requires Xcode/Android Studio).
- **High-risk merchant underwriting**: Business/legal process (Corepay/Allied Wallet application), not code.
