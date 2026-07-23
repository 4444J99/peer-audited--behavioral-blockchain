# Styx: Internal Positioning

**STATUS: INTERNAL RECORD ONLY — NEVER PUBLISHED AS PRICES.**

This document is the internal anchor for the inbound-magnet strategy applied to Styx (`peer-audited--behavioral-blockchain`). It captures the target market, the value proposition, and the engagement-depth ladder routed from the repository's front door. The public README carries the door; this file carries the weights behind it. **No dollar figures appear on the public page — the production-grade weight of the artifact is the price signal.**

## 1. The Expensive Problem (The "Bleed")

**The Target:** Operators of accountability and commitment programs — corporate-wellness and HR-benefits teams, insurers and wellness-incentive platforms, and habit/commitment product teams.

**The Problem:** Accountability programs fail at the two places that actually cost money: the stakes aren't real (so there's no behavioral force), the proof isn't trustworthy (so completion is self-reported and gamed), and the moment an employer touches individual health data they inherit a privacy and compliance liability they cannot defend. The result is wellness spend that buys good intentions and no measurable follow-through.

**The Cost:** Squandered benefits budgets, unredeemable engagement metrics, and an un-ownable health-data liability — all of it recurring, all of it invisible until an audit or a breach makes it visible.

## 2. Who Pays (The "Buyer")

There are two high-ticket buyers for this capability, served by the same proof.

### A. The B2B / Enterprise Buyer (Deploy / License)

- **Who:** Heads of Total Rewards / Benefits, VPs of People, corporate-wellness platform owners, and insurers running incentive programs.
- **Why they pay:** They need an *enforcement engine with a privacy firewall*. Styx's B2B tier ("Sponsored Pots — Company Pays, Employee Plays") lets the employer fund the pot while the employer **never** sees individual weight, steps, or sleep — only aggregate success and engagement, gated behind k-anonymity (minimum 5 users per group). It ships CRM connectors (Salesforce, HubSpot) and HRIS connectors (Workday, BambooHR), roster sync with pre-funded invite links, per-active-user invoicing, and webhook-driven contract freezing on termination.
- **The Signal:** They want a white-labeled instance, an API license, or a managed deployment plugged into their existing HRIS/CRM stack.

### B. The Talent Buyer (Hire / Acquire)

- **Who:** VPs of Engineering, Directors of Product, and elite technical recruiters at fintech, payments, marketplace, and health-tech companies.
- **Why they pay:** They are buying the hands that shipped a regulated-money product end to end — a double-entry ACID ledger, Stripe FBO escrow (hold / capture / cancel), a BullMQ consensus engine, KYC via Stripe Identity, geofencing by US jurisdiction, and a four-surface monorepo (NestJS API, Next.js web, React Native mobile, Tauri desktop) with 1,107 tests and CI gates (validation gates, CodeQL, Playwright E2E).
- **The Signal:** They are filling Senior / Staff engineering and technical-leadership roles in the $100k–$200k+ band.

## 3. Why It's High-Ticket (The "Weight")

We do not negotiate and we do not do "Fiverr-style" gigs. The engagement starts serious; the price is implicit in the production weight of the artifact.

- **Regulated-money architecture:** A double-entry ledger where every transaction is a balanced debit/credit pair (no phantom money), Stripe FBO escrow, a SHA-256 hash-chained audit log for tamper-evident history, KYC/age verification, and geofenced jurisdiction tiers.
- **A trust engine, not a toy:** The Fury Router runs anonymous peer review through a BullMQ queue with honeypot injection to QA reviewer accuracy, a consensus engine to aggregate verdicts, and a bounty economy that pays correct verdicts and penalizes false accusations. The entire value proposition is that money movement is *provably* correct.
- **A privacy firewall enterprises can't cheaply build:** Aggregate-only analytics, k-anonymity enforcement, and a hard `403` on any attempt to read individual data with a B2B admin token.
- **Verification rigor:** 1,107 tests, dedicated validation gates (phantom-money check, oracle spoof check, full-loop, claim-drift), CodeQL, an E2E matrix, and Terraform IaC.
- **Scarcity:** Engineers who can bridge behavioral economics, escrowed payments, anti-fraud consensus, and multi-platform delivery — under strict compliance — are rare.

## 4. The Engagement-Depth Ladder (The "Ascent")

When an inbound lead arrives from the README CTA, they are routed up this ladder by need and budget capability. Anchors are *internal depth markers only* — never quoted as a public price list.

**Level 1 — Tactical Consult / Architecture Audit (Paid Discovery).**
Review the prospect's accountability, escrow, or ledger stack against the Styx blueprint and deliver an integration roadmap. Paid upfront; filters out tire-kickers immediately.

**Level 2 — Enterprise License / White-Label Deploy.**
A dedicated, branded instance — or the core enforcement engine integrated via API into the prospect's HRIS/CRM with the privacy firewall intact. Recurring per-active-user.

**Level 3 — Custom Build / Team Augmentation.**
Net-new capability on the Styx architecture for their operational reality — new CRM/HRIS connectors, new oracle/proof types, new jurisdictions — at premium enterprise-consulting depth.

**Level 4 — Talent Acquisition (Hiring).**
The buyer wants the builder and offers a full-time, high-impact role. Senior / Staff compensation bands ($100k–$200k+).
