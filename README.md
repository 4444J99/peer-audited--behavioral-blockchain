# Styx: The Blockchain of Truth

A peer-audited behavioral market that weaponizes loss aversion (coefficient 1.955) to enforce habit follow-through via financial stakes. Users stake money into behavioral contracts; a decentralized "Fury" network audits compliance; hardware oracles and a double-entry ledger enforce integrity.

## Architecture

Turborepo monorepo with **npm** workspaces. Package scope: `@styx/*`.

| Workspace | Package | Stack | Role |
|-----------|---------|-------|------|
| `src/api` | `@styx/api` | NestJS 10, BullMQ, Stripe, PostgreSQL | Backend — ledger, escrow, Fury Router, oracles |
| `src/web` | `@styx/web` | Next.js 16, React 18, Tailwind, p5.js | Dashboard, Fury audit workbench, interactive pitch deck |
| `src/mobile` | `@styx/mobile` | React Native 0.73 | Sensor bridge (HealthKit/Google Fit), camera, biometrics |
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
- **CI**: GitHub Actions (5-stage pipeline)

## Getting Started

### Prerequisites

- Node.js >= 18
- Docker & Docker Compose
- npm 10+

### Setup

```bash
# Start infrastructure (PostgreSQL + Redis)
docker-compose up -d

# Install dependencies across all workspaces
make install

# Run all services (API + Web + Mobile)
make dev
```

Docker services: PostgreSQL on `5432`, Redis on `6379`, API on `3000`.

### Environment

Copy `.env.example` to `.env` and set: `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `DATABASE_URL`, `REDIS_URL`, `CLOUDFLARE_R2_ACCESS_KEY`, `CLOUDFLARE_R2_SECRET_KEY`, `JWT_SECRET`.

## Testing

270+ tests across all workspaces using Jest + ts-jest.

```bash
make test                    # All tests via Turborepo
cd src/api && npx jest       # API tests only
cd src/shared && npx jest    # Shared algorithm tests only
npx jest --testNamePattern="should reject"  # Single test by name
```

### CI Pipeline (5 stages)

1. **Test** — `turbo run test` (all workspaces)
2. **Build** — `turbo run build` (all workspaces)
3. **Lint** — `turbo run lint` (strict TypeScript)
4. **Gate 04** — Redacted build check (no gambling terminology in production)
5. **Gate 05** — Behavioral physics validation (integrity algorithm constants)

### Validation Scripts

```bash
npx tsx scripts/validation/01-phantom-money-check.ts     # Ledger balance integrity
npx tsx scripts/validation/02-simulator-spoof-check.ts    # Hardware oracle anti-spoof
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
- **BMI/Velocity Guardrails** — Aegis Protocol enforces BMI floor (18.5) and 2% weekly loss velocity cap.
- **Geofencing** — Jurisdiction-based tier restrictions by US state.
- **Linguistic Cloaker** — Runtime vocabulary swap (stake/vault, bet/commitment) for App Store compliance.
- **Integrity Scoring** — `Base(50) + 5/completion - 15/fraud - 20/strike - 1/inactive_month`. Score determines financial tier access.
- **Goal Ethics Screening** — Gemini 2.5 Flash content policy check on user-submitted goals.

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

## License

Private. See `docs/legal/` for compliance guardrails.
