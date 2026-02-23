# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

**Styx** ("The Blockchain of Truth") — a peer-audited behavioral market that weaponizes loss aversion (coefficient 1.955) to enforce habit follow-through via financial stakes. Users stake money into behavioral contracts; a decentralized "Fury" network audits compliance; hardware oracles and a double-entry ledger enforce integrity.

This is a **pre-production** monorepo in ORGAN-III (commercial products). Core service logic is fully implemented with 290+ tests across all workspaces.

## Build & Dev Commands

All commands run from the repo root. The project uses **npm** (not yarn) as its package manager.

```bash
make install          # npm install across all workspaces
make dev              # turbo run dev (API + Web + Mobile)
make build            # turbo run build
make test             # turbo run test
make docker-up        # docker-compose up -d (PostgreSQL + Redis)
npx turbo run lint    # strict TypeScript lint
npm run format        # prettier across all workspaces
npm run clean         # turbo clean + rm node_modules
```

Individual workspace commands:
```bash
# API (NestJS)
cd src/api && npm run dev          # nest start --watch

# Web (Next.js)
cd src/web && npm run dev          # next dev

# Mobile (React Native)
cd src/mobile && npm start         # metro bundler
cd src/mobile && npm run ios       # react-native run-ios
cd src/mobile && npm run android   # react-native run-android

# Desktop (Tauri + Vite)
cd src/desktop && npm run dev      # vite dev
cd src/desktop && npm run tauri    # tauri CLI

# Shared (build types)
cd src/shared && npm run build     # tsc
```

### Testing

Tests use **Jest + ts-jest** in all workspaces (API, Shared, Mobile, Desktop, Web). Test files are co-located as `*.spec.ts` (or `*.test.ts` in web) next to their source files.

```bash
# All tests via turbo
make test

# Single workspace
cd src/api && npx jest

# Single test file
cd src/api && npx jest services/ledger/ledger.service.spec.ts

# Single test by name
cd src/api && npx jest --testNamePattern="should reject non-positive"
```

Existing spec files:
- `src/shared/libs/integrity.spec.ts` — core algorithm tests (integrity score, tiers, accuracy, demotion, stake limits)
- `src/api/services/ledger/ledger.service.spec.ts` — double-entry transaction tests
- `src/api/services/ledger/truth-log.service.spec.ts` — hash-chain audit log tests
- `src/api/services/fury-router/fury-router.service.spec.ts` — BullMQ routing tests
- `src/api/services/escrow/dispute.service.spec.ts` — appeal fee tests
- `src/api/services/health/aegis.service.spec.ts` — BMI/velocity guardrail tests
- `src/api/services/security/geofence.service.spec.ts` — jurisdiction tier tests
- `src/api/services/security/moderation.service.spec.ts` — ban/exile tests
- `src/api/services/intelligence/honeypot.service.spec.ts` — known-fail injection tests
- `src/api/src/modules/fury/fury.bounty.spec.ts` — Fury bounty ledger transaction tests
- `src/api/src/modules/fury/fury.stats.spec.ts` — Fury stats endpoint tests
- `src/api/src/modules/ai/ai.controller.spec.ts` — AI controller tests (grill-me, eli5)
- `src/mobile/services/ApiClient.spec.ts` — mobile API client tests (request plumbing, all endpoints)
- `src/mobile/services/SessionService.spec.ts` — AsyncStorage session persistence tests
- `src/mobile/services/EnterpriseSSO.spec.ts` — deep link SSO flow tests
- `src/mobile/services/UploadService.spec.ts` — R2 upload mock tests
- `src/mobile/services/NotificationService.spec.ts` — notification fetch + unread count tests
- `src/desktop/src/services/api.spec.ts` — desktop admin API client tests (auth, ban, honeypot, B2B keys)
- `src/web/services/api-client.test.ts` — web API client tests (auth, contracts, fury, settings, AI)
- `src/api/src/modules/b2b/anonymize.service.spec.ts` — PII anonymization tests (hashing, stripping, coarsening, export)
- `src/api/src/modules/b2b/datalake.service.spec.ts` — data lake extraction tests (snapshots, replication slots)
- `src/mobile/services/OfflineCache.spec.ts` — offline caching + mutation queue tests

### Validation Scripts

`scripts/validation/` contains integration-level verification gates (run manually, not part of `make test`):
- `01-phantom-money-check.ts` — asserts ledger prevents unbalanced entries
- `02-simulator-spoof-check.ts` — hardware oracles reject manual data
- `03-the-full-loop.ts` — end-to-end contract lifecycle
- `04-redacted-build-check.sh` — verifies no gambling terminology in production build

## Architecture

Turborepo monorepo with npm workspaces. Package scope: `@styx/*`.

### Workspace Map

| Workspace | Package | Stack | Role |
|-----------|---------|-------|------|
| `src/api` | `@styx/api` | NestJS 10, BullMQ, Stripe, pg | Backend — ledger, escrow, Fury Router, oracles |
| `src/web` | `@styx/web` | Next.js 16, React 18, Tailwind, p5.js | Dashboard, Fury audit workbench, interactive pitch deck |
| `src/mobile` | `@styx/mobile` | React Native 0.73 | Sensor bridge (HealthKit/Google Fit), camera, biometrics |
| `src/shared` | `@styx/shared` | TypeScript | Constants, types, algorithms (integrity score, behavioral logic) |
| `src/desktop` | `@styx/desktop` | Tauri 2.0 beta, Vite, React | "The Judge" admin dashboard (LedgerInspector, ExilePanel, MacroReview, B2B) |

Path alias: `@styx/shared/*` → `./src/shared/*` (configured in root `tsconfig.json`).

### API Service Structure

`src/api/services/` is organized by domain:

```
services/
├── ledger/
│   ├── ledger.service.ts         # Double-entry transaction recording (IMPLEMENTED)
│   └── truth-log.service.ts      # SHA-256 hash-chained event log (IMPLEMENTED)
├── fury-router/
│   ├── fury-router.service.ts    # BullMQ proof routing to anonymous reviewers (IMPLEMENTED)
│   └── ConsensusEngine.ts        # Verdict aggregation (IMPLEMENTED)
├── escrow/
│   ├── stripe.service.ts         # Stripe FBO hold/capture/cancel (IMPLEMENTED)
│   └── dispute.service.ts        # $5 appeal fee + escalation (IMPLEMENTED)
├── health/
│   └── aegis.service.ts          # BMI floor + velocity cap validation (IMPLEMENTED)
├── intelligence/
│   ├── honeypot.service.ts       # Known-fail proof injection for Fury QA (IMPLEMENTED)
│   └── GeminiClient.ts           # Gemini 2.5 Flash API: callGemini, generateVCQuestions, simplifyConcept (IMPLEMENTED)
├── security/
│   ├── geofence.service.ts       # IP-to-state jurisdiction check (IMPLEMENTED, mock lookup)
│   └── moderation.service.ts     # Permanent user ban via TruthLog (IMPLEMENTED)
├── anomaly/
│   └── anomaly.service.ts        # pHash duplicate detection + EXIF validation (IMPLEMENTED)
├── geofencing.ts                 # JurisdictionTier enum + STATE_TIERS map
└── billing.ts                    # Pricing constants ($14.99/mo, $4.99 ticket, $5 appeal)
```

Additional API code:
- `src/api/guards/auth.guard.ts` — JWT auth guard (real JWT with dev-secret fallback)
- `src/api/config/queue.config.ts` — Redis/BullMQ connection config
- `src/api/database/schema.sql` — PostgreSQL double-entry ledger + hash-chained event_log
- `src/api/src/modules/b2b/` — B2B billing, webhook, anonymization, and data lake services
- `src/api/src/modules/notifications/` — Real-time notifications (SSE stream, unread count, mark-read)
- `src/api/src/modules/payments/` — Stripe webhook handler (payment_intent.succeeded/failed, disputes)

### Core Algorithms (in `src/shared/libs/`)

**Integrity Score** (`integrity.ts`): `Base(50) + 5/completion - 15/fraud - 20/strike - 1/inactive_month`. Floor at 0. Score determines financial tier access (RESTRICTED < 20, MICRO < 50, STANDARD < 100, HIGH_ROLLER < 500, WHALE >= 500).

**Fury Accuracy** (`integrity.ts`): `(successful - (false_accusations * 3)) / total`. Demotion triggers below 0.8 accuracy after 10-audit burn-in.

**Behavioral Logic** (`behavioral-logic.ts`): 6 oath category streams (Biological, Cognitive, Professional, Creative, Environmental, Character) with 8 verification methods. Constants: grace days (2/month), onboarding bonus ($5), loss aversion λ=1.955, downscale after 3 strikes, 7-day cool-off, BMI floor 18.5, 2% weekly loss velocity cap.

### Web App Features

- **PitchDeck** (`src/web/components/PitchDeck/`): 10-slide interactive presentation with p5.js animated backgrounds, Gemini AI advisor panel ("Grill Me" VC questions, "ELI5" simplifier), and script panel.
- **Linguistic Cloaker** (`src/web/utils/linguistic-cloak.ts`): Runtime vocabulary swap (stake→vault, bet→commitment, fury→peer review) for App Store/Stripe compliance contexts.
- **Routes**: `/dashboard`, `/fury` (audit workbench), `/wallet`, `/pitch`, `/hr` (B2B)

### Infrastructure

- **Database**: PostgreSQL 15-alpine (docker-compose), double-entry ledger with ACID
- **Queue**: Redis 7-alpine + BullMQ (Fury Router queue: `FURY_ROUTER_QUEUE`)
- **Storage**: Cloudflare R2 (zero-egress video hosting, signed URLs only)
- **Payments**: Stripe (FBO escrow model — hold/capture/cancel pattern)
- **AI**: Gemini 2.5 Flash (`gemini-2.5-flash-preview-09-2025`)
- **CI**: GitHub Actions (`.github/workflows/ci.yml`) — Node 20, npm ci, turbo test + build
- **CD**: GitHub Actions (`.github/workflows/deploy.yml`) — tag-triggered deploy to Render + smoke test
- **IaC**: Terraform (`infra/terraform/`) — Render services, Cloudflare R2 bucket, WAF rules

### Key Design Constraints

- **Zero Trust**: Never trust client-side data. All biometric/financial validation is server-side.
- **No Egress**: Media files never leave R2 buckets; serve only via signed URLs.
- **Stygian Terminology**: Fury (auditor), Vault (escrow), Oath (contract), Styx (platform). Swap to neutral terms in app store builds via the linguistic cloaker.
- **Native bridges**: HealthKit/Google Fit must be native Swift/Kotlin — no cross-platform wrappers for sensor layer.

## Conventions

- **Commits**: Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:`)
- **Branching**: `feat/fury-bounty-ui`, `fix/ledger-race`
- **Files**: kebab-case; double-hyphen separates function from descriptor (`research--behavioral-economics.md`)
- **TypeScript**: strict mode, named exports, async/await
- **NestJS services**: `@Injectable()` classes with constructor DI; mocked via `setQueue()`/constructor injection in tests

## Documentation

All docs live in `docs/`:

- `docs/architecture/` — Truth-blockchain blueprint, feasibility stack, implementation plan
- `docs/architecture/there+back-again.md` — 5-phase Alpha-to-Omega roadmap (v3.0) with validation gates
- `docs/legal/` — Compliance guardrails, gambling law analysis, gatekeeper compliance
- `docs/research/` — Behavioral economics, market analysis, competitor teardown, psychology
- `docs/api/spec.md` — API endpoint specification (auth, contracts, fury audit, ledger)
- `docs/MANIFEST.md` — Annotated bibliography and process history of all project artifacts
- `docs/roadmap--ai-workstreams.md` — AI-driven workstream breakdown

## Environment

Copy `.env.example` → `.env`. Required vars: `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `DATABASE_URL`, `REDIS_URL`, `CLOUDFLARE_R2_ACCESS_KEY`, `CLOUDFLARE_R2_SECRET_KEY`, `JWT_SECRET`.

Docker services (port mappings): PostgreSQL on `5432`, Redis on `6379`, API on `3000`.

## Implementation Status

**Implemented**: LedgerService (double-entry transactions), TruthLogService (hash-chained audit log), FuryRouterService (BullMQ proof routing), ConsensusEngine (verdict aggregation), StripeFboService (hold/capture/cancel), DisputeService (appeal fee), AegisProtocolService (BMI/velocity validation), GeofenceService (jurisdiction blocking), ModerationService (permanent bans), HoneypotInjectorService (Fury QA), AnomalyService (pHash duplicate detection + EXIF validation), WebhookService (HMAC-signed B2B dispatch), GeminiClient (Gemini 2.5 Flash API — VC questions, ELI5, **goal ethics screening**), AiController (POST /ai/grill-me, POST /ai/eli5), AuthGuard (JWT), OnboardingWizard, linguistic cloaker, integrity scoring algorithms, PitchDeck UI (routed through API), Desktop admin panels, **Fury Bounty Economy** (AUDITOR_STAKE_AMOUNT disbursed via ledger on consensus — bounty for correct votes, penalty for incorrect/honeypot failures), **Fury Stats API** (GET /fury/stats — audit counts, earnings, accuracy), **Fury Stats UI** (workbench stats bar — audits, accuracy, earnings, honeypots, penalties — web + mobile), **Wallet Economy UI** (balance summary, transaction history with human-readable labels for FURY_BOUNTY/FURY_PENALTY/STAKE_HOLD/STAKE_RELEASE/ONBOARDING_BONUS), **Tavern Board bounty events** (FURY_BOUNTY_PAID / FURY_PENALTY_CHARGED in public feed, using api-client), **isGoalEthical()** (Gemini 2.5 Flash content policy screening — fail-open), **CI pipeline with gates** (lint + Gate 04 redacted build check + Gate 05 behavioral physics check), **Core algorithm tests** (integrity score, tiers, accuracy, demotion, stake limits — 20 cases), **AiController tests** (grill-me + eli5 — 6 cases), **GitHub issue/PR templates**, **Mobile Fury stats parity** (getFuryStats + getBalance in mobile ApiClient), **Mobile Platform Parity** (CreateContractScreen — full oath creation form with 6 streams/23 categories, verification method picker, stake input, duration picker, Aegis BMI/velocity client-side preview for BIOLOGICAL_WEIGHT; WalletScreen — balance summary, integrity score, tier display, transaction history with TX_TYPE_LABELS; SettingsScreen — password change, notification preferences, account deletion; 6-tab navigation with Wallet tab; ApiClient: changePassword, updateSettings, deleteAccount; DashboardScreen: balance display + CreateContract quick action), **Test Coverage Expansion** (Phase Xi — Jest+ts-jest infrastructure for mobile/desktop; 34 mobile tests across 5 spec files: ApiClient, SessionService, EnterpriseSSO, UploadService, NotificationService; 11 desktop tests: admin API client; 15 new web tests: api-client; total ~377 tests across 5 workspaces).

**Phase Omicron (Feb 2026)**: **AnonymizeService** (PII-stripping middleware for B2B HR exports — one-way user ID hashing, PII field stripping, date coarsening to month granularity), **DataLakeService** (batch analytics extraction — contract metrics by oath category, behavioral trends, cohort analysis, PostgreSQL logical replication slot + publication setup), **OfflineCache** (mobile offline mode — TTL-based response caching, mutation queue with replay on reconnect), **Cloud IaC** (Terraform configs for Render API/Web + Cloudflare R2 + WAF rules — rate limiting, security headers, bot management, edge geofencing), **Deploy Pipeline** (GitHub Actions tag-triggered deployment with smoke test). New tests: 26 (AnonymizeService: 16, DataLakeService: 6, OfflineCache: 10, B2BController: 2 new endpoints). **Total ~430 tests across 5 workspaces**.

**Remaining limitations**: CameraModule (mobile camera requires native Swift/Kotlin — placeholder UI with text proof submission). Native HealthKit/Google Fit bridges require Xcode/Android Studio (architectural stubs in place).
