# Styx: The Blockchain of Truth

![CI](https://github.com/labores-profani-crux/peer-audited--behavioral-blockchain/actions/workflows/ci.yml/badge.svg)
![License: Private](https://img.shields.io/badge/license-private-red)

A peer-audited behavioral market that uses loss aversion (coefficient 1.955) to enforce the "No Contact" rule via financial stakes. Users stake money into behavioral contracts; a decentralized "Fury" network audits compliance; digital exhaust tracking and a double-entry ledger enforce integrity.

## Architecture

Turborepo monorepo with **npm** workspaces. Package scope: `@styx/*`.

| Workspace | Package | Stack | Role |
|-----------|---------|-------|------|
| `src/api` | `@styx/api` | NestJS 10, BullMQ, Stripe, PostgreSQL | Backend — ledger, escrow, Fury Router, whistleblower logic |
| `src/web` | `@styx/web` | Next.js 16, React 18, Tailwind, p5.js | Dashboard, Fury/Whistleblower audit workbench, Interactive pitch deck |
| `src/mobile` | `@styx/mobile` | React Native 0.76 | Client telemetry, deep linking, UI notifications |
| `src/desktop` | `@styx/desktop` | Tauri 2.0, Vite, React | "The Judge" admin dashboard |
| `src/shared` | `@styx/shared` | TypeScript | Constants, types, algorithms (integrity score, behavioral logic) |

## Tech Stack

- **Runtime**: Node.js 20+
- **Package Manager**: npm (workspaces + Turborepo)
- **Database**: PostgreSQL 15 (double-entry ledger with ACID)
- **Queue**: Redis 7 + BullMQ (Fury Router)
- **Payments**: Stripe (FBO escrow — hold/capture/cancel)
- **Storage**: Cloudflare R2 (zero-egress video hosting)
- **AI**: Gemini 2.5 Flash (VC questions, ELI5, goal ethics screening)
- **Logging**: Pino (structured JSON in production, pretty-print in dev)
- **Security**: Helmet, rate limiting, JWT auth, geofencing
- **CI**: GitHub Actions (`build_and_test` + CodeQL; validation gates 04-06)
- **API Docs**: OpenAPI/Swagger at [`/api/docs`](#api-documentation)

## Getting Started

### Prerequisites

- Node.js >= 20
- Docker & Docker Compose
- npm 10+

### Setup

```bash
# Start infrastructure (PostgreSQL + Redis)
docker-compose up -d

# Install dependencies across all workspaces
make install

# Run database migrations
cd src/api && npm run migrate && cd ../..

# Run all services (API + Web + Mobile)
make dev
```

Docker services: PostgreSQL on `5432`, Redis on `6379`, API on `3000`.

### Environment

Copy `.env.example` to `.env` and set: `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `DATABASE_URL`, `REDIS_URL`, `CLOUDFLARE_R2_ACCESS_KEY`, `CLOUDFLARE_R2_SECRET_KEY`, `JWT_SECRET`.

Compliance/geofence runtime flags:
- `KYC_ENFORCEMENT_ENABLED=false` (default; reserved until KYC is implemented)
- `GEOFENCE_FAIL_OPEN_ON_MISSING_HEADERS=true` (default fail-open outside CDN/header-aware environments)

**Important**: `JWT_SECRET` is required in production (`NODE_ENV=production`). The API will refuse to start without it.

## API Documentation

Interactive Swagger/OpenAPI docs are available at `/api/docs` when the API is running:

```bash
cd src/api && npm run dev
# Open http://localhost:3000/api/docs
```

## Testing

Current baseline (February 26, 2026): **474 tests** across all workspaces using Jest + ts-jest.

```bash
make test                    # All tests via Turborepo
cd src/api && npx jest       # API tests only
cd src/shared && npx jest    # Shared algorithm tests only
npx jest --testNamePattern="should reject"  # Single test by name
```

### CI Pipeline (Current)

`/.github/workflows/ci.yml` currently runs:

1. **Install + Security Audit** — `npm ci`, `npm audit --audit-level=high`
2. **Tests** — `turbo run test` (all workspaces)
3. **Build** — `turbo run build` (all workspaces)
4. **Lint** — `turbo run lint` (strict TypeScript)
5. **Gate 04** — Redacted build check (no gambling terminology in production)
6. **Gate 05** — Behavioral physics validation (conditional on `CI_GATE05_API_URL`)
7. **Gate 06** — Security invariant check
8. **CodeQL** — Separate `codeql` job for JS/TS analysis

### Validation Scripts

```bash
npx tsx scripts/validation/01-phantom-money-check.ts     # Ledger balance integrity
npx tsx scripts/validation/02-simulator-spoof-check.ts    # Whistleblower link verification
npx tsx scripts/validation/03-the-full-loop.ts            # End-to-end contract lifecycle
bash scripts/validation/04-redacted-build-check.sh        # Production vocabulary sweep
npx tsx scripts/validation/05-behavioral-physics-check.ts  # Algorithm constant validation
```

## Key Features

- **Double-Entry Ledger** — Every financial transaction is a balanced debit/credit pair. No phantom money.
- **Fury Peer Review** — Anonymous auditors verify proof submissions via BullMQ queue. Consensus engine aggregates verdicts.
- **Bounty Economy** — Furies earn bounties for correct verdicts and pay penalties for false accusations or honeypot failures.
- **Hash-Chained Audit Log** — SHA-256 linked event log for tamper-evident history.
- **Honeypot Injection** — System injects known-fail proofs to QA reviewer accuracy.
- **Relapse Multipliers** — Aegis Protocol enforces dynamic penalty scaling (e.g., Weekend Multiplier) to match predictable emotional vulnerability windows.
- **Geofencing** — Jurisdiction-based tier restrictions by US state.
- **Linguistic Cloaker** — Runtime vocabulary swap (stake/vault, bet/commitment) for App Store compliance.
- **Integrity Scoring** — `Base(50) + 5/completion - 15/fraud - 20/strike - 1/inactive_month`. Score determines financial tier access.
- **Goal Ethics Screening** — Gemini 2.5 Flash content policy check on user-submitted goals.
- **Structured Logging** — Pino JSON logs with request tracing for production observability.

## Commands

| Command | Description |
|---------|-------------|
| `make install` | Install all workspace dependencies |
| `make dev` | Start API + Web + Mobile dev servers |
| `make build` | Build all workspaces |
| `make test` | Run all tests |
| `make docker-up` | Start PostgreSQL + Redis |
| `npx turbo run lint` | TypeScript strict lint |
| `npm run format` | Prettier across all workspaces |
| `npm run clean` | Clean build artifacts + node_modules |
| `cd src/api && npm run migrate` | Run database migrations |

## Security

See [SECURITY.md](SECURITY.md) for vulnerability disclosure policy and security controls.

## License

Private. See `docs/legal/` for compliance guardrails.
