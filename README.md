# Styx: The Blockchain of Truth (Root Directive)

## 1. System Definition
This is the **Monorepo Root** for the Styx platform. It is the command center for all sub-services.
**Mission**: Monetize human follow-through via loss aversion and decentralized verification.

## 2. Core Mandates
1.  **Zero Trust**: Never trust client-side data.
2.  **No Egress**: Media files never leave our R2 buckets; we use signed URLs only.
3.  **Modular Theory**: One function = One module.
4.  **Stygian Theme**: Terminology must align (Fury, Vault, Oath, Styx).

## 3. Dependency Graph
- **Manager**: `yarn` (Workspaces) + `turbo` (Build System)
- **Database**: PostgreSQL 16 (Double-Entry Ledger)
- **Queue**: Redis 7 + BullMQ (Fury Router)
- **Storage**: Cloudflare R2

## 4. Build & Execution Protocol
- **Install**: `make install` (Installs all dependencies across workspaces).
- **Dev**: `make dev` (Starts API, Web, and Mobile bundlers).
- **Test**: `make test` (Runs Unit + E2E suites).
- **Lint**: `turbo run lint` (Strict TS checks).

## 5. Directory Map
- `src/api`: The NestJS Brain.
- `src/mobile`: The React Native Eye (Sensors).
- `src/web`: The Next.js Interface (Dashboard).
- `src/shared`: The Logic Kernel (Types, Constants).
- `docs/`: The Scripture (Research, Legal, Architecture).

---
**Status**: ACTIVE
**Owner**: Architect (You)
