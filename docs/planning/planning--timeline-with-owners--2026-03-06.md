# Styx Business Organism — Full Lifecycle Timeline (2026-03-06)

Single view of every roadmap item from Alpha to Omega, covering the **full business organism**: engineering, legal, product, operations, growth, finance, customer success, and enterprise sales. Each department has phased activation, a deep agent seed, and three-scenario planning.

## Source Documents Synthesized
- `planning--roadmap--alpha-to-omega--definitive--2026-03-04.md`
- `planning--research-ticket-pack--2026-03-04.md` (19 tickets)
- `planning--roadmap--ai-workstreams.md` (5 workstreams)
- `planning--blocked-handoff-index--latest.md` (25 blocked issues)
- `planning--implementation-status.md` (claim-to-control matrix)
- `2026-03-05-evaluation-to-growth-final-report.md` (18+7 remediation tasks)
- `FEATURE-BACKLOG.md` (117 features)
- `planning--phase1-private-beta-scope.md`

---

## 1. Owner Legend

| Code | Owner Category | Description |
|------|---------------|-------------|
| **AI** | AI / Claude Code | Code, tests, migrations, docs, CI config, API endpoints, UI components, validation scripts |
| **H:MN** | Human: Mobile Native | Swift/Kotlin/Xcode/Android Studio — native bridges, camera modules, HealthKit/Google Fit |
| **H:LC** | Human: Legal/Compliance | Counsel review, signed legal opinions, compliance artifact approval, policy sign-off |
| **H:BD** | Human: Business Development | Vendor negotiations, partnerships, merchant account applications, API access procurement |
| **H:RO** | Human: Release Ops | App Store Connect, TestFlight provisioning, deployment credentials, DNS/domain config |
| **H:CR** | Human: Cryptography | ZK proving engines, EVM smart contracts, C2PA/TSA infrastructure, hardware attestation |
| **H:FO** | Human: Founders | Strategic decisions, vendor selection, hiring, go/no-go gate approvals |

---

## 2. Timeline Table

### Phase Alpha: Core Infrastructure (COMPLETE)

All Alpha items are done. Listed for audit trail only.

| ID | Description | Owner | Target | Deps | Status |
|----|-------------|-------|--------|------|--------|
| F-CORE-01 | Double-entry ledger engine | AI | Complete | -- | Done |
| F-CORE-02 | Truth log (hash-chained audit trail) | AI | Complete | F-CORE-01 | Done |
| F-CORE-03 | Integrity score algorithm | AI | Complete | -- | Done |
| F-CORE-04 | Stripe FBO escrow (hold/capture/cancel) | AI | Complete | -- | Done (partial — test-money; real-money in Beta) |
| F-CORE-05 | Behavioral logic engine (7 oath categories) | AI | Complete | -- | Done |
| F-CORE-06 | Billing & pricing constants | AI | Complete | -- | Done |
| F-CORE-07 | Contract lifecycle state machine | AI | Complete | -- | Done |
| F-UX-10 | Linguistic cloaker (runtime vocab swap) | AI | Complete | -- | Done |
| F-UX-11 | Styx mythology branding | AI | Complete | -- | Done |
| F-LEGAL-06 | Terminology sanitization CI gate | AI | Complete | -- | Done |
| F-LEGAL-08 | CFTC sales target prohibition | AI | Complete | -- | Done |
| F-INFRA-01 | High-risk merchant account (business process) | H:BD, H:LC | Complete | -- | Done |
| F-INFRA-02 | GitHub Actions CI/CD pipeline | AI | Complete | -- | Done |
| F-INFRA-03 | Cloudflare R2 zero-egress storage | AI | Complete | -- | Done |
| F-INFRA-04 | Terraform IaC | AI | Complete | -- | Done |
| F-INFRA-06 | Validation gate scripts (01-08) | AI | Complete | -- | Done |
| F-SOCIAL-02 | Whistleblower bounty (anonymous links) | AI | Complete | -- | Done |
| F-AEGIS-01 | Aegis protocol (BMI floor + velocity cap) | AI | Complete | -- | Done |
| F-AEGIS-03 | Age gate (18+ runtime enforcement) | AI | Complete | -- | Done |
| F-WEB-01 | HttpOnly cookie auth migration | AI | Complete | -- | Done |
| F-WEB-02 | Fury review workbench | AI | Complete | -- | Done |
| F-LEGAL-01 | Contest official rules engine | AI | Complete | -- | Done |
| F-LEGAL-02 | Responsible use warnings & disclosures | AI | Complete | -- | Done |
| F-FURY-01 | Fury router (BullMQ distribution) | AI | Complete | -- | Done |
| F-FURY-02 | Fury accuracy score & demotion | AI | Complete | -- | Done |
| F-FURY-05 | Honeypot injection system | AI | Complete | -- | Done |
| F-FURY-06 | Consensus engine | AI | Complete | -- | Done |
| F-VERIFY-01 | pHash duplicate detection | AI | Complete | -- | Done |
| F-VERIFY-06 | Daily attestation flow (No-Contact) | AI | Complete | -- | Done |
| F-DESKTOP-01 | Judge dispute resolution panel | AI | Complete | -- | Done |
| F-DESKTOP-02 | Ledger inspector | AI | Complete | -- | Done |
| F-DESKTOP-03 | Exile panel (ban management) | AI | Complete | -- | Done |
| F-SOCIAL-03 | Tavern board / leaderboard | AI | Complete | -- | Done |
| F-SOCIAL-04 | Public activity feed | AI | Complete | -- | Done |
| F-B2B-01 | Enterprise CRM connectors | AI | Complete | -- | Done |
| F-B2B-02 | Consumption billing | AI | Complete | -- | Done |
| F-B2B-03 | Anonymization layer (PII stripping) | AI | Complete | -- | Done |
| F-B2B-06 | Data lake extraction | AI | Complete | -- | Done |
| F-MOBILE-05 | Offline mode (TTL cache + mutation queue) | AI | Complete | -- | Done |
| F-MOBILE-06 | Enterprise SSO (deep links) | AI | Complete | -- | Done |

#### E2G Remediation (All Complete — 2026-03-05)

| # | Task | Owner | Status |
|---|------|-------|--------|
| E2G-01 | Gate 06 recursion parameter fix | AI | Done |
| E2G-02 | Stripe idempotency keys | AI | Done |
| E2G-03 | Linguistic cloaker word boundaries | AI | Done |
| E2G-04 | DOB validation hardening | AI | Done |
| E2G-05 | `signToken` private access modifier | AI | Done |
| E2G-06 | Ledger performance indexes | AI | Done |
| E2G-07 | Scheduled `verifyChain` + admin endpoint | AI | Done |
| E2G-08 | Event log immutability trigger | AI | Done |
| E2G-09 | JWT refresh-token flow | AI | Done |
| E2G-10 | Fury store cookie-auth compatibility | AI | Done |
| E2G-11 | Fury store SSE-with-polling fallback | AI | Done |
| E2G-12 | Account lockout (5 attempts / 15min) | AI | Done |
| E2G-13 | Aegis BMI/velocity guardrails enforcement | AI | Done |
| E2G-14 | Poll timer out of Zustand state | AI | Done |
| E2G-15 | Ledger integer-cent migration (BIGINT) | AI | Done |
| E2G-16 | Explicit JWT algorithms in verify (HS256) | AI | Done |
| E2G-17 | GDPR export/erasure lifecycle | AI | Done |
| E2G-18 | Next.js middleware auth guard | AI | Done |
| E2G-19 | Medical exemption service (F-AEGIS-07) | AI | Done |
| E2G-20 | Anti-collusion auditing (TKT-P1-008) | AI | Done |
| E2G-21 | Reviewer quality weights (F-FURY-08) | AI | Done |
| E2G-22 | Biometric verification stubs (TKT-P1-016) | AI | Done |
| E2G-23 | Health data bridge (TKT-P1-007) | AI | Done |
| E2G-24 | Video proof pipeline (TKT-P1-013) | AI | Done |
| E2G-25 | Identity redaction (TKT-P1-014) | AI | Done |

---

### Phase Beta: Market-Safe Money Enablement (March-April 2026)

**Gate**: April 30, 2026 — All P0 blockers closed, jurisdiction + payout controls enforceable.

| ID | Description | Owner | Target | Deps | Status |
|----|-------------|-------|--------|------|--------|
| **TKT-P0-001** | Real-money FBO settlement activation | AI + H:LC + H:BD | Mar-Apr 2026 | F-CORE-04, F-INFRA-01 | Not Started |
| | -- API: settlement preview/execute/status endpoints | AI | Mar 2026 | -- | Not Started |
| | -- Schema: `settlement_runs` table + ledger metadata | AI | Mar 2026 | -- | Not Started |
| | -- UI: Desktop settlement status card + Web admin timeline | AI | Mar 2026 | -- | Not Started |
| | -- Legal: signed custody model review | H:LC | Apr 2026 | -- | Not Started |
| | -- Legal: processor terms review for skill-contest | H:LC, H:BD | Apr 2026 | -- | Not Started |
| | -- Tests: idempotent retry, timeout recovery, ledger invariants | AI | Mar 2026 | -- | Not Started |
| **TKT-P0-002** | Native iOS camera proof capture (gallery disabled) | H:MN + AI | Mar-Apr 2026 | F-MOBILE-01 | Not Started |
| | -- API: capture source + nonce challenge on proof upload | AI | Mar 2026 | -- | Not Started |
| | -- Schema: `capture_source`, `capture_nonce`, `capture_verified` | AI | Mar 2026 | -- | Not Started |
| | -- Mobile: native Swift camera module (no gallery) | **H:MN** | Mar-Apr 2026 | Xcode | Not Started |
| | -- Tests: nonce replay rejection, integration tests | AI + H:MN | Apr 2026 | -- | Not Started |
| | -- Legal: App Store camera/recording disclosure checklist | H:LC | Apr 2026 | -- | Not Started |
| **TKT-P0-003** | KYC runtime enforcement + progressive stake tiers | AI + H:LC + H:BD | Mar-Apr 2026 | F-AEGIS-05 | Not Started |
| | -- API: KYC start/status endpoints, contract creation gate | AI | Mar 2026 | -- | Not Started |
| | -- Schema: `users.kyc_*` columns, `kyc_events` table | AI | Mar 2026 | -- | Not Started |
| | -- UI: web/mobile KYC onboarding step | AI | Mar 2026 | -- | Not Started |
| | -- Vendor: KYC provider selection + DPA | H:BD, H:LC | Mar-Apr 2026 | -- | Not Started |
| | -- Tests: tier gating, provider error/retry | AI | Apr 2026 | -- | Not Started |
| **TKT-P0-004** | Geofence fail-closed hardening + policy registry | AI + H:LC | Mar-Apr 2026 | F-AEGIS-02 | Not Started |
| | -- API: policy introspection endpoint, fail-closed enforcement | AI | Mar 2026 | -- | Not Started |
| | -- Schema: `compliance_decisions` table | AI | Mar 2026 | -- | Not Started |
| | -- UI: state availability matrix + restricted messaging | AI | Mar 2026 | -- | Not Started |
| | -- Legal: counsel sign-off on state matrix | H:LC | Apr 2026 | -- | Not Started |
| | -- Tests: route-by-route geofence guard regression | AI | Mar 2026 | -- | Not Started |
| **TKT-P0-011** | Forfeit disposition policy engine + refund-only kill switch | AI + H:LC | Apr 2026 | TKT-P0-001, TKT-P0-004 | Not Started |
| | -- API: disposition policy endpoints + admin mutation | AI | Apr 2026 | -- | Not Started |
| | -- Schema: `jurisdiction_disposition_modes` table | AI | Apr 2026 | -- | Not Started |
| | -- UI: compliance admin panel for per-state modes | AI | Apr 2026 | -- | Not Started |
| | -- Legal: counsel sign-off on per-state mode mapping | H:LC | Apr 2026 | -- | Not Started |
| | -- Tests: payout outcome matrix, override rollback | AI | Apr 2026 | -- | Not Started |
| **TKT-P1-009** | Self-exclusion + responsible-use runtime controls | AI + H:LC | Mar-Apr 2026 | F-AEGIS-06 | Not Started |
| | -- API: self-exclusion endpoints + runtime gate | AI | Mar 2026 | -- | Not Started |
| | -- Schema: `self_exclusions` table | AI | Mar 2026 | -- | Not Started |
| | -- UI: web/mobile compliance page | AI | Mar 2026 | -- | Not Started |
| | -- Legal: terms + responsible-use page review | H:LC | Apr 2026 | -- | Not Started |
| | -- Tests: guard tests for exclusion enforcement | AI | Mar 2026 | -- | Not Started |

#### Beta Blocked Handoffs (Human-Required)

| Issue | Description | Owner | Due | Status |
|-------|-------------|-------|-----|--------|
| [#123](https://github.com/organvm-iii-ergon/peer-audited--behavioral-blockchain/issues/123) | Native iOS/Android camera module | H:MN | 2026-04-30 | Not Started |
| [#132](https://github.com/organvm-iii-ergon/peer-audited--behavioral-blockchain/issues/132) | KYC / identity verification integration | H:LC | 2026-04-30 | Not Started |
| [#133](https://github.com/organvm-iii-ergon/peer-audited--behavioral-blockchain/issues/133) | High-risk merchant account for production settlement | H:LC, H:BD | 2026-04-30 | Not Started |
| [#134](https://github.com/organvm-iii-ergon/peer-audited--behavioral-blockchain/issues/134) | Native mobile blockers: HealthKit + secure camera | H:MN | 2026-04-30 | Not Started |
| [#136](https://github.com/organvm-iii-ergon/peer-audited--behavioral-blockchain/issues/136) | Skill-based contest whitepaper + counsel sign-off | H:LC | 2026-04-30 | Not Started |
| [#141](https://github.com/organvm-iii-ergon/peer-audited--behavioral-blockchain/issues/141) | App Store Connect + TestFlight provisioning | H:MN, H:RO | 2026-04-30 | Not Started |
| [#146](https://github.com/organvm-iii-ergon/peer-audited--behavioral-blockchain/issues/146) | App Store UGC moderation policy + submission package | H:LC, H:RO | 2026-04-30 | Not Started |

#### Beta Feature Backlog (Non-Ticket Items)

| ID | Description | Owner | Target | Status |
|----|-------------|-------|--------|--------|
| F-AEGIS-02 | Geofencing fail-closed hardening | AI | Mar 2026 | Partial (covered by TKT-P0-004) |
| F-AEGIS-04 | Recovery protocol guardrails | AI | Mar 2026 | Partial |
| F-AEGIS-06 | Self-exclusion & responsible use | AI | Mar 2026 | Not Started (covered by TKT-P1-009) |
| F-LEGAL-03 | State-by-state compliance toggles | AI + H:LC | Apr 2026 | Partial |
| F-LEGAL-04 | Refund-only mode (legal contingency) | AI + H:LC | Apr 2026 | Partial (covered by TKT-P0-011) |
| F-LEGAL-05 | Skill-based contest whitepaper | H:LC | Apr 2026 | Not Started (covered by TKT-P1-019) |
| F-UX-02 | Endowed progress ($5 onboarding bonus) | AI | Mar 2026 | Partial |
| F-UX-03 | Dynamic downscale intervention | AI | Mar 2026 | Partial |
| F-UX-06 | Bounded stake selection UI | AI | Mar 2026 | Partial |
| F-DESKTOP-04 | Hash collider tool (wiring) | AI | Mar 2026 | Partial |

---

### Phase Gamma: Proof Integrity at Scale (May-June 2026)

**Gate**: June 30, 2026 — Trust network hardening complete.

| ID | Description | Owner | Target | Deps | Status |
|----|-------------|-------|--------|------|--------|
| **TKT-P1-007** | Health data bridge + server metadata filter | H:MN + AI | May-Jun 2026 | F-VERIFY-02 | Done (API/schema via E2G-23; native bridge still needed) |
| | -- API: HealthKit samples ingest (server-side) | AI | -- | -- | Done |
| | -- Schema: `health_oracle_samples` table | AI | -- | -- | Done |
| | -- Native: iOS HealthKit Swift bridge | **H:MN** | May 2026 | Xcode | Not Started |
| | -- Native: Android Google Health Connect Kotlin bridge | **H:MN** | Jun 2026 | Android Studio | Not Started |
| **TKT-P1-013** | Video proof processing pipeline completion | AI | May 2026 | F-VERIFY-07 | Done (API/schema via E2G-24) |
| | -- API: processing-status + completion callback | AI | -- | -- | Done |
| | -- Schema: `proof_processing_jobs` table | AI | -- | -- | Done |
| | -- UI: proof capture processing states | AI | May 2026 | -- | Not Started |
| **TKT-P1-014** | Fury audit masks (identity redaction) runtime | AI | May 2026 | F-FURY-04 | Done (schema via E2G-25) |
| | -- API: masked media URL + anonymized handles | AI | -- | -- | Done |
| | -- Schema: redaction fields on proofs/assignments | AI | -- | -- | Done |
| | -- UI: Fury workbench masked display | AI | May 2026 | -- | Not Started |
| **TKT-P1-008** | Cross-lobby anti-collusion routing | AI | May 2026 | F-FURY-03 | Done (core logic via E2G-20) |
| | -- Fury assignment exclusion constraints | AI | -- | -- | Done |
| | -- Schema: assignment edges + social exclusion | AI | -- | -- | Done |
| | -- UI: admin collusion cluster screen | AI | May 2026 | -- | Not Started |
| **TKT-P1-015** | Collusion slashing + honey-trap enforcement | AI + H:LC | May-Jun 2026 | TKT-P1-008 | Not Started |
| | -- API: enforcement evaluate + appeals workflow | AI | May 2026 | -- | Not Started |
| | -- Schema: `fury_enforcement_cases`, `fury_penalties` | AI | May 2026 | -- | Not Started |
| | -- UI: admin enforcement + appeal panel | AI | Jun 2026 | -- | Not Started |
| | -- Legal: internal reviewer sanctions + appeal rights policy | H:LC | Jun 2026 | -- | Not Started |
| | -- Tests: honey-trap simulation, false-positive rollback | AI | Jun 2026 | -- | Not Started |

#### Gamma Blocked Handoffs (Human-Required)

| Issue | Description | Owner | Due | Status |
|-------|-------------|-------|-----|--------|
| [#124](https://github.com/organvm-iii-ergon/peer-audited--behavioral-blockchain/issues/124) | HealthKit native bridge (iOS) | H:MN | 2026-06-30 | Not Started |
| [#125](https://github.com/organvm-iii-ergon/peer-audited--behavioral-blockchain/issues/125) | Google Health Connect bridge (Android) | H:MN | 2026-06-30 | Not Started |
| [#126](https://github.com/organvm-iii-ergon/peer-audited--behavioral-blockchain/issues/126) | Fitbit/WHOOP API integration | H:BD | 2026-06-30 | Not Started |
| [#148](https://github.com/organvm-iii-ergon/peer-audited--behavioral-blockchain/issues/148) | Cross-jurisdictional consent matrix counsel review | H:LC | 2026-06-30 | Not Started |

#### Gamma Feature Backlog (Non-Ticket Items)

| ID | Description | Owner | Target | Status |
|----|-------------|-------|--------|--------|
| F-CORE-09 | Finish line spike (double stake) | AI | Jun 2026 | Not Started |
| F-MOBILE-01 | Native camera (Swift/Kotlin) — full module | H:MN | May-Jun 2026 | Stub |

---

### Phase Delta: Retention + Network Effects (July-September 2026)

**Gate**: September 30, 2026 — Behavioral flywheel live and measurable.

| ID | Description | Owner | Target | Deps | Status |
|----|-------------|-------|--------|------|--------|
| **TKT-P1-005** | Recovery danger-zone lockdowns + 24h timelock | AI | Jul 2026 | F-AEGIS-04, F-CORE-11 | Not Started |
| | -- API: break-request/cancel/lock-status endpoints | AI | Jul 2026 | -- | Not Started |
| | -- Schema: `recovery_break_requests` table | AI | Jul 2026 | -- | Not Started |
| | -- UI: mobile cooldown countdown + dashboard danger-zone banners | AI | Jul 2026 | -- | Not Started |
| | -- Tests: scheduler tests, Day 3/21 lock-window policy | AI | Jul 2026 | -- | Not Started |
| **TKT-P1-012** | Weekend multiplier policy engine (recovery) | AI | Jul 2026 | F-CORE-10 | Not Started |
| | -- API: attestation risk-window metadata + penalty preview | AI | Jul 2026 | -- | Not Started |
| | -- Schema: `contract_penalty_windows` table | AI | Jul 2026 | -- | Not Started |
| | -- UI: weekend risk badge + explicit penalty delta | AI | Jul 2026 | -- | Not Started |
| | -- Tests: timezone/DST boundary, penalty parity | AI | Jul 2026 | -- | Not Started |
| **TKT-P1-017** | Accountability partner protocol completion | AI | Jul-Aug 2026 | F-SOCIAL-01 | Not Started |
| | -- API: invite/respond/veto-break/status endpoints | AI | Jul 2026 | -- | Not Started |
| | -- Schema: `accountability_partner_events`, status enum hardening | AI | Jul 2026 | -- | Not Started |
| | -- UI: contract detail partner lifecycle | AI | Aug 2026 | -- | Not Started |
| | -- Legal: disclosure review for partner authority | H:LC | Aug 2026 | -- | Not Started |
| | -- Tests: invite/respond/veto E2E, permission tests | AI | Aug 2026 | -- | Not Started |
| **TKT-P1-010** | Endowed progress + downscale UX completion | AI | Aug 2026 | F-UX-02, F-UX-03 | Not Started |
| | -- API: progress-model endpoint | AI | Aug 2026 | -- | Not Started |
| | -- Schema: `contract_progress_events` table | AI | Aug 2026 | -- | Not Started |
| | -- UI: bounded stake selector + progress visualization | AI | Aug 2026 | -- | Not Started |
| | -- Tests: UI contract creation + progress integration | AI | Aug 2026 | -- | Not Started |
| **TKT-P1-016** | Identity-based oath onboarding flow | AI | Aug 2026 | F-UX-01 | Not Started |
| | -- API: identity-oath persist/resume endpoints | AI | Aug 2026 | -- | Not Started |
| | -- Schema: `user_identity_oaths` table | AI | Aug 2026 | -- | Not Started |
| | -- UI: web/mobile onboarding wizard | AI | Aug 2026 | -- | Not Started |
| | -- Tests: resume/completion, copy variant determinism | AI | Aug 2026 | -- | Not Started |
| **TKT-P1-018** | Goal-gradient dashboard + live leaderboard completion | AI | Aug-Sep 2026 | F-UX-05, F-WEB-04 | Not Started |
| | -- API: dashboard progress aggregate + leaderboard SSE | AI | Aug 2026 | -- | Not Started |
| | -- Schema: `leaderboard_events`, `dashboard_progress_snapshots` | AI | Sep 2026 | -- | Not Started |
| | -- UI: multi-layer goal-gradient + tavern SSE leaderboard | AI | Sep 2026 | -- | Not Started |
| | -- Tests: SSE reconnect/fallback, snapshot contract | AI | Sep 2026 | -- | Not Started |
| **TKT-P1-006** | Remote push pipeline (APNs/FCM) + policy matrix | H:MN + H:RO + AI | Jul-Sep 2026 | F-MOBILE-03 | Not Started |
| | -- API: push register hardening + dispatch job API | AI | Jul 2026 | -- | Not Started |
| | -- Schema: `push_tokens`, `push_deliveries` | AI | Jul 2026 | -- | Not Started |
| | -- Native: APNs certificate + FCM config | **H:MN, H:RO** | Jul-Aug 2026 | Apple/Google creds | Not Started |
| | -- UI: mobile notification settings | AI | Aug 2026 | -- | Not Started |
| | -- Tests: provider mock, invalid token demotion | AI | Sep 2026 | -- | Not Started |

#### Delta Blocked Handoffs (Human-Required)

| Issue | Description | Owner | Due | Status |
|-------|-------------|-------|-----|--------|
| [#127](https://github.com/organvm-iii-ergon/peer-audited--behavioral-blockchain/issues/127) | Remote push notifications setup (APNs/FCM) | H:MN, H:RO | 2026-09-30 | Not Started |
| [#135](https://github.com/organvm-iii-ergon/peer-audited--behavioral-blockchain/issues/135) | Video pipeline + native dashboard UI blockers | H:RO | 2026-09-30 | Not Started |

#### Delta Feature Backlog (Non-Ticket Items)

| ID | Description | Owner | Target | Status |
|----|-------------|-------|--------|--------|
| F-AEGIS-07 | Medical exemption service | AI | -- | Done (E2G-19) |
| F-AEGIS-08 | RAIN mindfulness notifications | AI | Aug 2026 | Not Started |
| F-AEGIS-09 | Ostrich effect detection | AI | Sep 2026 | Not Started |
| F-UX-05 | Daily dashboard goal-gradient visualization | AI | Aug-Sep 2026 | Partial (covered by TKT-P1-018) |
| F-WEB-04 | Real-time leaderboard (SSE) | AI | Sep 2026 | Partial (covered by TKT-P1-018) |
| F-INFRA-05 | Cloudflare WAF configuration | AI | -- | Done |

---

### Phase Omega: Enterprise Expansion (October-December 2026)

**Gate**: December 31, 2026 — Enterprise packaging and legal release controls complete.

| ID | Description | Owner | Target | Deps | Status |
|----|-------------|-------|--------|------|--------|
| **TKT-P1-019** | Skill-contest whitepaper + release gate | H:LC + AI | Oct-Nov 2026 | F-LEGAL-05 | Not Started |
| | -- API: compliance artifact metadata endpoint | AI | Oct 2026 | -- | Not Started |
| | -- Schema: `compliance_artifacts` table | AI | Oct 2026 | -- | Not Started |
| | -- UI: legal site section with artifact + jurisdiction matrix | AI | Oct 2026 | -- | Not Started |
| | -- Legal: counsel approval + dated signature per version | **H:LC** | Oct-Nov 2026 | -- | Not Started |
| | -- CI: release gate for missing/expired artifact | AI | Nov 2026 | -- | Not Started |
| | -- Tests: artifact hash mismatch rejection | AI | Nov 2026 | -- | Not Started |
| F-WEB-03 | HR dashboard (role-based access + org authz) | AI | Nov 2026 | F-B2B-01 | Partial |
| F-DESKTOP-05 | B2B orchestration panel (billing + scopes) | AI | Nov 2026 | F-B2B-01 | Partial |

#### Omega Blocked Handoffs (Human-Required)

| Issue | Description | Owner | Due | Status |
|-------|-------------|-------|-----|--------|
| [#128](https://github.com/organvm-iii-ergon/peer-audited--behavioral-blockchain/issues/128) | Biometric lock (voice/face) | H:MN | 2026-12-31 | Not Started |
| [#129](https://github.com/organvm-iii-ergon/peer-audited--behavioral-blockchain/issues/129) | Plaid Link integration | H:BD | 2026-12-31 | Not Started |
| [#130](https://github.com/organvm-iii-ergon/peer-audited--behavioral-blockchain/issues/130) | EVM smart contract escrow | H:CR | 2026-12-31 | Not Started |
| [#131](https://github.com/organvm-iii-ergon/peer-audited--behavioral-blockchain/issues/131) | ZKP milestone verification | H:CR | 2026-12-31 | Not Started |
| [#137](https://github.com/organvm-iii-ergon/peer-audited--behavioral-blockchain/issues/137) | Prize indemnity insurance procurement | H:LC | 2026-12-31 | Not Started |
| [#138](https://github.com/organvm-iii-ergon/peer-audited--behavioral-blockchain/issues/138) | Web shop payment routing + Apple neutral notice | H:LC, H:RO | 2026-12-31 | Not Started |
| [#139](https://github.com/organvm-iii-ergon/peer-audited--behavioral-blockchain/issues/139) | "Styx-Certified" hardware partnership program | H:BD | 2026-12-31 | Not Started |
| [#140](https://github.com/organvm-iii-ergon/peer-audited--behavioral-blockchain/issues/140) | Insurance cross-pollination partnership | H:BD | 2026-12-31 | Not Started |
| [#142](https://github.com/organvm-iii-ergon/peer-audited--behavioral-blockchain/issues/142) | C2PA content provenance + TSA infrastructure | H:CR | 2026-12-31 | Not Started |
| [#143](https://github.com/organvm-iii-ergon/peer-audited--behavioral-blockchain/issues/143) | Continuous mobile app attestation SDK procurement | H:MN | 2026-12-31 | Not Started |
| [#144](https://github.com/organvm-iii-ergon/peer-audited--behavioral-blockchain/issues/144) | ZK privacy layer for digital exhaust | H:CR | 2026-12-31 | Not Started |
| [#147](https://github.com/organvm-iii-ergon/peer-audited--behavioral-blockchain/issues/147) | Stablecoin stakes regulatory + banking pathway | H:LC, H:BD | 2026-12-31 | Not Started |

#### Omega Feature Backlog (Phase 2+ Deferred)

These are documented but explicitly deferred beyond 2026. Not on the critical path.

| ID | Description | Owner | Priority |
|----|-------------|-------|----------|
| F-CORE-08 | Seasonal goal cycles | AI | P2 |
| F-CORE-12 | Shared-pot / PvP challenges | AI + H:LC | P2 |
| F-CORE-13 | Charity-on-failure / anti-charity model | AI | P2 |
| F-CORE-14 | Maintenance pools (post-challenge retention) | AI | P2 |
| F-CORE-15 | Dynamic gamification decay algorithm | AI | P3 |
| F-VERIFY-04 | Fitbit/WHOOP API integration | H:BD | P2 |
| F-VERIFY-08 | Hardware-backed cryptographic attestation | H:MN | P3 |
| F-VERIFY-09 | C2PA content provenance | H:CR | P3 |
| F-VERIFY-10 | Active cryptographic illumination (anti-spoof) | H:MN | P3 |
| F-VERIFY-11 | Continuous mobile app attestation | H:MN | P3 |
| F-VERIFY-12 | Digital exhaust inference (Bayesian) | AI + H:MN | P3 |
| F-VERIFY-13 | Randomized verification lottery | AI | P2 |
| F-VERIFY-14 | ZK-privacy layer for digital exhaust | H:CR | P3 |
| F-FURY-07 | Master Fury career path / economy | AI | P2 |
| F-FURY-09 | Collusion slashing & honey-traps (advanced) | AI | P1 |
| F-SOCIAL-05 | PvP lobbies & group challenges | AI + H:LC | P2 |
| F-SOCIAL-06 | Community governance (user voting) | AI | P3 |
| F-MOBILE-02 | Wearable data aggregation | H:MN | P2 |
| F-MOBILE-04 | Biometric lock (voice/face) | H:MN | P3 |
| F-WEB-05 | Plaid Link integration | H:BD | P2 |
| F-DESKTOP-06 | Medical exemption review UI | AI | P2 |
| F-B2B-04 | Corporate integrity score | AI | P2 |
| F-B2B-05 | Therapist B2B2C dashboard | AI | P2 |
| F-B2B-07 | Team-based B2B challenges | AI + H:LC | P2 |
| F-B2B-08 | Behavioral data monetization pipeline | AI + H:LC | P3 |
| F-B2B-09 | Insurance cross-pollination | H:BD | P3 |
| F-MARKET-01 | Spectator prediction markets | AI + H:LC | P3 |
| F-MARKET-02 | Milestone wagering tiers | AI | P2 |
| F-MARKET-03 | EVM smart contract escrow | H:CR | P3 |
| F-MARKET-04 | ZKP milestone verification | H:CR | P3 |
| F-MARKET-05 | Actuarially fair odds engine | AI | P3 |
| F-MARKET-06 | Feedback-as-a-Service (FaaS) | AI | P3 |
| F-UX-04 | Habit stacking syntax ("Styx Stack") | AI | P2 |
| F-UX-07 | Weekly vault lock-in milestone | AI | P2 |
| F-UX-08 | Geofence cue triggers | H:MN | P3 |
| F-UX-09 | Behavior change library | AI | P2 |
| F-UX-12 | The Mirror Mirror (sentiment visualization) | AI | P2 |
| F-AEGIS-05 | KYC / identity verification (full) | H:BD + H:LC | P2 |
| F-AEGIS-10 | AML / transaction monitoring | AI + H:LC | P2 |
| F-AEGIS-11 | Sobriety/addiction track expansion | AI | P2 |
| F-INFRA-07 | Video encoding pipeline (Cloudflare Stream/Mux) | AI | P2 |
| F-INFRA-08 | Auto-redaction at edge (Cloudflare Workers) | AI | P2 |
| F-INFRA-09 | Web shop payment routing | H:LC, H:RO | P2 |
| F-INFRA-10 | "Styx-Certified" hardware partnerships | H:BD | P3 |
| F-LEGAL-07 | Prize indemnity insurance | H:LC | P3 |

---

## 3. Summary Statistics

### Tasks by Phase and Owner (Engineering)

| Phase | AI-Automatable | Human-Required | Total Active | Done |
|-------|---------------|----------------|--------------|------|
| Alpha | 38 | 2 | 0 | 40 (all complete) |
| E2G Remediation | 25 | 0 | 0 | 25 (all complete) |
| Beta (Mar-Apr) | ~24 sub-tasks | ~12 sub-tasks | 6 tickets + 7 blocked + 10 backlog | 0 |
| Gamma (May-Jun) | ~8 sub-tasks | ~5 sub-tasks | 5 tickets + 4 blocked + 2 backlog | 3 tickets partially done (API/schema) |
| Delta (Jul-Sep) | ~22 sub-tasks | ~4 sub-tasks | 7 tickets + 2 blocked + 5 backlog | 1 item done (F-AEGIS-07) |
| Omega (Oct-Dec) | ~5 sub-tasks | ~2 sub-tasks | 1 ticket + 2 backlog + 12 blocked | 0 |
| Phase 2+ (Deferred) | ~30 | ~15 | 45 features | 0 |

### Department Activation Summary (Business Organism)

| Dept | Code | Activates | Phase Tasks | Agent Seeded | Deep Agent |
|------|------|-----------|-------------|--------------|------------|
| Engineering | ENG | Alpha | Per Sections 2-4 | Yes (existing) | `styx-eng` |
| Legal & Compliance | LEG | Alpha | 11 tasks | Pending | `styx-legal` |
| Product & Design | PRD | Beta | 6 tasks | Pending | `styx-product` |
| Operations & Infrastructure | OPS | Beta | 9 tasks | Pending | `styx-ops` |
| Growth & Marketing | GRO | Delta | 7 tasks | Pending | `styx-growth` |
| Finance & Revenue | FIN | Beta | 6 tasks | Pending | `styx-finance` |
| Customer Success | CXS | Delta | 5 tasks | Pending | `styx-support` |
| Enterprise Sales (B2B) | B2B | Omega | 6 tasks | Pending | `styx-enterprise` |

### Operational Milestones (Cross-Departmental)

| Milestone | Target | Status |
|-----------|--------|--------|
| TestFlight internal dogfood | Apr 2026 | Not Started |
| TestFlight external beta (50-100 users) | May 2026 | Not Started |
| Real-money pilot (10-25 users) | Jul 2026 | Not Started |
| Open beta expansion (500+ users) | Aug 2026 | Not Started |
| App Store submission | Sep 2026 | Not Started |
| App Store launch (public) | Oct 2026 | Not Started |
| First enterprise pilot | Nov 2026 | Not Started |
| Enterprise pricing live | Dec 2026 | Not Started |

### Human-Required Work by Role

| Owner Role | Beta | Gamma | Delta | Omega | Total Active |
|-----------|------|-------|-------|-------|-------------|
| H:MN (Mobile Native) | 3 | 3 | 1 | 2 | 9 |
| H:LC (Legal/Compliance) | 5 | 2 | 1 | 3 | 11 |
| H:BD (Business Dev) | 2 | 1 | 0 | 3 | 6 |
| H:RO (Release Ops) | 2 | 0 | 1 | 1 | 4 |
| H:CR (Cryptography) | 0 | 0 | 0 | 4 | 4 |
| H:FO (Founders) | Gate approval | Gate approval | Gate approval | Gate approval | 4 gates |

### Critical Path (Phase Gate Blockers)

These items **must** complete before their phase gate can close:

**Beta Gate (2026-04-30)**:
1. TKT-P0-001: Real-money settlement — blocked on H:LC (custody model) + H:BD (merchant account)
2. TKT-P0-002: Native camera — blocked on **H:MN** (Swift/Kotlin)
3. TKT-P0-003: KYC enforcement — blocked on H:BD (vendor) + H:LC (DPA)
4. TKT-P0-004: Geofence fail-closed — blocked on H:LC (state matrix sign-off)
5. Issue #133: High-risk merchant account — blocked on **H:BD + H:LC**
6. Issue #136: Skill-contest whitepaper — blocked on **H:LC**
7. Issue #141: TestFlight provisioning — blocked on **H:MN + H:RO**

**Gamma Gate (2026-06-30)**:
1. TKT-P1-007 native bridges — blocked on **H:MN** (HealthKit Swift, Google Health Connect Kotlin)
2. TKT-P1-015 collusion enforcement — blocked on H:LC (sanctions policy)
3. Issue #124/125: Native health bridges — blocked on **H:MN**

**Delta Gate (2026-09-30)**:
1. TKT-P1-006 push pipeline — blocked on **H:MN + H:RO** (APNs/FCM credentials)
2. All Delta AI work is unblocked

**Omega Gate (2026-12-31)**:
1. TKT-P1-019 whitepaper release gate — blocked on **H:LC** (counsel approval)
2. 12 blocked handoff items span H:CR, H:BD, H:LC, H:MN, H:RO

---

## 4. Founder Action Items (Immediate)

The following human tasks are on the **critical path for Beta (April 30)**. These need to start now:

1. **Engage legal counsel** — custody model review, state matrix sign-off, skill-contest whitepaper, App Store UGC policy (Issues #132, #133, #136, #146)
2. **Select KYC vendor** — evaluate Stripe Identity / Jumio / Persona, negotiate DPA (TKT-P0-003)
3. **Hire or contract mobile native engineer** — Swift camera module is the single hardest Beta blocker (Issues #123, #134, #141)
4. **Apple Developer account + TestFlight setup** — cannot ship iOS beta without this (Issue #141)
5. **High-risk merchant processor application** — Corepay/Allied Wallet for production settlement (Issue #133)

---

## 5. Department Phased Activation + Agent Seeding

Each department has two tracks: **(A)** the human work, and **(B)** a deep agent seeded to accumulate domain knowledge over time. Departments activate in the same phase sequence as the product — you don't need a sales team before you have a product to sell.

### 5.1 Engineering (ENG) — Active since Alpha

- **Human**: Already operational (founders + AI conductor model)
- **Agent seed**: The existing codebase + CLAUDE.md + 37 research docs are the agent's knowledge base
- **Agent**: `styx-eng` (existing project context — no separate seed needed)
- **Phase tasks**: Per existing Sections 2-4 (the build timeline)

---

### 5.2 Legal & Compliance (LEG) — Active since Alpha

**Agent seed corpus**: `docs/legal/*` (6 docs), `docs/research/*compliance*`, blocked handoff index, state jurisdiction mapping from `services/geofencing.ts`

**Agent role**: Draft compliance checklists, flag regulatory changes, prepare App Store submission language, pre-screen contracts, monitor state-level gambling/contest law changes

**Agent**: `styx-legal` — `.claude/agents/legal/CONTEXT.md`

| Phase | Task | Owner | Target |
|-------|------|-------|--------|
| Beta | Retain outside counsel (retainer) | H:FO | Mar 2026 |
| Beta | Custody model sign-off (FBO escrow structure) | H:LC | Apr 2026 |
| Beta | State jurisdiction matrix sign-off | H:LC | Apr 2026 |
| Beta | Skill-contest whitepaper draft + review | Agent + H:LC | Apr 2026 |
| Beta | App Store UGC moderation policy | Agent + H:LC | Apr 2026 |
| Gamma | Cross-jurisdictional consent matrix | Agent + H:LC | Jun 2026 |
| Gamma | Reviewer sanctions + appeal rights policy | Agent + H:LC | Jun 2026 |
| Delta | Partner authority disclosure review | H:LC | Aug 2026 |
| Omega | SOC 2 Type I audit initiation | H:LC + H:FO | Oct 2026 |
| Omega | Enterprise DPA template | Agent + H:LC | Nov 2026 |
| Omega | Prize indemnity insurance evaluation | H:LC + H:BD | Dec 2026 |

---

### 5.3 Product & Design (PRD) — Activates Beta

**Agent seed corpus**: `docs/research/*behavioral*`, `docs/research/*psychology*`, competitor teardowns (`docs/research/research--competitor-*.md`), `FEATURE-BACKLOG.md`

**Agent role**: Synthesize user research, generate UX copy variants, prioritize feature backlog from usage data, draft A/B test hypotheses

**Agent**: `styx-product` — `.claude/agents/product/CONTEXT.md`

| Phase | Task | Owner | Target |
|-------|------|-------|--------|
| Beta | Define beta success metrics (completion rate, NPS, 7-day retention) | Agent + H:FO | Mar 2026 |
| Beta | No-Contact recovery UX audit (5 critical task flows) | Agent | Apr 2026 |
| Gamma | User interview protocol (10 beta testers) | Agent + H:FO | May 2026 |
| Delta | A/B test plan: onboarding identity oath variants | Agent | Jul 2026 |
| Delta | Feature prioritization from usage analytics | Agent + H:FO | Aug 2026 |
| Omega | Enterprise UX audit (HR dashboard, coach dashboard) | Agent | Oct 2026 |

---

### 5.4 Operations & Infrastructure (OPS) — Activates Beta

**Agent seed corpus**: `render.yaml`, `docker-compose.yml`, `scripts/smoke/*`, `.github/workflows/*`, `infra/terraform/*`

**Agent role**: Monitor deployment health, draft runbooks, flag cost anomalies, automate scaling decisions

**Agent**: `styx-ops` — `.claude/agents/ops/CONTEXT.md`

| Phase | Task | Owner | Target |
|-------|------|-------|--------|
| Beta | Uptime monitoring setup (UptimeRobot or Better Uptime) | AI + H:RO | Mar 2026 |
| Beta | Render starter to production plan upgrade path | H:RO + H:FO | Apr 2026 |
| Beta | Database backup policy + tested restore | AI + H:RO | Apr 2026 |
| Beta | Incident response runbook v1 | Agent + H:FO | Apr 2026 |
| Gamma | Load testing (target: 500 concurrent users) | AI | May 2026 |
| Delta | CDN/WAF production config verification | AI | Jul 2026 |
| Delta | APNs/FCM credential management | H:RO | Aug 2026 |
| Omega | Load testing (target: 5,000 concurrent users) | AI | Oct 2026 |
| Omega | Auto-scaling + cost alerting | AI + H:RO | Nov 2026 |

---

### 5.5 Growth & Marketing (GRO) — Activates Delta

**Agent seed corpus**: `research--market-analysis.md`, `research--market-analysis-v2.md`, `research--commitment-device-market-analysis.md`, competitor teardowns, demographic data

**Agent role**: Draft content (blog posts, social copy), SEO keyword research, community engagement strategy, referral program design

**Agent**: `styx-growth` — `.claude/agents/growth/CONTEXT.md`

| Phase | Task | Owner | Target |
|-------|------|-------|--------|
| Beta | Seed user recruitment plan (Reddit, breakup communities) | Agent + H:FO | Apr 2026 |
| Gamma | Landing page copy + conversion funnel | Agent + H:FO | May 2026 |
| Delta | Content calendar (4 posts/month) | Agent | Jul 2026 |
| Delta | SEO strategy (10 target keywords for No-Contact recovery) | Agent | Aug 2026 |
| Delta | Referral program design (endowed invite credits) | Agent + H:FO | Sep 2026 |
| Omega | PR strategy for App Store launch | Agent + H:FO | Oct 2026 |
| Omega | Therapist/coach partnership outreach templates | Agent + H:BD | Nov 2026 |

---

### 5.6 Finance & Revenue (FIN) — Activates Beta

**Agent seed corpus**: `research--market-analysis.md` pricing data, `services/billing.ts`, Stripe docs, `research--b2b-expansion-heartbreak-niche.md` pricing tiers

**Agent role**: Financial modeling (unit economics, CAC/LTV), reconciliation checks, pricing sensitivity analysis, runway tracking

**Agent**: `styx-finance` — `.claude/agents/finance/CONTEXT.md`

| Phase | Task | Owner | Target |
|-------|------|-------|--------|
| Beta | Unit economics model v1 ($39 contract: $9 platform fee, $30 stake) | Agent + H:FO | Mar 2026 |
| Beta | Stripe production account setup | H:FO | Apr 2026 |
| Gamma | Financial reconciliation process (ledger <> Stripe) | Agent + AI | May 2026 |
| Delta | CAC/LTV tracking dashboard | Agent | Aug 2026 |
| Omega | B2B pricing model ($49/$149/$349 tiers per research doc) | Agent + H:FO | Oct 2026 |
| Omega | Revenue reporting (MRR, churn, ARPU) | Agent | Nov 2026 |

---

### 5.7 Customer Success (CXS) — Activates Delta

**Agent seed corpus**: Beta tester feedback, support tickets, NPS data, `src/shared/libs/behavioral-logic.ts` constants, FAQ patterns

**Agent role**: Draft help docs, triage support requests, detect churn signals, generate onboarding sequences

**Agent**: `styx-support` — `.claude/agents/support/CONTEXT.md`

| Phase | Task | Owner | Target |
|-------|------|-------|--------|
| Beta | Support channel setup (email + Discord) | H:FO | Apr 2026 |
| Gamma | FAQ / Help Center v1 (10 articles) | Agent | Jun 2026 |
| Delta | Onboarding email sequence (7-day drip) | Agent | Jul 2026 |
| Delta | Churn signal detection (Ostrich Effect patterns) | Agent + AI | Sep 2026 |
| Omega | In-app help / chatbot | Agent + AI | Nov 2026 |

---

### 5.8 Enterprise Sales / B2B (B2B) — Activates Omega

**Agent seed corpus**: `research--b2b-expansion-heartbreak-niche.md`, competitor coaching software pricing (CoachAccountable, SimplePractice, TherapyNotes), ERISA/HIPAA basics

**Agent role**: Generate outreach sequences, draft proposals, prepare security questionnaires, build demo scripts

**Agent**: `styx-enterprise` — `.claude/agents/enterprise/CONTEXT.md`

| Phase | Task | Owner | Target |
|-------|------|-------|--------|
| Delta | Identify 50 target therapists/coaches (ICP definition) | Agent + H:FO | Sep 2026 |
| Omega | Outreach sequence (email + LinkedIn) | Agent + H:BD | Oct 2026 |
| Omega | Enterprise demo environment provisioned | AI | Oct 2026 |
| Omega | Security questionnaire template | Agent + H:LC | Nov 2026 |
| Omega | First pilot onboarding (1-3 practitioners) | H:BD + H:FO | Nov 2026 |
| Omega | Enterprise pricing live | H:FO + H:BD | Dec 2026 |

---

## 6. Launch Operations Timeline (Cross-Departmental)

| Month | Milestone | Depts | Owner | Details |
|-------|-----------|-------|-------|---------|
| Mar 2026 | Apple Developer Account + TestFlight setup | OPS, ENG | H:RO, H:FO | Prerequisite for any iOS distribution |
| Mar 2026 | Hire/contract mobile native engineer (Swift) | ENG | H:FO | Single biggest Beta blocker |
| Mar 2026 | Engage legal counsel (retainer) | LEG | H:FO | Custody model, state matrix, whitepaper |
| Mar 2026 | Seed deep agents for LEG, FIN, PRD, OPS | ALL | AI | Initial domain knowledge ingestion |
| Apr 2026 | Internal dogfood beta (founders + 5-10 trusted) | ENG, OPS | H:FO | Test real flows end-to-end with test money |
| Apr 2026 | Monitoring + alerting setup | OPS | AI + H:RO | Sentry (done) + uptime + PagerDuty |
| Apr 2026 | Support channel setup | CXS | H:FO | Email + Discord for tester feedback |
| May 2026 | TestFlight external beta (50-100 users) | ENG, OPS, CXS | H:RO, H:FO | First real users on test-money |
| May 2026 | Seed user recruitment begins | GRO | H:FO | Reddit, breakup communities, therapist referrals |
| Jun 2026 | Beta feedback synthesis + iteration | PRD, ENG | AI + H:FO | Prioritize from real user data |
| Jul 2026 | Real-money pilot (10-25 users) | FIN, LEG, ENG | H:FO, H:LC | First real dollar through system |
| Aug 2026 | Open beta expansion (500+ users) | GRO, CXS | H:FO | Wider TestFlight + web access |
| Sep 2026 | App Store submission | OPS, LEG | H:RO, H:LC | Full review package with UGC policy |
| Oct 2026 | App Store launch (public) | ALL | H:RO | General availability |
| Oct 2026 | Growth marketing kickoff | GRO | H:FO | Content, SEO, therapist partnerships |
| Nov 2026 | First enterprise pilot (1-3 coaches) | B2B, CXS | H:BD, H:FO | B2B2C validation |
| Dec 2026 | Enterprise pricing live | B2B, FIN | H:BD, AI | $49/$149/$349 tiers |

---

## 7. Revenue & Growth Milestones (Three-Scenario Model)

### 7.1 User & Revenue Projections

| Milestone | Date | Conservative | Moderate | Aggressive | Owner |
|-----------|------|-------------|----------|-----------|-------|
| First test-money contract completed | May 2026 | 1 user | 1 user | 1 user | H:FO |
| First real-money settlement | Jul 2026 | $1 | $1 | $1 | H:FO, H:LC |
| Active beta users | Aug 2026 | 25 | 50 | 200 | H:FO |
| App Store live | Oct 2026 | Public | Public | Public | H:RO |
| Registered users (EOY 2026) | Dec 2026 | 500 | 1,000 | 5,000 | H:FO |
| First enterprise pilot | Dec 2026 | 1 practitioner | 3 | 10 | H:BD |
| MRR (Q1 2027) | Mar 2027 | $1K | $5K | $15K | H:FO |
| B2B contracts (Q1 2027) | Mar 2027 | 2 | 5 | 15 | H:BD |
| Users (mid 2027) | Jun 2027 | 2,000 | 5,000 | 25,000 | H:FO |
| MRR (Q3 2027) | Sep 2027 | $5K | $15K | $50K | H:FO |
| Users (EOY 2027) | Dec 2027 | 5,000 | 18,000 | 50,000+ | H:FO |
| MRR (EOY 2027) | Dec 2027 | $10K | $30K | $100K+ | H:FO |

### 7.2 Scenario Assumptions

**Conservative**: 2 founders, no paid acquisition, organic/referral only, 1 contractor. Revenue from $39 contracts + 1-2 coaches at $49/mo Starter tier.

**Moderate**: 1-2 hires, small paid budget ($2-5K/mo), therapist partnerships. Revenue from consumer contracts + 5-10 practitioners at $149/mo Growth tier.

**Aggressive**: Seed fundraise, 3-5 hires, growth team, paid ($10K+/mo). Revenue from consumer at scale + enterprise at $349-$999+/mo tiers.

### 7.3 B2B2C Revenue Ladder

Per `research--b2b-expansion-heartbreak-niche.md`:

| Tier | Monthly Price | Client Capacity | Target |
|------|--------------|-----------------|--------|
| Starter | $49/mo | 5 clients | Solo coaches, emerging practitioners |
| Growth | $149/mo | 25 clients | Established solo coaches |
| Scale | $349/mo | 75 clients | Small coaching agencies |
| Enterprise | $999+/mo | Unlimited | Large clinics, digital health, IOPs |

---

## 8. Team & Hiring Timeline (Three-Scenario Model)

### 8.1 Non-Negotiable (All Scenarios)

| Role | When Needed | Why | Status |
|------|------------|-----|--------|
| Mobile Native Engineer (Swift) — contract | Mar 2026 (NOW) | Camera module, HealthKit — Beta gate blocker (#123, #134) | Not hired |
| Legal Counsel (retainer) | Mar 2026 (NOW) | Custody model, state matrix, whitepaper, App Store (#132, #133, #136, #146) | Not retained |

### 8.2 Conservative (Founders + 1 Contractor)

| Role | When Needed | Why |
|------|------------|-----|
| Kotlin contractor (short engagement) | May 2026 | Android bridge for Gamma parity |
| (No additional hires) | -- | Founders handle support, growth, BD |

### 8.3 Moderate (Founders + 2-3 Hires)

| Role | When Needed | Why |
|------|------------|-----|
| Mobile Native (Kotlin) — contract or PT | May 2026 | Android parity for Gamma |
| QA / Beta Coordinator — PT | May 2026 | Manage TestFlight cohort, triage feedback |
| Growth / Community Manager | Sep 2026 | Pre-launch community, support, content |

### 8.4 Aggressive (Founders + 4-6 Hires, Assumes Fundraise)

| Role | When Needed | Why |
|------|------------|-----|
| Mobile Native (Kotlin) — FT | May 2026 | Full Android parity |
| QA / Beta Coordinator — FT | May 2026 | Testing + feedback ops |
| Growth / Community Manager | Jul 2026 | Earlier community building |
| Enterprise Sales / BD | Sep 2026 | B2B pilot outreach to therapists/coaches |
| DevOps / SRE — PT | Oct 2026 | Production reliability at scale |
| Content / Marketing | Oct 2026 | SEO, social, PR for App Store launch |

---

## 9. Operational Readiness Checklists

### Before TestFlight Beta (May 2026)

- [ ] Sentry error monitoring active (already done)
- [ ] Uptime monitoring (UptimeRobot / Better Uptime)
- [ ] Beta feedback channel (Discord or dedicated email)
- [ ] Render starter plan to production plan upgrade
- [ ] Database backup policy verified + tested restore
- [ ] `scripts/smoke/beta-readiness.sh` passes with `REQUIRE_TARGETS=true`
- [ ] Apple Developer Account + TestFlight provisioned (Issue #141)

### Before Real-Money Pilot (Jul 2026)

- [ ] Stripe production keys configured
- [ ] High-risk merchant account active (Issue #133)
- [ ] Incident response runbook written
- [ ] Financial reconciliation process documented (ledger <> Stripe)
- [ ] Legal counsel on-call for compliance questions
- [ ] `scripts/validation/01-phantom-money-check.ts` passing in production

### Before App Store Launch (Oct 2026)

- [ ] Apple App Review submission package (UGC policy, privacy nutrition label)
- [ ] Customer support email/system operational
- [ ] Terms of Service + Privacy Policy counsel-approved
- [ ] GDPR data export/deletion tested in production
- [ ] Load testing completed (target: 1,000 concurrent users)
- [ ] CDN/WAF production config verified (`scripts/infra/waf-rules.sh`)
- [ ] `scripts/validation/04-redacted-build-check.sh` + `scripts/gatekeeper-scan.sh` passing

### Before Enterprise Sales (Nov 2026)

- [ ] SOC 2 Type I audit initiated (or roadmap documented)
- [ ] Enterprise security questionnaire template ready
- [ ] SLA document drafted
- [ ] Data processing agreement (DPA) template ready
- [ ] Enterprise demo environment provisioned on Render
- [ ] HR dashboard (F-WEB-03) and B2B orchestration panel (F-DESKTOP-05) functional

---

## 10. Deep Agent Seeding Protocol

### 10.1 Agent Registry

| Dept | Agent Name | Knowledge Corpus (initial ingest) | Memory Path | First Task |
|------|-----------|-----------------------------------|-------------|------------|
| ENG | `styx-eng` | CLAUDE.md, seed.yaml, all `src/`, all tests | (existing project context) | Already active |
| LEG | `styx-legal` | `docs/legal/*` (6 docs), blocked handoff index, `services/geofencing.ts` | `.claude/agents/legal/` | Draft App Store UGC policy checklist |
| PRD | `styx-product` | `docs/research/*behavioral*`, `docs/research/*psychology*`, competitor teardowns, `FEATURE-BACKLOG.md` | `.claude/agents/product/` | Audit 5 critical UX flows for No-Contact recovery |
| OPS | `styx-ops` | `render.yaml`, `docker-compose.yml`, `scripts/smoke/*`, `.github/workflows/*`, `infra/terraform/*` | `.claude/agents/ops/` | Draft incident response runbook v1 |
| GRO | `styx-growth` | `research--market-analysis*.md`, competitor teardowns, demographic data | `.claude/agents/growth/` | SEO keyword research (10 targets for No-Contact recovery niche) |
| FIN | `styx-finance` | `services/billing.ts`, Stripe docs, `research--b2b-expansion-heartbreak-niche.md` pricing tiers | `.claude/agents/finance/` | Build unit economics model for $39 contract |
| CXS | `styx-support` | `src/shared/libs/behavioral-logic.ts`, `FEATURE-BACKLOG.md`, beta-readiness contract | `.claude/agents/support/` | Draft FAQ v1 (10 articles) |
| B2B | `styx-enterprise` | `research--b2b-expansion-heartbreak-niche.md`, competitor coaching software pricing | `.claude/agents/enterprise/` | Define ICP for therapist/coach market |

### 10.2 Seeding Process (Repeatable Per Department)

1. **Create memory directory**: `.claude/agents/{dept}/`
2. **Ingest knowledge corpus**: Read all listed files, write `CONTEXT.md` summary with key facts, constraints, and domain vocabulary
3. **Execute first task**: Validate domain comprehension by producing the listed first-task deliverable
4. **Store findings**: Write results to persistent memory in the agent's directory
5. **Link agent context**: Reference from project CLAUDE.md so future sessions inherit the knowledge

### 10.3 Activation Schedule

| Phase | Agents Seeded |
|-------|--------------|
| Mar 2026 (NOW) | `styx-legal`, `styx-finance`, `styx-product`, `styx-ops` |
| Jul 2026 (Delta prep) | `styx-growth`, `styx-support` |
| Sep 2026 (Omega prep) | `styx-enterprise` |

---

## 11. Meta-SOP Template (Repeatable for ORGANVM Products)

This framework is designed to be extracted into a reusable SOP for any product in the ORGANVM ecosystem.

**Target file**: `meta-organvm/SOP--product-business-organism.md`

### Template Structure

```
# SOP: Product Business Organism

## 1. Product Identity
- Product name, organ, tier, promotion status
- Phase position (Alpha through Omega)
- Core value proposition

## 2. Department Map
- 8 departments with activation phase
- Per-department: agent seed corpus, first task, phase timeline

## 3. Build Timeline (Engineering)
- Ticket consolidation from planning docs
- Owner assignment (AI vs human roles per Owner Legend)
- Phase gate requirements

## 4. Business Organism Timeline
- Department phased activation (Section 5)
- Launch operations cross-departmental calendar (Section 6)
- Three-scenario revenue/growth milestones (Section 7)
- Hiring timeline — three scenarios (Section 8)
- Operational readiness checklists (Section 9)

## 5. Agent Seeding Protocol
- Per-department knowledge corpus
- Memory structure (.claude/agents/{dept}/)
- First task validation
- Persistent context linking

## 6. Verification
- All tickets accounted for
- All blocked handoffs accounted for
- Phase dates internally consistent
- Three scenarios coherent
- Agent seeds produce valid first-task output
```

### Extraction Checklist

When applying this SOP to a new ORGANVM product:

1. Copy this document as the template
2. Replace Styx-specific references with the new product's context
3. Adjust department activation phases based on product maturity
4. Map the product's `seed.yaml` to determine organ edges and dependencies
5. Calibrate three-scenario targets to the product's market research
6. Create `.claude/agents/` directory structure in the new project
7. Seed each department agent with the product's domain corpus
