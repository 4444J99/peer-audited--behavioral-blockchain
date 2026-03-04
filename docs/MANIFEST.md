# Styx Project Manifest: Complete Annotated Bibliography

**Version**: 3.0.0
**Project**: Styx (The Blockchain of Truth)
**Document Count**: 79 entries (61 markdown, 4 binary books, 2 plain text, 6 pitch/build assets, 5 non-md governance, 1 API spec)
**Generated**: 2026-03-04

---

## Part I: Development Threads (Process Narrative)

Development threads trace the intellectual and engineering arc of the project from initial brainstorm through five release cycles (v0.0.1 → v0.4.0) and into the Alpha Launch sprint.

### [TH-01] The Initial Intake & Systematic Review
- **ID**: `TH-01`
- **Tags**: #research #ingestion #analysis
- **Description**: 100% top-to-bottom review of 13 foundational documents including behavioral science, legal consultation, and raw brainstorming. Extracted ~50 distinct architectural mandates and established the project's core psychological and technical requirements.
- **Files**: `DOC-RES-01` through `DOC-RES-07`, `DOC-BRN-01`

### [TH-02] Monorepo Scaffolding & Skeleton Generation
- **ID**: `TH-02`
- **Tags**: #architecture #monorepo #scaffolding
- **Description**: Creation of the Turborepo monorepo structure with npm workspaces to support 6 workspaces (API, Web, Mobile, Desktop, Pitch, Shared). Established the dual-layer services/modules architecture.
- **Files**: `DOC-ADR-01`, `DOC-ARC-01` through `DOC-ARC-04`

### [TH-03] Thematic Re-alignment (The Stygian Shift)
- **ID**: `TH-03`
- **Tags**: #branding #theming #renaming
- **Description**: Project-wide renaming of "Rat Bounty" mechanics to "Fury Bounty," aligning terminology with the mythic themes of the River Styx. Replaced 100+ instances across docs and code stubs.
- **Files**: `DOC-RES-04`, `DOC-RES-13`

### [TH-04] Philosophical Codification (HVCS)
- **ID**: `TH-04`
- **Tags**: #philosophy #cybernetics #logic
- **Description**: Ingestion of the "LaVeyan/Sin" document and its transformation into the "Human Vice Control System" (HVCS) behavioral engine. Redefined "Fury" as systemic feedback gain.
- **Files**: `DOC-RES-05`

### [TH-05] Strategic Auditing & Roadmap Execution
- **ID**: `TH-05`
- **Tags**: #strategy #E2G #roadmap
- **Description**: Execution of the "Evaluation-to-Growth" (E2G) framework and the "There and Back Again" Alpha-to-Omega implementation plan. Produced v3.0 roadmap with Phase Zero (Manifesto) and TCO forecasts.
- **Files**: `DOC-E2G-01`, `DOC-E2G-02`, `DOC-ARC-03`, `DOC-ARC-04`, `DOC-ROAD-01`, `DOC-ROAD-02`

### [TH-06] Gatekeeper & Intermediary Forensics
- **ID**: `TH-06`
- **Tags**: #compliance #risk #platforms
- **Description**: Tactical stress-test of external gatekeepers (App Store Guideline 5.3, Payment Processor Restricted Business lists). Identified "Linguistic Cloaking" and "High-Risk Merchant Underwriting" as critical survival requirements.
- **Files**: `DOC-LEG-03`, `DOC-RES-10`

### [TH-07] Behavioral Engineering Master Synthesis
- **ID**: `TH-07`
- **Tags**: #creativity #resistance #habits
- **Description**: Exhaustive review of external masterpieces (Pressfield, Clear, Brewer, Fogg) to weaponize habit-formation mechanics. Codified the Creative Stream (The Muse) and the "Finish Line Stake Spike."
- **Files**: `DOC-RES-06`, `DOC-EXT-01` through `DOC-EXT-06`

### [TH-08] v0.0.1 — Initial Monorepo (2026-02-22)
- **ID**: `TH-08`
- **Tags**: #architecture #scaffolding #changelog
- **Description**: Initial monorepo skeleton, architecture documentation, legal guardrail definitions, platform-specific build instructions.
- **Files**: `DOC-GOV-03`

### [TH-09] v0.1.0 — Security Hardening & OpenAPI (2026-02-23)
- **ID**: `TH-09`
- **Tags**: #security #api #migration
- **Description**: Security hardening (Helmet, JWT enforcement), OpenAPI/Swagger documentation, database migration runner, structured Pino logging, README rewrite (~430 tests).
- **Files**: `DOC-GOV-03`, `DOC-GH-04`

### [TH-10] v0.2.0 — Fury Worker & Ethics Service (2026-02-25)
- **ID**: `TH-10`
- **Tags**: #fury #ethics #compliance
- **Description**: GEMINI.md overhaul, deprecated BIOLOGICAL oath stream, GoalEthicsService extraction, FuryRouterWorker, BannedUserGuard, LedgerService read-path, Terraform remote state.
- **Files**: `DOC-GOV-02`, `DOC-GOV-03`

### [TH-11] v0.3.0 — The Panopticon (2026-02-25)
- **ID**: `TH-11`
- **Tags**: #proofs #fury #honeypot #storage
- **Description**: ProofsModule (3-endpoint upload pipeline), HoneypotService (cron injection), Fury Workbench with R2 signed URLs, ProofCaptureScreen mobile camera, R2 Terraform lifecycle rules.
- **Files**: `DOC-GOV-03`

### [TH-12] v0.4.0 — The Arena (2026-02-25)
- **ID**: `TH-12`
- **Tags**: #disputes #feed #b2b #compliance-mod
- **Description**: Dispute Resolution Pipeline, pHash deduplication, Public Activity Feed + Tavern Board, Gatekeeper Scan script, Enterprise CRM Connectors (Salesforce/HubSpot), Payment Routing scaffold, Consumption Billing, Linguistic Middleware for mobile.
- **Files**: `DOC-GOV-03`

### [TH-13] The Sprint to Alpha (March 6 Launch)
- **ID**: `TH-13`
- **Tags**: #launch #alpha #ingestion #sync
- **Description**: 100% ingestion and digestion of 14 new strategic documents from the co-founder Google Drive. Established the March 6, 2026 launch deadline. Integrated Pod-based cohort structures (max 5) and the $39 pricing model ($9 fee + $30 stake). Refined the "Blockchain of Truth" hardware oracle requirements (HealthKit `HKMetadataKeyWasUserEntered`, Whoop `SCORED` webhooks).
- **Files**: `DOC-BRN-02` through `DOC-BRN-05`, `DOC-LEG-05`, `DOC-LEG-06`, `DOC-PLAN-01`, `DOC-PLAN-02`, `DOC-ARC-05`, `DOC-RES-19` through `DOC-RES-21`, `DOC-EXT-07`, `DOC-EXT-08`

---

## Part II: File Inventory by Domain

### 1. Research — Foundational (Original Analysis)

| ID | File | Tags | Annotation |
|----|------|------|------------|
| `DOC-RES-01` | `docs/research/research--behavioral-economics.md` | #research #psychology #loss-aversion | The foundational psychological spec. Synthesizes loss aversion (λ=1.955), Endowed Progress Effect, and dynamic downscaling rules from Kahneman, Tversky, Nunes & Dreze. Establishes the core behavioral economics framework for all financial stake mechanics. |
| `DOC-RES-02` | `docs/research/research--psychology-behavior.md` | #research #psychology #behavior | Pillar 1 deep-dive: user psychology and behavior. Covers loss aversion mechanisms, endowed progress, social proof, and motivation dynamics specific to financial commitment applications. Perplexity-generated research synthesis. |
| `DOC-RES-03` | `docs/research/research--habit-application.md` | #research #psychology #habits | Practical application of loss aversion and endowed progress in habit-building apps. Covers framing user deposits as earned endowments, progress bars, and micro-milestone design. Includes citation evidence from pedometer-based gamified studies. |
| `DOC-RES-04` | `docs/research/research--competitor-teardown.md` | #research #market #differentiation | Strategic teardown of the gamified habit-tracking and financial-stakes ecosystem. Analyzes the two paradigms (virtual progression vs. punitive financial models) and identifies structural weaknesses across all incumbents. |
| `DOC-RES-05` | `docs/research/research--behavioral-physics-manifesto.md` | #research #philosophy #cybernetics | The "HVCS" document. Maps the seven deadly sins as interacting drive nodes in a cybernetic control loop. Derived from LaVeyan philosophy; establishes the "Fury" concept as systemic negative feedback gain. |
| `DOC-RES-06` | `docs/research/research--behavioral-engineering-masters.md` | #research #habits #creativity | Master synthesis of Pressfield (The War of Art / Resistance), Clear (Atomic Habits / Identity), Brewer (The Craving Mind / RAIN), and Fogg (Tiny Habits / MAP). Codifies the Creative Stream and "Finish Line Stake Spike." |
| `DOC-RES-07` | `docs/research/research--market-analysis.md` | #research #market #b2b | The Gamification and Habit Tracking App Market: 2025-2035 Strategic Outlook. Validates the $50B market size (Grand View Research) and identifies the B2B Corporate Wellness pivot as the high-valuation path. |
| `DOC-RES-08` | `docs/research/research--differentiation-competitor.md` | #research #market #differentiation | Pillar 2: Market Differentiation & Competitor Analysis. Perplexity-generated teardown of existing players in the habit-tracking space, identifying weaknesses in self-reporting, retention, and verification. |
| `DOC-RES-09` | `docs/research/research--breakup-psychology-loss-aversion.md` | #research #psychology #recovery | Psychological pain-point mapping: the 90-day breakup recovery timeline. Analyzes attachment-driven relapse, neurobiological withdrawal parallels, and loss aversion intervention windows for No-Contact contracts. |
| `DOC-RES-10` | `docs/research/research--app-verification-tech-privacy-law.md` | #research #architecture #compliance | Cryptographic verification and the Randomized Verification Lottery (RVL) concept. Analyzes the jurisprudential viability of randomized screen recording for behavioral compliance under US wiretap law and 2026 app store policies. |
| `DOC-RES-11` | `docs/research/research--b2b-expansion-heartbreak-niche.md` | #research #b2b #strategy | Strategic GTM plan: transitioning from the heartbreak recovery niche (18K beta users) to enterprise B2B2C. Covers relationship coach/therapist SaaS licensing and behavioral data monetization. |
| `DOC-RES-12` | `docs/research/research--behavior-change-app-design.md` | #research #architecture #psychology | The architecture of behavioral change in digital therapeutics. Bridges cognitive neuroscience and relational database schema for tracking habit formation, cognitive load, and gamified reward systems. |
| `DOC-RES-13` | `docs/research/research--bounty-shame-protocol-safety-legality.md` | #research #compliance #safety | Multidisciplinary analysis of the "Bounty/Shame" protocol. Examines app store safety guidelines (Apple/Google UGC rules), punitive accountability mechanics, and decentralized legal frameworks for peer review. |
| `DOC-RES-14` | `docs/research/research--digital-exhaust-no-contact-contracts.md` | #research #architecture #recovery | Quantifying "No Contact" via digital exhaust. Explores telemetry-driven behavioral enforcement using secondary indicators (screen time, app usage) when direct communication log access is sandboxed by mobile OS privacy. |
| `DOC-RES-15` | `docs/research/research--gamified-behavior-change-app-design.md` | #research #brainstorm #architecture | Feature specifications for the "Blockchain of Truth" app. Transcript-derived feature ingestion broken into specifications with deep research prompts. Covers PvE/PvP pathways, verification, and gamification layers. |
| `DOC-RES-16` | `docs/research/research--prediction-markets-regulation-finance.md` | #research #legal #regulation | Spectator prediction markets in 2026. Analyzes the convergence of federal derivatives regulation (CFTC), state gaming law, and decentralized tokenomics. Covers $60B+ trading volume and the Kalshi precedent. |
| `DOC-RES-17` | `docs/research/research--smart-contracts-behavioral-wagers.md` | #research #architecture #legal | Architecture and legal classification of milestone-based commitment contracts. Covers DeFi escrow patterns, cryptographic proof of behavioral milestones, and the skill-based contest legal distinction. |
| `DOC-RES-18` | `docs/research/research--commitment-device-market-analysis.md` | #research #market #retention | Market gap analysis: the digital detox angle. Exposes the structural failure of behavioral health apps — $7.48B market with 3.9% 15-day retention. Positions Styx's verification layer as the missing piece. |
| `DOC-RES-19` | `docs/research/research--competitor-teardown-v2.md` | #research #market #differentiation | Enhanced strategic teardown (v2). Deep dive into virtual vs. financial paradigms with comprehensive citations. |
| `DOC-RES-20` | `docs/research/research--market-analysis-v2.md` | #research #market #b2b | Strategic Outlook (v2). Refined market size data and B2B wellness pivot logic. |
| `DOC-RES-21` | `docs/research/research--smart-contracts-behavioral-wagers-v2.md` | #research #architecture #legal | Milestone-based commitment contracts (v2). Detailed cryptographic proof logic for behavioral milestones. |

### 2. Research — Reference Library

| ID | File | Tags | Annotation |
|----|------|------|------------|
| `DOC-EXT-01` | `docs/research/reference-library/research--ref--pressfield--the-war-of-art.txt` | #research #reference #creativity | Full text of Steven Pressfield's "The War of Art." Source material for the Resistance concept and Creative Stream codification. Plain text format. |
| `DOC-EXT-02` | `docs/research/reference-library/research--ref--pressfield--the-war-of-art.epub` | #research #reference #creativity | EPUB edition of "The War of Art" by Steven Pressfield. Alternate format of `DOC-EXT-01` for annotated reading. Binary file. |
| `DOC-EXT-03` | `docs/research/reference-library/research--ref--clear--atomic-habits.txt` | #research #reference #habits | DjVu-extracted text of James Clear's "Atomic Habits." Source material for Identity-Based habit formation and the 1% improvement compound model. |
| `DOC-EXT-04` | `docs/research/reference-library/research--ref--wood--good-habits-bad-habits.epub` | #research #reference #habits | EPUB of Wendy Wood's "Good Habits, Bad Habits." Research source on automaticity, context cues, and the science of habit persistence. Binary file. |
| `DOC-EXT-05` | `docs/research/reference-library/research--ref--brewer--the-craving-mind.pdf` | #research #reference #mindfulness | PDF of Judson Brewer's "The Craving Mind." Source material for the RAIN method (Recognize, Allow, Investigate, Note) and mindfulness-based behavioral change. Binary file. |
| `DOC-EXT-06` | `docs/research/reference-library/research--ref--fogg--tiny-habits.azw3` | #research #reference #habits | AZW3 (Kindle) of BJ Fogg's "Tiny Habits." Source material for the MAP model (Motivation, Ability, Prompt) and micro-habit design. Binary file. |
| `DOC-EXT-07` | `docs/research/reference-library/research--ref--clear--atomic-habits-v2.md` | #research #reference #habits | Enhanced Markdown version of Atomic Habits insights. |
| `DOC-EXT-08` | `docs/research/reference-library/research--ref--pressfield--the-war-of-art-v2.md` | #research #reference #creativity | Enhanced Markdown version of The War of Art insights. |

### 3. Legal & Compliance

| ID | File | Tags | Annotation |
|----|------|------|------------|
| `DOC-LEG-01` | `docs/legal/legal--performance-wagering.md` | #legal #compliance #gambling | Exhaustive legal analysis of personal performance wagering and skill-based deposit contracts in the United States. Establishes the "Dominant Factor Test" defense, FBO account requirements, CFTC boundary analysis, and state-by-state regulatory landscape. |
| `DOC-LEG-02` | `docs/legal/legal--compliance-guardrails.md` | #legal #compliance #research | Research memo (external synthesis). Aggregates external analysis and references for legal/compliance exploration. Covers the Aegis Protocol guardrails, stake limits, geofencing requirements, and FTC consumer protection considerations. Labeled as research, not operational policy. |
| `DOC-LEG-03` | `docs/legal/legal--gatekeeper-compliance.md` | #legal #compliance #platforms | Forensic report on platform survival. Defines the "Linguistic Cloaking" strategy to bypass App Store Guideline 5.3 rejections and payment processor restricted business list bans. Covers Apple, Google Play, Stripe, and high-risk merchant underwriting. |
| `DOC-LEG-04` | `docs/legal/legal--aegis-protocol.md` | #legal #compliance #governance | Styx Legal Compliance Guardrails (The Aegis Protocol) — operational policy document. Defines skill-based contest classification, BMI floors (18.5), velocity caps (2%/week), age gates, and geofencing jurisdiction tiers. The authoritative compliance reference. |
| `DOC-LEG-05` | `docs/legal/legal--founder-agreement-draft.md` | #legal #governance | 50/50 Founder Equity Split agreement between Jessica (Marketing) and Partner (Technical). |
| `DOC-LEG-06` | `docs/legal/legal--consultation-personal-goals.md` | #legal #consultation | Legal advice on the "Betting on Personal Goals" model and regulatory boundaries. |

### 4. Architecture & Design

| ID | File | Tags | Annotation |
|----|------|------|------------|
| `DOC-ARC-01` | `docs/architecture/architecture--truth-blockchain.md` | #architecture #research #oracles | Technical feasibility and architecture report for the "Blockchain of Truth." Exhaustive blueprint covering HealthKit/Google Fit hardware oracle integration, financial escrow validation, pHash video pipeline, double-anonymized peer review routing, and the recommended technology stack. |
| `DOC-ARC-02` | `docs/architecture/architecture--feasibility-stack.md` | #architecture #research #techstack | Pillar 5: Technical Feasibility & Architecture. Perplexity-generated Lead Software Architect analysis. Covers wearable API integration (read-only enforcement, manual entry filtering), financial API design (Plaid), video validation costs, and the cost-effective stack recommendation ($2K/year burn). |
| `DOC-ARC-03` | `docs/architecture/architecture--technical-feasibility.md` | #architecture #summary | Condensed technical feasibility summary. Core systems (PostgreSQL double-entry ledger, Cloudflare R2 zero-egress media, BullMQ proof routing), biometric integration strategy (HealthKit `HKMetadataKeyWasUserEntered`, Health Connect `recordingMethod`), and scalability notes. |
| `DOC-ARC-04` | `docs/architecture/architecture--alpha-to-omega-plan.md` | #architecture #roadmap #validation | "There and Back Again" — the Alpha-to-Omega implementation plan (v3.0). Five-phase timeline (Iron Core → Shield → Panopticon → Arena → Empire) with micro-tasks, plus Technical Validation Gates (Phantom Money Test, Simulator Spoof, Twin Upload, Gatekeeper Test). Tracks completion status with checkmarks. |
| `DOC-ARC-05` | `docs/architecture/architecture--truth-blockchain-v2.md` | #architecture #oracles #research | Blockchain of Truth v2. Detailed hardware oracle integration (HealthKit, Whoop, Fitbit) and Cloudflare R2 video pipeline. |
| `DOC-ADR-01` | `docs/adr/adr--001-dual-layer-services-modules.md` | #architecture #adr #api | ADR-001: Accepted decision to use dual-layer architecture — `services/` (pure domain logic) and `src/modules/` (NestJS HTTP/DI wiring). Establishes unidirectional dependency (modules → services, never reverse) and testing strategy. |

### 5. Roadmap & Planning

| ID | File | Tags | Annotation |
|----|------|------|------------|
| `DOC-ROAD-01` | `docs/planning/planning--roadmap.md` | #roadmap #architecture #planning | Alpha-to-Omega Roadmap (v3.1). Includes March 6, 2026 launch deadline and Pod-based cohort structure. |
| `DOC-ROAD-02` | `docs/planning/planning--roadmap--ai-workstreams.md` | #roadmap #architecture #planning | Parallel AI-Engineer Workstreams. Phase-by-phase execution plan for autonomous parallel AI engineers. |
| `DOC-PLAN-01` | `docs/planning/planning--meeting-notes--2026-02.md` | #planning #brainstorm | Consolidated February 2026 meeting notes covering Pod structures and MVP launch strategy. |
| `DOC-PLAN-02` | `docs/planning/planning--roadmap--mvp-drive.md` | #planning #roadmap | Drive-sourced MVP roadmap table. |

### 6. Implementation & Ship Status

| ID | File | Tags | Annotation |
|----|------|------|------------|
| `DOC-IMPL-01` | `docs/planning/planning--implementation-status.md` | #compliance #governance #validation | Claim-to-Control Matrix. Maps high-level product/security/compliance claims to runtime implementation status (Implemented / Partial / Planned / Research). Covers rate limiting, JWT enforcement, geofencing, KYC, and web auth migration. |
| `DOC-IMPL-02` | `docs/planning/planning--phase1-private-beta-scope.md` | #roadmap #beta #governance | Phase 1 Private Beta scope lock. Defines iOS-first TestFlight external beta targeting No-Contact recovery contracts. Specifies test-money mode, US allowlist, web as admin companion, desktop as internal judge tool, B2B as internal demo only. |
| `DOC-IMPL-03` | `docs/planning/planning--ship-baseline-report.md` | #validation #beta #governance | Ship Baseline Report for Phase 1 Private Beta. Documents lint/test/build pass status, identifies non-blocking reliability smells (open-handle warning, large-chunk pitch build), and seeds the red-list for ship-readiness work. Generated 2026-02-26. |

### 7. Brainstorm

| ID | File | Tags | Annotation |
|----|------|------|------------|
| `DOC-BRN-01` | `docs/brainstorm/brainstorm--motivation-validation.md` | #brainstorm #research #ingestion | Raw transcript of the original co-founder brainstorming session. The project's origin document. |
| `DOC-BRN-02` | `docs/brainstorm/brainstorm--transcript--2026-02-20.md` | #brainstorm #pods | Brainstorm on Pod structures and reputation levers. |
| `DOC-BRN-03` | `docs/brainstorm/brainstorm--transcript--2026-02-25.md` | #brainstorm #pricing | Brainstorm on pricing models and failure definitions. |
| `DOC-BRN-04` | `docs/brainstorm/brainstorm--transcript--2026-02-27.md` | #brainstorm #launch | Brainstorm on March 6 launch strategy and cohort testing. |
| `DOC-BRN-05` | `docs/brainstorm/brainstorm--chatgpt--2026-03-03.md` | #brainstorm #ai | ChatGPT consultation on branding ("Styxit") and naming linguistics. |

### 8. Pitch & Assets

| ID | File | Tags | Annotation |
|----|------|------|------------|
| `DOC-PIT-01` | `docs/pitch/pitch--styx-deck.pptx` | #pitch #branding #asset | PowerPoint pitch deck for investor presentation. Binary file (PPTX). Companion to the interactive `src/pitch` web application. |
| `DOC-PIT-02` | `docs/index.html` | #pitch #web #asset | GitHub Pages entry point. Serves the built pitch deck (`src/pitch` Vite build output) as a static site from the `docs/` directory. |
| `DOC-PIT-03` | `docs/assets/index-BKNXWelK.js` | #pitch #asset #binary | Vite-built JavaScript bundle for the pitch deck static site. Generated output — do not edit. |
| `DOC-PIT-04` | `docs/assets/index-C1O4pFhU.js` | #pitch #asset #binary | Vite-built JavaScript bundle (secondary chunk) for the pitch deck static site. Generated output. |
| `DOC-PIT-05` | `docs/assets/index-DJFROXte.css` | #pitch #asset #style | Vite-built CSS bundle for the pitch deck static site. Generated output. |
| `DOC-PIT-06` | `docs/assets/index-DmHllcqr.js` | #pitch #asset #binary | Vite-built JavaScript bundle (tertiary chunk) for the pitch deck static site. Generated output. |

### 9. Root Governance Documents

| ID | File | Tags | Annotation |
|----|------|------|------------|
| `DOC-GOV-01` | `CLAUDE.md` | #governance #ai #reference | Primary instructional context for Claude Code AI agents. Comprehensive project guide covering architecture, build commands, testing patterns, workspace structure, API dual-layer design, core algorithms, web routes, mobile screens, desktop panels, infrastructure, conventions, and known limitations. |
| `DOC-GOV-02` | `GEMINI.md` | #governance #ai #reference | Primary instructional context for Gemini AI agents. Synthesizes project purpose, architecture, conventions, and tech stack into one command center. Covers the same ground as CLAUDE.md with Gemini-specific formatting. |
| `DOC-GOV-03` | `CHANGELOG.md` | #governance #changelog #reference | Full version history from v0.0.1 (2026-02-22) through v0.4.0 (2026-02-25). Documents 5 release cycles: initial skeleton, security hardening, Fury worker/ethics, Panopticon (proofs/honeypot), and Arena (disputes/feed/B2B). |
| `DOC-GOV-04` | `README.md` | #governance #readme #reference | Project README. Describes the peer-audited behavioral market concept, monorepo structure, tech stack, test count (~467), quick start instructions, and CI/CD pipeline overview. |
| `DOC-GOV-05` | `LICENSE` | #governance #license | Project license file. |

### 10. GitHub Community Health

| ID | File | Tags | Annotation |
|----|------|------|------------|
| `DOC-GH-01` | `.github/CONTRIBUTING.md` | #governance #github #community | Contributing guidelines. Covers engineering standards for the "Blockchain of Truth" including commit conventions, branch naming, PR process, and code review expectations. |
| `DOC-GH-02` | `.github/PULL_REQUEST_TEMPLATE.md` | #governance #github #community | PR template. Structured checklist for pull request submissions including description, testing, and review sections. |
| `DOC-GH-03` | `.github/SUPPORT.md` | #governance #github #community | Support guide. Describes channels for getting help with the Styx project. |
| `DOC-GH-04` | `.github/SECURITY.md` | #governance #security #compliance | Security policy. Covers supported versions, vulnerability disclosure process, and data retention schedule (event_log, proofs, notifications, fury_assignments, stripe_events, user PII). |

### 11. Workspace README Documents

| ID | File | Tags | Annotation |
|----|------|------|------------|
| `DOC-WS-01` | `scripts/README.md` | #readme #scripts #governance | "Styx Automation Scripts (Ironclad)" — module definition and usage guide for the `scripts/` directory covering validation gates, smoke tests, and infrastructure automation. |
| `DOC-WS-02` | `src/api/README.md` | #readme #api #governance | "Styx API Core (The Brain)" — Ironclad Directive for the API workspace. Module definition, architecture overview, and development conventions for the NestJS backend. |
| `DOC-WS-03` | `src/api/services/anomaly/README.md` | #readme #api #anomaly | "Styx Anomaly Service (The Watcher)" — Ironclad Directive for the anomaly detection domain service (pHash deduplication, EXIF validation). |
| `DOC-WS-04` | `src/api/services/b2b/README.md` | #readme #api #b2b | "Styx B2B Service (The Empire)" — Ironclad Directive for enterprise B2B domain services (billing, CRM connectors). |
| `DOC-WS-05` | `src/desktop/README.md` | #readme #desktop #governance | "Styx Desktop Admin (The Judge)" — Ironclad Directive for the Tauri desktop app workspace. Admin console panels: LedgerInspector, MacroReview, ExilePanel, B2BOrchestration, HashCollider. |
| `DOC-WS-06` | `src/mobile/README.md` | #readme #mobile #governance | "Styx Mobile Client (The Oracle)" — Ironclad Directive for the React Native mobile workspace. Covers screen navigation, native bridge stubs, sensor integration, and offline caching. |
| `DOC-WS-07` | `src/shared/README.md` | #readme #shared #governance | "Styx Shared Logic (The Kernel)" — Ironclad Directive for the shared TypeScript library. Core algorithms: integrity scoring, behavioral logic, oath taxonomy, and type definitions. |
| `DOC-WS-08` | `src/web/README.md` | #readme #web #governance | "Styx Web Client (The Portal)" — Ironclad Directive for the Next.js web workspace. App Router pages, component architecture, linguistic cloaker, and auth context. |

---

## Part III: Cross-Reference Index

### By Tag

| Tag | File IDs |
|-----|----------|
| #research | `DOC-RES-01`–`DOC-RES-21`, `DOC-E2G-01`, `DOC-E2G-02`, `DOC-EXT-01`–`DOC-EXT-08`, `DOC-BRN-01`–`DOC-BRN-05` |
| #legal / #compliance | `DOC-LEG-01`–`DOC-LEG-06`, `DOC-RES-10`, `DOC-RES-13`, `DOC-RES-16`, `DOC-RES-17`, `DOC-GH-04`, `DOC-IMPL-01` |
| #architecture | `DOC-ARC-01`–`DOC-ARC-05`, `DOC-ADR-01`, `DOC-RES-10`, `DOC-RES-12`, `DOC-RES-14`, `DOC-ROAD-01`, `DOC-ROAD-02` |
| #roadmap / #planning | `DOC-ROAD-01`, `DOC-ROAD-02`, `DOC-ARC-04`, `DOC-IMPL-02`, `DOC-PLAN-01`, `DOC-PLAN-02` |
| #governance | `DOC-GOV-01`–`DOC-GOV-05`, `DOC-GH-01`–`DOC-GH-04`, `DOC-WS-01`–`DOC-WS-08`, `DOC-IMPL-01`–`DOC-IMPL-03`, `DOC-LEG-05` |
| #psychology | `DOC-RES-01`–`DOC-RES-03`, `DOC-RES-09`, `DOC-RES-12` |
| #market / #b2b | `DOC-RES-04`, `DOC-RES-07`, `DOC-RES-08`, `DOC-RES-11`, `DOC-RES-18`–`DOC-RES-20` |
| #pitch / #branding | `DOC-PIT-01`–`DOC-PIT-06` |
| #beta / #validation | `DOC-IMPL-02`, `DOC-IMPL-03` |
| #reference (reference library) | `DOC-EXT-01`–`DOC-EXT-08` |

### Thread → File Mapping

| Thread | Primary Files |
|--------|--------------|
| TH-01 Initial Intake | `DOC-RES-01`–`DOC-RES-07`, `DOC-BRN-01` |
| TH-02 Scaffolding | `DOC-ADR-01`, `DOC-ARC-01`–`DOC-ARC-04` |
| TH-03 Stygian Shift | `DOC-RES-04`, `DOC-RES-13` |
| TH-04 HVCS | `DOC-RES-05` |
| TH-05 E2G & Roadmap | `DOC-E2G-01`, `DOC-E2G-02`, `DOC-ARC-03`, `DOC-ARC-04`, `DOC-ROAD-01`, `DOC-ROAD-02` |
| TH-06 Gatekeeper | `DOC-LEG-03`, `DOC-RES-10` |
| TH-07 Master Synthesis | `DOC-RES-06`, `DOC-EXT-01`–`DOC-EXT-06` |
| TH-08–12 Release Cycle | `DOC-GOV-03`, `DOC-GOV-04`, `DOC-GH-04` |
| TH-13 Alpha Launch Sprint | `DOC-BRN-02`–`DOC-BRN-05`, `DOC-LEG-05`, `DOC-LEG-06`, `DOC-PLAN-01`, `DOC-PLAN-02`, `DOC-ARC-05`, `DOC-RES-19`–`DOC-RES-21` |

---

## Part IV: Statistics

| Metric | Value |
|--------|-------|
| Total manifest entries | 79 (excluding this manifest) |
| Markdown files (`.md`) | 61 |
| Binary reference books (`.epub`, `.pdf`, `.azw3`) | 4 |
| Plain text sources (`.txt`) | 2 |
| Pitch assets (`.pptx`, `.html`, `.js`, `.css`) | 6 |
| Research documents | 29 (21 original + 8 reference library) |
| Legal/compliance documents | 6 |
| Architecture/ADR documents | 6 |
| Roadmap/planning documents | 4 |
| Implementation status documents | 3 |
| Governance documents (root) | 5 |
| GitHub community health files | 4 |
| Workspace README files | 8 |
| Development threads documented | 13 |

---

**Document Status**: Complete. All documentation files inventoried and annotated.
**Supersedes**: v2.0.0
