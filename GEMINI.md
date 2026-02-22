# Styx: The Blockchain of Truth - Context & Instructions

This document provides instructional context for AI agents working on the **Styx** project. It outlines the project's purpose, architecture, core mechanics, and development standards.

## Project Overview
**Styx** is a decentralized, peer-audited behavioral market designed to monetize human follow-through. It weaponizes **loss aversion** (using a validated coefficient of 1.955) by requiring users to stake financial deposits into behavioral contracts.

### Core Mechanics
1. **The Fury Bounty**: A decentralized anti-cheat system where users are financially incentivized to audit and expose fraudulent claims of their peers.
2. **Hardware Oracles**: Server-side verification of biometric data (HealthKit, Google Fit, Whoop) that strictly filters out manual entries to ensure "Hardware-Only" truth.
3. **The Aegis Protocol**: A suite of hardcoded legal and medical guardrails (18+ age gate, 18.5 BMI floor, 2% weekly loss velocity cap) to ensure regulatory compliance.
4. **Double-Entry Ledger**: A strict PostgreSQL-based bookkeeping system that ensures absolute financial integrity for all stakes, bounties, and platform fees.

## Architecture
Styx is implemented as a **Monorepo** managed by Turborepo.

*   **`src/api`**: NestJS backend. Responsible for the ledger, escrow (Stripe Connect), and the Fury Router (BullMQ/Redis).
*   **`src/mobile`**: React Native mobile application for iOS and Android. Contains native bridges for biometric sensors.
*   **`src/web`**: Next.js web application for consumer dashboards and the "Fury Audit" workbench.
*   **`src/desktop`**: Electron/Tauri admin dashboard for "The Judge" (dispute resolution).
*   **`src/shared`**: Shared TypeScript types, utility libraries (Integrity Score algorithm, BMI calculators), and shared UI components.

## Building and Running
The project uses a `Makefile` for high-level operations and `yarn` for package management.

### Key Commands
- `make install`: Install dependencies for the entire monorepo.
- `make dev`: Start all services in development mode.
- `make build`: Build all services for production.
- `make test`: Run the full test suite (Unit, Integration, and E2E).
- `make docker-up`: Spin up local infrastructure (PostgreSQL, Redis).

## Development Conventions
- **Modular Theory**: Every element should be one function logically. Small, focused, and testable modules are mandatory.
- **Zero Trust**: Never trust client-side data. All critical validation (Health data, Financial status) must occur server-side.
- **Conventional Commits**: All git commits must follow the Conventional Commits 1.0.0 specification.
- **Test-Driven Development (TDD)**: No feature implementation is complete without corresponding test coverage in `tests/`.
- **Naming Convention**: Use kebab-case for filenames and functional descriptors (e.g., `research--behavioral-economics.md`).

## Key Technology Stack
- **Languages**: TypeScript (Strict Mode), Swift, Kotlin.
- **Backend**: NestJS, PostgreSQL (ACID compliant), Redis (Sorted Sets for leaderboards).
- **Frontend**: Next.js, React Native, Electron/Tauri.
- **Infrastructure**: Cloudflare R2 (Storage), Stripe Connect (FBO Escrow), BullMQ (Queueing).

## Documentation Reference
Comprehensive documentation is located in the `docs/` directory:
- `docs/architecture/`: Technical specs and feasibility reports.
- `docs/legal/`: Regulatory guardrails and compliance analysis.
- `docs/research/`: Scientific foundation and market analysis.
- `docs/roadmap.md`: 5-month Alpha-to-Omega sprint plan.
