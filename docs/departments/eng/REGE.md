---
entity: REGE
version: "1.0"
department: eng
name: Engineering
persona: styx-eng
governing_sops:
  - SOP--ci-pipeline-health
  - SOP--dependency-audit
  - SOP--incident-response
  - SOP--release-process
autonomy: guarded
product: styx
---

# REGE: Engineering Department

## 1. Mission & Scope

Engineering owns the full technical lifecycle of the Styx platform: a NestJS API, Next.js web client, React Native mobile app, and Tauri desktop client backed by PostgreSQL, Redis/BullMQ job queues, Stripe escrow, Cloudflare R2 proof storage, and Render hosting. The department is responsible for code quality, deployment reliability, infrastructure cost control, and security posture.

At PUBLIC_PROCESS stage, Engineering's primary concern shifts from greenfield feature velocity to hardening: eliminating phantom-money bugs in the ledger, ensuring the Fury peer-audit pipeline handles adversarial proof submissions, tightening JWT/auth guards, and building the beta-readiness gate suite that blocks any release without passing smoke, security-invariant, and behavioral-physics checks.

Daily work involves CI health monitoring, error triage via Sentry, PR review, and incremental test coverage expansion. Weekly rhythms include dependency audits (especially Stripe SDK and NestJS security patches), load-test review against the 200-concurrent-user beta target, and BullMQ queue depth monitoring. Monthly cycles cover architecture decision records, tech-debt triage, and infrastructure cost reconciliation against the $97/month Render baseline.

## 2. Operational Scope

### Daily

| ID | Activity | Output |
|----|----------|--------|
| D1 | Review CI pipeline status across all workspaces (API, Web, Mobile, Desktop, Shared) | CI dashboard green/red report |
| D2 | Triage Sentry error alerts; classify as P0 (data-loss/money), P1 (user-blocking), P2 (cosmetic) | Sentry issue assignments with severity labels |
| D3 | Review open PR queue; enforce dual-layer services/modules architecture (ADR-001) | PR approvals or change-request comments |
| D4 | Monitor BullMQ queue depths (Fury routing, proof processing, honeypot injection) | Queue health metrics logged |
| D5 | Check Render deployment status and rollback readiness | Deployment log entry |

### Weekly

| ID | Activity | Output |
|----|----------|--------|
| W1 | Dependency audit: scan for CVEs in npm lockfile, flag Stripe SDK drift | `npm audit` report + upgrade tickets |
| W2 | Review test coverage delta; flag any module dropping below 80% line coverage | Coverage trend report |
| W3 | Review blocked-handoff burndown for engineering-owned items | Updated handoff index entries |
| W4 | BullMQ dead-letter queue review; replay or discard stuck jobs | DLQ reconciliation log |
| W5 | Database migration dry-run against staging (PostgreSQL schema drift check) | Migration compatibility report |

### Monthly

| ID | Activity | Output |
|----|----------|--------|
| M1 | Load test execution: simulate 200 concurrent contract-creation + proof-upload flows | `artifacts/load-test-report.md` updated |
| M2 | Test coverage analysis: identify untested critical paths (escrow, Fury routing, ledger invariants) | Coverage gap tickets created |
| M3 | Infrastructure cost reconciliation: Render + R2 + Stripe fees vs. budget | Cost report with anomaly flags |
| M4 | Security invariant sweep: run `06-security-invariant-check.ts` against compiled output | Security audit artifact updated |
| M5 | Review and update API specification against actual endpoints | `api--spec.md` diff report |

### Quarterly

| ID | Activity | Output |
|----|----------|--------|
| Q1 | Architecture review: evaluate ADR compliance, identify structural drift from dual-layer pattern | ADR compliance report; new ADRs if needed |
| Q2 | Tech debt assessment: categorize, estimate, and prioritize accumulated shortcuts | Tech debt register with effort estimates |
| Q3 | Disaster recovery drill: simulate database restore, R2 bucket recovery, Stripe webhook replay | DR drill report with recovery-time measurements |
| Q4 | Performance baseline reset: establish new p50/p95/p99 latency targets for critical endpoints | Performance baseline document |

## 3. Artifacts Registry

| ID | Name | Path | Phase | Staleness (days) | Last Updated | Status |
|----|------|------|-------|-------------------|--------------|--------|
| E1 | CI Pipeline Config | `.github/workflows/ci.yml` | BUILD | 30 | — | active |
| E2 | API Specification | `docs/api/api--spec.md` | BUILD | 14 | — | active |
| E3 | Architecture Decision Records | `docs/adr/` | BUILD | 90 | — | active |
| E4 | Test Strategy | `docs/departments/eng/artifacts/test-strategy.md` | SHAPE | 30 | — | dormant |
| E5 | Load Test Report | `docs/departments/eng/artifacts/load-test-report.md` | PROVE | 30 | — | dormant |
| E6 | Beta Readiness Contract | `docs/planning/planning--beta-readiness-contract.md` | PROVE | 14 | — | active |
| E7 | Security Invariant Report | `docs/departments/eng/artifacts/security-invariant-report.md` | PROVE | 30 | — | dormant |
| E8 | Infrastructure Cost Ledger | `docs/departments/eng/artifacts/infra-cost-ledger.md` | BUILD | 30 | — | dormant |
| E9 | Dependency Audit Log | `docs/departments/eng/artifacts/dependency-audit-log.md` | BUILD | 7 | — | dormant |

## 4. Generative Prompts (GEN:)

### GEN:test-coverage-report

- **Trigger:** W2 (weekly coverage review) or M2 (monthly coverage analysis)
- **Input:** `npx jest --coverage --json` output across all workspaces; current test count (~430 tests)
- **Action:** Parse per-module coverage, compare against 80% threshold, identify untested critical paths in escrow service, FuryRouterWorker, LedgerService, and GoalEthicsService. Generate markdown report with gap analysis.
- **Output:** `artifacts/test-strategy.md` updated with current coverage map and prioritized gap list
- **Guardrails:** Never lower coverage thresholds. Flag any escrow/ledger module below 90% as P0 gap. Do not auto-generate test stubs without human review.

### GEN:load-test-analysis

- **Trigger:** M1 (monthly load test) or on-demand before any milestone release
- **Input:** Load test results from k6 or Artillery run against staging; target: 200 concurrent users, contract creation + proof upload
- **Action:** Analyze p50/p95/p99 latency distributions, error rates, BullMQ queue saturation, PostgreSQL connection pool utilization, R2 upload throughput. Compare against previous baseline.
- **Output:** `artifacts/load-test-report.md` with regression flags, bottleneck identification, and capacity recommendations
- **Guardrails:** Do not recommend infrastructure scaling without cost impact analysis. Flag any p99 > 2s on contract creation or proof upload as blocking.

### GEN:dependency-audit

- **Trigger:** W1 (weekly audit) or when Dependabot/Renovate PRs arrive
- **Input:** `npm audit --json`, Snyk scan results, Stripe SDK changelog, NestJS security advisories
- **Action:** Classify vulnerabilities by severity (critical/high/medium/low), assess exploitability in Styx context (escrow flows, JWT auth, R2 signed URLs), generate upgrade plan with breaking-change risk assessment.
- **Output:** `artifacts/dependency-audit-log.md` appended with dated entry; critical findings create GitHub issues
- **Guardrails:** Critical vulnerabilities in payment/auth paths require same-day triage. Never auto-merge major version bumps for Stripe SDK, NestJS core, or PostgreSQL driver.

### GEN:incident-postmortem

- **Trigger:** Any P0 or P1 incident (data loss, money misroute, auth bypass, extended downtime)
- **Input:** Sentry event chain, deployment logs, BullMQ job traces, user reports
- **Action:** Construct timeline, identify root cause, assess blast radius (affected contracts/users/funds), document remediation steps, propose preventive measures.
- **Output:** `docs/departments/eng/artifacts/postmortems/YYYY-MM-DD--{slug}.md`
- **Guardrails:** Blameless format. Must include concrete prevention items with owners and deadlines. Escalate to Legal if any user funds were affected.

## 5. Self-Critique Rules (CRIT:)

### CRIT:test-coverage-drift

- **Cadence:** Weekly (aligned with W2)
- **Check:** Compare current line coverage per module against previous week. Flag if any critical-path module (escrow, fury, ledger, proofs, auth) drops more than 2 percentage points.
- **Output:** Coverage drift report appended to `artifacts/test-strategy.md`
- **Escalate:** If escrow or ledger coverage drops below 85%, emit `signal:test-failure` and block next release via beta-readiness gate.

### CRIT:dependency-vulnerability

- **Cadence:** Weekly (aligned with W1)
- **Check:** Count of unresolved critical/high CVEs in production dependencies. Check age of oldest unresolved critical CVE.
- **Output:** Vulnerability summary in `artifacts/dependency-audit-log.md`
- **Escalate:** If any critical CVE in payment/auth path is unresolved > 48 hours, emit `signal:security-alert` to Legal and escalate to PULSE.

### CRIT:deploy-stability

- **Cadence:** Daily (aligned with D5)
- **Check:** Count of rollbacks in the last 7 days. If > 2 rollbacks in a rolling week, flag deployment pipeline instability.
- **Output:** Deployment stability note in CI dashboard
- **Escalate:** If 3+ rollbacks in 7 days, pause automated deployments and require manual approval for next 48 hours.

## 6. Self-Heal Procedures (HEAL:)

### HEAL:ci-pipeline-recovery

- **Trigger:** CI pipeline fails on main branch for > 1 hour (not a PR branch failure)
- **Action:** (1) Identify failing step from workflow logs. (2) If dependency install failure, clear npm cache and retry. (3) If test flake (same test passed in previous 3 runs), mark as flaky and re-run with `--retry=2`. (4) If infrastructure failure (Render, R2 connectivity), switch to offline test profile. (5) If none of the above, create P1 issue and notify.
- **Guardrails:** Maximum 3 auto-retries per pipeline run. Never skip failing security or escrow tests. Log all auto-heal actions for audit trail.

### HEAL:queue-drain

- **Trigger:** BullMQ dead-letter queue exceeds 50 items or any single job type has > 20 DLQ entries
- **Action:** (1) Categorize DLQ entries by job type (fury-route, proof-process, honeypot-inject). (2) For proof-process failures with transient R2 errors, auto-retry with exponential backoff. (3) For fury-route failures, check if target Fury auditor is still active; if not, re-route to next eligible auditor. (4) For honeypot failures, log and discard (honeypots are non-critical).
- **Guardrails:** Never auto-retry escrow-related jobs. Cap auto-retries at 3 per job. If DLQ continues growing after heal attempt, emit `signal:test-failure` and escalate.

### HEAL:stale-artifact-refresh

- **Trigger:** Any artifact in the registry exceeds its staleness threshold by > 7 days
- **Action:** (1) Run the corresponding GEN: prompt to regenerate the artifact from current system state. (2) Create a draft PR with the updated artifact for human review. (3) Update the Last Updated timestamp only after human merge.
- **Guardrails:** Never auto-merge generated artifacts. Flag if generation fails or produces empty output. Do not refresh artifacts during active incidents.

## 7. Signal Wiring

### Emits

- `signal:deploy-complete` — consumed by **PRD** (feature-shipped tracking), **OPS** (monitoring reset)
- `signal:test-failure` — consumed by **PRD** (release-blocker awareness), **OPS** (incident alerting)
- `signal:api-change` — consumed by **PRD** (feature-matrix update), **LEG** (API compliance review)
- `signal:security-alert` — consumed by **LEG** (vulnerability compliance assessment), **OPS** (incident response)
- `signal:load-test-complete` — consumed by **PRD** (capacity planning), **OPS** (scaling decisions)

### Consumes

- `signal:feature-shipped` from **PRD** — trigger documentation sync, update API spec if endpoints changed
- `signal:roadmap-change` from **PRD** — re-evaluate tech debt priorities, adjust sprint capacity allocation
- `signal:compliance-alert` from **LEG** — review flagged code paths for legal risk, implement required guardrails
- `signal:tos-update` from **LEG** — audit API responses for alignment with updated terms (especially escrow language, Fury auditor agreements)

### Escalates

- `signal:phantom-money-detected` — escalate to **PULSE** immediately; any ledger invariant violation where credits do not equal debits
- `signal:auth-bypass-detected` — escalate to **PULSE**; any request reaching protected endpoints without valid JWT
- `signal:data-breach-suspected` — escalate to **PULSE** + **LEG**; any evidence of unauthorized data access

## 8. Human Checkpoints

1. **Escrow logic changes:** Any modification to `LedgerService`, `EscrowService`, or Stripe webhook handlers requires human code review from the founder, regardless of test coverage.
2. **Database migration to production:** All PostgreSQL migrations must be dry-run against staging snapshot and approved before production execution. No auto-migrations.
3. **Fury routing algorithm changes:** Modifications to `FuryRouterWorker` or auditor selection logic require human review — incorrect routing can misdirect user funds.
4. **Infrastructure cost threshold:** Any change expected to increase monthly hosting costs by > 20% ($19/month on current $97 baseline) requires founder approval.
5. **Third-party SDK major upgrades:** Major version bumps for Stripe, NestJS, or React Native require human review of changelog and migration guide before merge.

## 9. Health Indicators

- **Green:** All artifacts within staleness thresholds. CI pipeline green on main. No unresolved P0/P1 issues. BullMQ DLQ < 10 items. No unresolved critical CVEs. All beta-readiness gates passing.
- **Yellow:** 1-2 artifacts stale OR CI flaky (> 1 retry/day average over 7 days) OR unresolved P1 > 48 hours OR DLQ 10-50 items OR 1 high CVE unresolved > 7 days.
- **Red:** 3+ artifacts stale OR CI broken on main > 4 hours OR any P0 unresolved OR DLQ > 50 items OR critical CVE unresolved > 48 hours OR any CRIT: escalation active OR beta-readiness gate failing on staging.

## 10. Growth Backlog

| ID | Item | Notes |
|----|------|-------|
| E4 | Test strategy document | Deferred until beta gate suite is fully wired; will formalize coverage targets per module |
| E5 | Load test report | Deferred until staging environment stable with realistic data volume |
| E7 | Security invariant report | Currently generated by `06-security-invariant-check.ts`; needs dedicated artifact with trend tracking |
| E8 | Infrastructure cost ledger | Track Render + R2 + Stripe fees monthly; establish burn-rate projections |
| E9 | Dependency audit log | Formalize from ad-hoc `npm audit` runs into dated, cumulative log |
| E10 | Observability dashboard | Grafana or Render metrics dashboard for p50/p95/p99 latency, error rates, queue depths |
| E11 | Chaos engineering playbook | Controlled failure injection for database, R2, Stripe webhook scenarios |
| E12 | Mobile release pipeline | TestFlight/Play Store beta distribution automation for React Native app |
