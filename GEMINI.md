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


**Prompting (Google)**: context 1M tokens (Gemini 1.5 Pro), format: markdown, thinking: thinking mode (thinkingConfig)


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
