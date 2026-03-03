# Styx: The Blockchain of Truth - Context & Instructions

This document provides instructional context for AI agents working on the **Styx** project. It outlines the project's purpose, architecture, core mechanics, and development standards.

## Project Overview

**Styx** is a decentralized, peer-audited behavioral market focused on **relationship recovery** and the **No Contact** rule. It weaponizes **loss aversion** (using a validated coefficient of 1.955) by requiring users to stake financial deposits into behavioral contracts.

### Core Mechanics

1. **The Fury Bounty**: A decentralized anti-cheat system where users are financially incentivized to audit and expose fraudulent claims of their peers.
2. **Digital Exhaust Verification**: Server-side analysis of whistleblower-submitted communication artifacts (texts, call logs) to prove No Contact breaches.
3. **The Recovery Protocol**: Psychological guardrails for No Contact contracts — 30-day max duration, 3-target cap, mandatory accountability partner, and 4-way safety acknowledgments (voluntary, no minors, no dependents, no legal obligations).
4. **The Aegis Protocol**: A suite of hardcoded legal and psychological guardrails (18+ age gate, weekend volatility multipliers, dynamic penalty scaling) to ensure regulatory compliance and behavioral stability.
5. **Double-Entry Ledger**: A strict PostgreSQL-based bookkeeping system that ensures absolute financial integrity for all stakes, bounties, and platform fees.

## Architecture

Styx is implemented as a **Monorepo** managed by Turborepo.

* **`src/api`**: NestJS backend. Responsible for the ledger, escrow (Stripe FBO), and the Fury Router (BullMQ/Redis).
* **`src/web`**: Next.js web application for consumer dashboards and the "Fury Audit" workbench.
* **`src/mobile`**: React Native mobile application for iOS and Android. Contains deep linking for Whistleblower intake loops, camera module for digital exhaust capture.
* **`src/desktop`**: Tauri 2.0 admin dashboard for "The Judge" (dispute resolution).
* **`src/pitch`**: Vite + React interactive pitch deck (builds to `docs/` for GitHub Pages).
* **`src/shared`**: Shared TypeScript types, utility libraries (Integrity Score algorithm, behavioral logic constants), and shared UI components.

## Building and Running

The project uses a `Makefile` for high-level operations and **npm** (with workspaces + Turborepo) for package management.

### Key Commands

* `make install`: Install dependencies for the entire monorepo (`npm ci`).
* `make dev`: Start all services in development mode (`turbo run dev`).
* `make build`: Build all services for production.
* `make test`: Run the full test suite (Unit, Integration, and E2E).
* `make docker-up`: Spin up local infrastructure (PostgreSQL + Redis).

## Development Conventions

* **Modular Theory**: Every element should be one function logically. Small, focused, and testable modules are mandatory.
* **Privacy-First Verification**: Digital Exhaust verification (Texts/Logs) must prioritize privacy. Research and prioritize Zero-Knowledge Proofs (ZKPs) or local-only processing to prevent server-side exposure of sensitive metadata.
* **Zero Trust**: Never trust client-side data. All critical validation (Whistleblower artifacts, Financial status) must occur server-side.
* **Auditor Integrity**: The Fury Network is the system's "Shatter Point." Implementation must include anti-collusion logic, honeypot injection, and aggressive slashing for dishonest reviewers.
* **Conventional Commits**: All git commits must follow the Conventional Commits 1.0.0 specification.
* **Test-Driven Development (TDD)**: No feature implementation is complete without corresponding test coverage.
* **Naming Convention**: Use kebab-case for filenames and functional descriptors (e.g., `research--behavioral-economics.md`).

## Key Technology Stack

* **Languages**: TypeScript (Strict Mode), Swift, Kotlin.
* **Backend**: NestJS, PostgreSQL (ACID compliant), Redis (Sorted Sets for leaderboards).
* **Frontend**: Next.js, React Native, Tauri 2.0.
* **Infrastructure**: Cloudflare R2 (Storage), Stripe (FBO Escrow), BullMQ (Queueing).
* **AI**: Gemini 2.5 Flash (goal ethics screening, VC questions, ELI5).

## Documentation Reference

Comprehensive documentation is located in the `docs/` directory:

* `docs/architecture/`: Technical specs and feasibility reports.
* `docs/legal/`: Regulatory guardrails and compliance analysis.
* `docs/research/`: Scientific foundation and market analysis.
* `docs/roadmap.md`: 5-month Alpha-to-Omega sprint plan.
