# Styx: Parallel AI-Engineer Workstreams (Alpha to Omega)

This document provides an exhaustive, phase-by-phase execution plan designed specifically for an autonomous group of parallel AI engineers. The Styx project is built in a Turborepo monorepo, requiring strict boundary management to ensure independent workstreams do not block each other.

The goal is to move from **Phase Alpha (The Iron Core)** to **Phase Omega (The Empire)** with maximal concurrency, zero trust architectures, and uncompromised compliance.

---

## 1. Workstream 1: API & Ledger Core (Backend / NestJS)

**Primary Focus**: Financial truth, ACID compliance, rule logic, queue routing.
**Dependencies**: Postgres, Redis, BullMQ, Stripe.
**Target Directory**: `src/api`, `src/shared`

* **Phase Alpha (The Iron Core)**
  * **Double-Entry Ledger Engine**: Implement `LedgerService` with transactional PostgreSQL locking to ensure zero money-printing (the "Phantom Money Test").
  * **Truth Log (Hash-Chained)**: Implement cryptographically signed log inserts for all state mutations.
  * **Stripe FBO Routing Base**: Scaffold Stripe API keys, customer creation, and fundamental hold/capture mechanisms.
* **Phase Beta (The Shield)**
  * **The Aegis Protocol**: Implement the core logic rules engine (BMI > 18.5, max 2% weight loss/week, age > 18).
  * **API Guards**: Basic authentication and rate-limiting.
* **Phase Gamma (The Panopticon)**
  * **The Fury Router**: Implement BullMQ workers to randomize and distribute video verification tasks to 3 anonymous peers.
  * **Honeypot Injector**: Write a cron service that randomly injects "known-fail" proofs to strictly grade reviewer accuracy.
* **Phase Delta (The Arena)**
  * **Dispute Logic**: Backend handling for the $5 appeal fee and Judge escallation endpoints.
  * **Geofencing Middleware**: Implement strict IP checks blocking "Any Chance" jurisdictions from transacting.
* **Phase Omega (The Empire)**
  * **B2B Data API**: Open webhooks returning anonymized behavioral velocity stats for Enterprise CRM (Salesforce/HubSpot).
  * **Consumption Billing Server**: Track and bill Enterprise users on an "Insights Generated" basis.

---

## 2. Workstream 2: Hardware Oracles (React Native Mobile)

**Primary Focus**: Tamper-proof sensor bridges, biometric constraints, on-the-go video ingestion.
**Dependencies**: Native iOS/Android modules, HealthKit, Google Fit.
**Target Directory**: `src/mobile`

* **Phase Alpha (The Iron Core)**
  * **Mobile Scaffolding**: React Native setup with bare workflow for native module access.
  * **Auth \& Session**: Implementation of generic sign-in and user token storage.
* **Phase Beta (The Shield)**
  * **iOS HealthKit Native Bridge (Swift)**: Write strict read-only queries. **CRITICAL**: Filter out `HKWasUserEntered` to reject manual data.
  * **Android Google Fit Bridge (Kotlin)**: Read-only `Sensors API` and `History API` querying, filtering for raw hardware streams only.
* **Phase Gamma (The Panopticon)**
  * **Secure Video Capture**: Implement in-app camera (disabling gallery uploads) to force raw, real-time proof.
  * **Upload Pipeline**: Directly upload buffer to pre-signed Cloudflare R2 links.
* **Phase Delta (The Arena)**
  * **User "Tavern" Feed**: Gamified mobile UI to view leaderboards, notifications, and ongoing habit stakes.
  * **Push Notifications**: Reminders for Grace Days, incoming Fury reviews, and Endowed Progress alerts.
* **Phase Omega (The Empire)**
  * **Enterprise Deep Links**: SSO implementation allowing corporate employees to seamlessly transition from internal company portals.
  * **Offline Mode**: Caching structural logic/rules for low-connectivity environments.

---

## 3. Workstream 3: Social \& Consumer Web (Next.js)

**Primary Focus**: Peer review dashboards, Plaid financial proofs, B2C funnel.
**Dependencies**: Next.js, React, Tailwind, Plaid Link, Cloudflare Stream Player.
**Target Directory**: `src/web`

* **Phase Alpha (The Iron Core)**
  * **Vercel / Next.js Setup**: Monorepo routing and public landing/marketing pages for Phase Zero (Manifesto) communication.
  * **Identity Dashboard**: Basic user profile and stake-history UI.
* **Phase Beta (The Shield)**
  * **Financial Oracle (Plaid Link)**: Integrate `react-plaid-link` on frontend, fetching read-only account balances without ledger transfer permissions.
* **Phase Gamma (The Panopticon)**
  * **The Fury Portal**: Build the anonymous peer-review workbench. HLS video playback integration without exposing real-world user data.
  * **Review UX**: Form interface for Pass/Fail/Flag decisions and confidence scores.
* **Phase Delta (The Arena)**
  * **Gamified Leaderboards**: Real-time Socket.io or SSE updates visualizing ranks based on the Integrity Score algorithms mapping.
  * **Linguistic Cloaking Logic**: Dynamic string replacer (Stake -> Vault, Fury -> Review) to guarantee App Store / Payment compliance.
* **Phase Omega (The Empire)**
  * **HR Dashboard**: "Read-Only" UI for corporate managers to view aggregated, anonymized group habit metrics.

---

## 4. Workstream 4: Desktop "Judge" Admin (Electron/Tauri)

**Primary Focus**: Moderation, dispute resolution, macro platform control.
**Dependencies**: Tauri/Electron, React, heavy data-tables.
**Target Directory**: `src/desktop`

* **Phase Alpha (The Iron Core)**
  * **Tauri Scaffolding**: Setup minimal Rust/WebView wrapper inside Monorepo.
* **Phase Beta (The Shield)**
  * **Ledger Inspection Tool**: Raw read-only view into the PostgreSQL Truth Log to instantly identify balance mismatches or DB transaction failures.
* **Phase Gamma (The Panopticon)**
  * **Macro-Review UI**: Tools to review globally flagged proofs or monitor the global queue health.
* **Phase Delta (The Arena)**
  * **The Judge's Gavel**: Specific UI to override "Fury" verdicts. Handles the $5 manual appeal fee queue and user refunds.
  * **User Ban Mechanism**: Permanent system exile functionality.
* **Phase Omega (The Empire)**
  * **B2B Orchestration Tools**: Controls for generating API keys for Enterprise customers and managing broad billing parameters.

---

## 5. Workstream 5: DevOps, Infrastructure \& Security

**Primary Focus**: Deployment stability, video transcoding pipelines, database hosting.
**Dependencies**: Ansible/Terraform, Docker, Cloudflare R2, Stripe configuration.
**Target Directory**: `scripts/`, `infra/` (to be created as needed within Turborepo)

* **Phase Alpha (The Iron Core)**
  * **Docker-Compose Magic**: Unify PostgreSQL, Redis, and local mock APIs into a single `make docker-up` development orchestrator.
  * **Cloud Hosting Pipelines**: Scaffold Github Actions for staging API, Web, and Desktop artifacts.
* **Phase Beta (The Shield)**
  * **High-Risk Merchant Routing**: Scripted automated checks/webhooks to handle Corepay/Allied Wallet fallback logic.
* **Phase Gamma (The Panopticon)**
  * **Zero-Egress Object Storage**: Architecture design/implementation for Cloudflare R2 buckets, lifecycle rules (auto-delete 30 days after review), and pre-signing Lambdas/Edge functions.
* **Phase Delta (The Arena)**
  * **Traffic Shaping / WAF**: Cloudflare WAF setup to block explicit subnets associated with legally banned "Any Chance" jurisdictions.
* **Phase Omega (The Empire)**
  * **Data Lake Extraction**: Automated, sanitized Postgres replication and export to external instances for B2B analytics testing.

---

## Technical Validation Gates (Cross-Workstream Merges)

To prevent siloed failure, specific milestone integration checks are required:

1. **The Phantom Money Check (WS1 + WS5)**: Assert that manual API calls cannot forge internal ledger balances.
2. **The Simulator Spoof Check (WS2 + WS1)**: Assert manual entries in HealthKit trigger automatic rejection on the mobile app.
3. **The Full Loop (WS2 + WS1 + WS3)**: User uploads video in Mobile (WS2) -> API routes it via BullMQ (WS1) -> Fury resolves it on Web Portal (WS3) -> Ledger Updates (WS1).
4. **The "Redacted Build" Check (WS3 + WS4)**: Build output analysis searching for restricted strings (e.g. "bet", "gamble").
