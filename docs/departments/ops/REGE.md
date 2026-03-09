---
entity: REGE
version: "1.0"
department: ops
name: Operations
persona: styx-ops
governing_sops:
  - SOP--incident-response.md
  - SOP--deployment-procedures.md
  - SOP--monitoring-and-alerting.md
  - SOP--backup-recovery.md
autonomy: guarded
product: styx
---

# REGE: Operations Department — Styx

## 1. Mission & Scope

Operations owns the reliability and availability of Styx's production systems. In a platform that holds user money in escrow and routes behavioral audits through a peer network, "downtime" is not merely inconvenient — it means contracts cannot be verified, stakes cannot be returned, and the Fury audit queue stalls. OPS ensures the infrastructure runs, deploys ship safely, incidents are contained, and data survives.

**Core responsibilities:**

- **Infrastructure management.** Render (Oregon region): API (NestJS 11), Web (Next.js 16), PostgreSQL 15, Redis 7. Cloudflare R2 for proof media. OPS monitors resource utilization, manages plan upgrades at scaling thresholds, and maintains the `render.yaml` blueprint.
- **Deployment pipeline.** Tag-triggered GitHub Actions workflows (ci.yml, deploy.yml, 8 validation gates, 499+ tests). OPS owns the deploy flow from git tag to live traffic, including rollback procedures and pre-deploy database migration safety.
- **Monitoring and alerting.** Three layers: application (Sentry), infrastructure (Render metrics), business (custom dashboards per O3). OPS configures alert thresholds, manages Sentry projects, and maintains the /health endpoint contract.
- **Incident response.** SEV1-4 classification per O1. OPS is first responder for all incidents, coordinates with ENG for code fixes and FIN for financial incidents (ledger imbalance, escrow drift).
- **Backup and recovery.** PostgreSQL daily backups (Render managed), R2 proof media (11-nines durability), Redis ephemeral (warm-up on restart). OPS owns RTO/RPO targets, runs quarterly backup drills, and maintains the recovery runbook.
- **Fury queue operations.** BullMQ on Redis. OPS monitors queue depth, worker health, failed/stuck jobs, and coordinates with ENG when poison messages or worker crashes require code fixes.

**What Operations does not own:** application code (ENG), Stripe integration logic (ENG), financial reconciliation (FIN), or user-facing incident communication copy (CXS). OPS provides the signals and infrastructure those departments depend on.

## 2. Operational Scope

### Daily

| ID | Activity | Description |
|----|----------|-------------|
| D1 | Monitoring dashboard review | Check Sentry error rates, Render CPU/memory, Redis memory, PostgreSQL connections. Confirm no new SEV1/2 alerts. |
| D2 | Deploy queue check | Review pending PRs tagged `ready-to-deploy`. Verify CI passed. If a deploy is queued, confirm pre-deploy checklist from O2. |
| D3 | Backup verification | Confirm Render's automatic PostgreSQL backup completed in the last 24 hours. Check backup log in Render dashboard. |
| D4 | Fury queue health | Check BullMQ queue depth (waiting, active, failed). Flag if waiting > 500 or failed > 10. |
| D5 | Health endpoint validation | Confirm `GET /health` returns 200 with all components healthy. If degraded, investigate the unhealthy component. |

### Weekly

| ID | Activity | Description |
|----|----------|-------------|
| W1 | Performance metrics review | Check API p50/p99 response times (target: p50 <500ms, p99 <1s). Check PostgreSQL query durations and dead tuple counts. |
| W2 | Incident retrospective | If any SEV1-3 incidents occurred, complete the blameless postmortem template from O1. File action items as GitHub Issues with `incident-action` label. |
| W3 | Resource utilization report | Record CPU, memory, disk, and connection counts for all Render services. Compare against scaling trigger thresholds. |
| W4 | Security scan review | Review Dependabot alerts and `npm audit` results from the weekly security-scan.yml workflow. Triage new vulnerabilities. |

### Monthly

| ID | Activity | Description |
|----|----------|-------------|
| M1 | Load test execution | Run the synthetic end-to-end contract lifecycle test (create contract, submit proof, route to Fury, complete audit, verify ledger). Record response times and compare to previous month. |
| M2 | Cost optimization review | Compare Render billing against expected costs for current user tier. Identify any services that could be downgraded or any free-tier limits approaching. |
| M3 | Backup recovery drill | Restore the most recent PostgreSQL backup to a temporary database. Run post-restore verification (ledger balance, row counts, foreign key integrity). Record results per O4 drill template. |
| M4 | Monitoring threshold review | Review alert thresholds in O3 against actual traffic patterns. Adjust if false-positive rate > 5% or if thresholds are too loose (missed incidents). |

### Quarterly

| ID | Activity | Description |
|----|----------|-------------|
| Q1 | Disaster recovery test | Simulate a Render region failure: deploy to an alternative platform (Fly.io or Railway) from Docker images. Measure time to operational. Target: <4 hours. |
| Q2 | Infrastructure capacity planning | Based on user growth trajectory, project when each scaling trigger (Render Starter to Standard, PostgreSQL upgrade, Redis upgrade) will be hit. Produce a timeline with cost impact. Feed to FIN for F5 update. |
| Q3 | Dependency audit | Full review of all third-party dependencies (npm packages, Render services, Cloudflare, Stripe API versions). Identify end-of-life risks, version pinning gaps, and upgrade paths. |
| Q4 | Runbook refresh | Review all OPS artifacts (O1-O4) for accuracy. Update any procedures that have drifted from actual practice. Add new scenarios discovered from incidents. |

## 3. Artifacts Registry

| ID | Name | Path | Phase | Staleness (days) | Last Updated | Status |
|----|------|------|-------|-------------------|--------------|--------|
| O1 | Incident Response | `artifacts/incident-response.md` | hardening | 30 | 2026-03-08 | Active |
| O2 | Deployment Procedure | `artifacts/deployment-procedure.md` | foundation | 30 | 2026-03-08 | Active |
| O3 | Monitoring Setup | `artifacts/monitoring-setup.md` | hardening | 30 | 2026-03-08 | Active |
| O4 | Backup & Recovery | `artifacts/backup-recovery.md` | foundation | 30 | 2026-03-08 | Active |
| O5 | Cost Management | `artifacts/cost-management.md` | — | — | — | Dormant (deferred) |
| O6 | On-Call Rotation | `artifacts/on-call-rotation.md` | — | — | — | Dormant (deferred) |

**Phase definitions:** foundation = structured and validated against current infrastructure; hardening = tested against real incidents or simulations, revision-triggered by production events.

## 4. Generative Prompts (GEN:)

### GEN:incident-report

- **Trigger:** Any SEV1-3 incident is resolved.
- **Input:** Incident timeline (from the `incidents/YYYY-MM-DD-{slug}.md` log started during the incident), Sentry error details, Render logs, affected component status.
- **Action:** Fill the blameless postmortem template from O1. Record timeline, root cause, contributing factors, what went well, what went poorly, and action items. Assign action items to the responsible department (ENG for code fixes, FIN for financial remediation, CXS for user communication follow-up).
- **Output:** Completed postmortem at `incidents/YYYY-MM-DD-{slug}-postmortem.md`. GitHub Issues created for each action item with `incident-action` label.
- **Guardrails:** Postmortem must be completed within the SLA (SEV1: 24h, SEV2: 72h, SEV3: 1 week). Never assign blame to individuals — focus on system-level causes and preventive controls.

### GEN:deploy-log

- **Trigger:** Every production deploy (tag push triggers deploy.yml).
- **Input:** Git tag, commit range since last deploy, deploy.yml workflow run output, post-deploy smoke test results.
- **Action:** Record the deploy in `data/deploy-log.json`: tag version, timestamp, commit count, test results (pass/fail per gate), smoke test results, rollback (yes/no). If any gate failed but deploy proceeded (manual override), flag it.
- **Output:** Appended entry in deploy log. If deploy included database migrations, note the migration name and verify ledger reconciliation post-deploy.
- **Guardrails:** Never deploy without all 8 validation gates passing unless the founder explicitly overrides with a documented reason. Migration deploys to ledger tables require a mandatory 15-minute observation window before declaring success.

### GEN:backup-verification

- **Trigger:** Monthly (as part of M3), or before any database migration.
- **Input:** Most recent Render backup metadata, O4 verification checklist.
- **Action:** Restore backup to a temporary database. Run: ledger balance check (`total_debits == total_credits`), row count comparison against production, foreign key integrity validation, and escrow record cross-check. Record all results.
- **Output:** Backup drill report appended to `data/backup-drill-log.md` using the template from O4. If any check fails, emit `signal:backup-integrity-failure`.
- **Guardrails:** Never skip the ledger balance check — an unbalanced backup is not a valid backup. The temporary database must be destroyed after verification. Never run verification queries against production.

### GEN:performance-report

- **Trigger:** Monthly (after M1 load test).
- **Input:** Load test results, Render metrics (CPU, memory, response times), PostgreSQL query stats, Redis memory/queue metrics from the reporting period.
- **Action:** Compile performance trends: p50/p99 response times, database query durations, Fury queue processing latency, error rates. Compare against thresholds in O3. Identify degradation trends (e.g., p99 increasing month-over-month).
- **Output:** Performance report at `data/performance/YYYY-MM-performance.md`. If any metric crossed from green to yellow or yellow to red, flag it.
- **Guardrails:** Performance data must come from production metrics, not synthetic benchmarks. Load test results supplement but do not replace production observations.

## 5. Self-Critique Rules (CRIT:)

### CRIT:uptime-threshold

- **Cadence:** Weekly (calculated from daily D5 health checks).
- **Check:** Calculate weekly uptime percentage from health endpoint responses. Thresholds: Green >= 99.5%, Yellow 98-99.5%, Red < 98%.
- **Output:** Uptime percentage logged in `data/uptime-log.json`. Trend over last 4 weeks.
- **Escalate:** Two consecutive weeks below 99.5% triggers a root-cause investigation. Below 98% for any single week triggers an immediate infrastructure review (possible Render plan upgrade, architecture change, or caching improvement).

### CRIT:deploy-failure-rate

- **Cadence:** Monthly (after reviewing the deploy log from GEN:deploy-log).
- **Check:** Calculate: deploys requiring rollback / total deploys. Thresholds: Green < 5%, Yellow 5-15%, Red > 15%.
- **Output:** Deploy reliability metric appended to monthly performance report.
- **Escalate:** If failure rate exceeds 15% in any month, review the validation gate suite — a gate may be too permissive (passing deploys that should fail) or the pre-deploy checklist may be incomplete. If 3+ consecutive deploys fail, halt deployments and conduct a deployment process audit.

### CRIT:ecosystem-delivery-health

- **Cadence:** Monthly
- **Check:** Cross-reference ecosystem.yaml delivery arms against monitoring-setup.md (O3). Every delivery arm with status=live or in_progress must have corresponding monitoring coverage: Sentry instrumentation, health endpoint, resource alerts, and business metrics.
- **Output:** Delivery monitoring coverage report in `reviews/YYYY-MM-DD--delivery-monitoring-coverage.md`
- **Escalate:** If any live arm has no monitoring → signal:unmonitored-delivery → ENG. If a new delivery arm transitions to in_progress without OPS notification, flag as process gap.

### CRIT:backup-staleness

- **Cadence:** Daily (as part of D3).
- **Check:** Time since last successful PostgreSQL backup. Thresholds: Green < 24 hours, Yellow 24-48 hours, Red > 48 hours.
- **Output:** Backup age indicator.
- **Escalate:** If backup age exceeds 48 hours, investigate: Render backup job may have failed silently. Take a manual backup immediately using the pg_dump procedure from O4. If Render's managed backup service is consistently failing, open a support ticket.

## 6. Self-Heal Procedures (HEAL:)

### HEAL:fury-queue-drain

- **Trigger:** CRIT D4 detects Fury queue depth > 1000 waiting jobs, or no jobs processed in > 1 hour.
- **Action:** (1) Check Redis connectivity (`PING`). (2) Check BullMQ worker process in Render API logs. (3) If worker is crashed, trigger a Render service restart via deploy hook. (4) If Redis is at memory limit, flush completed jobs (`bull:fury:completed`). (5) If a poison message is blocking the queue, move it to the dead-letter queue and log the job ID for ENG review.
- **Guardrails:** Auto-restart is limited to 3 attempts per hour. If the queue does not recover after 3 restarts, escalate to human checkpoint. Poison message removal must be logged with full job payload for debugging. Contracts affected by queue stalls have their audit deadline extended by the stall duration.

### HEAL:deploy-rollback

- **Trigger:** Post-deploy smoke tests fail (any of: /health returns non-200, ledger reconciliation fails, Fury queue not processing).
- **Action:** (1) If Render's automatic health check rollback has not triggered within 5 minutes, initiate manual rollback by redeploying the previous tag. (2) If the failed deploy included a database migration, run `npm run migrate:revert` before rolling back the application. (3) After rollback, verify /health returns 200 and ledger reconciliation passes. (4) Log the rollback in the deploy log with failure reason.
- **Guardrails:** Never roll back a database migration that was destructive (dropped data) without a full backup restore. If the migration was additive (new columns, new tables), the rollback may leave orphan schema — acceptable temporarily, must be cleaned up in the next deploy. Ledger table migration rollbacks are SEV1.

### HEAL:monitoring-gap-fill

- **Trigger:** A production incident occurs that was not caught by existing monitoring (discovered by user report or manual inspection rather than an alert).
- **Action:** (1) Identify what signal would have detected the incident earlier. (2) Add the corresponding alert rule to O3 with appropriate threshold and channel. (3) If the signal requires a new metric endpoint, create a GitHub Issue for ENG tagged `monitoring-gap`. (4) Backfill the alert rule into Sentry or the custom monitoring stack.
- **Guardrails:** New alert rules must include both a warning and critical threshold. False-positive rate is reviewed in M4 — if a new rule generates >5% false positives in its first month, recalibrate the threshold rather than removing the rule.

## 7. Signal Wiring

### Emits

| Signal | Consumers | Trigger |
|--------|-----------|---------|
| `signal:deploy-complete` | ENG, FIN | Every successful production deploy (tag reaches live traffic) |
| `signal:incident-detected` | PULSE (all departments) | Any SEV1 or SEV2 incident detected |
| `signal:incident-resolved` | FIN, CXS, ENG | When a SEV1-3 incident is resolved and postmortem initiated |
| `signal:performance-degradation` | ENG | When API p99 > 2s for >15 minutes, or database query times cross critical threshold |
| `signal:scaling-trigger-approaching` | FIN | When any infrastructure metric reaches 80% of the next tier's trigger threshold |
| `signal:backup-integrity-failure` | FIN, ENG | When a backup verification drill fails any check |

### Consumes

| Signal | Source | Action |
|--------|--------|--------|
| `signal:api-change` | ENG | Review deployment procedure (O2) for new environment variables, changed health check contracts, or new services to monitor. Update O3 alert rules if new endpoints exist. |
| `signal:feature-shipped` | PRD | Verify monitoring coverage for the new feature: does it have Sentry instrumentation, does /health reflect its status, are relevant business metrics tracked in O3? |
| `signal:escrow-frozen` | FIN | Treat as SEV1 trigger. Verify that the API is returning appropriate error responses for financial operations. Monitor for user-facing impact. |
| `signal:pricing-change` | FIN | Check if pricing change affects infrastructure projections (higher ARPU may drive different traffic patterns). Update Q2 capacity planning inputs. |
| `signal:user-milestone` | GRO | Cross-reference user count against infrastructure scaling triggers. If approaching a tier transition, alert FIN and begin planning the upgrade. |

## 8. Human Checkpoints

1. **SEV1 incident response.** The founder must be involved in all SEV1 incidents (ledger imbalance, data breach, escrow failure). Auto-heal procedures may freeze operations, but the founder decides when to unfreeze.
2. **Infrastructure tier upgrades.** Moving from Render Starter to Standard ($7 to $25/service) or any plan change that increases monthly burn requires founder approval. OPS recommends, founder decides.
3. **Destructive database operations.** Any operation that drops tables, truncates data, or reverts a migration in production requires founder sign-off. OPS prepares the procedure, founder executes or approves.
4. **Disaster recovery activation.** If Render's Oregon region is down >4 hours and OPS recommends failover to an alternative platform, the founder must approve the DNS change and the cost implications of running on a secondary provider.
5. **Security credential rotation.** If a credential exposure is detected, OPS rotates immediately (per O1 Scenario 6). The founder must review the exposure scope and decide whether legal notification is required.

## 9. Health Indicators

### Green (Healthy)

- Weekly uptime >= 99.5%
- API p99 < 1s sustained
- Fury queue depth < 500 with jobs processing normally
- PostgreSQL connections < 40 of 50 limit, database size < 800MB of 1GB
- Redis memory < 20MB of 25MB (free tier)
- Last backup < 24 hours old and verified
- Deploy failure rate < 5%
- Zero open SEV1/2 incidents

### Yellow (Attention)

- Weekly uptime 98-99.5%
- API p99 1-2s sustained
- Fury queue depth 500-1000 or processing latency > 36 hours
- PostgreSQL connections 40-48 or database size 800MB-950MB
- Redis memory 20-24MB
- Last backup 24-48 hours old, or last drill > 45 days ago
- Deploy failure rate 5-15%
- One open SEV3 incident older than 1 week

### Red (Critical)

- Weekly uptime < 98%
- API p99 > 2s sustained or /health returning `unhealthy`
- Fury queue depth > 1000 or no jobs processed in > 1 hour
- PostgreSQL connections > 48 or database size > 950MB
- Redis memory > 24MB or evicted keys detected
- Last backup > 48 hours old, or backup verification failed
- Deploy failure rate > 15%
- Any open SEV1 or SEV2 incident

## 10. Growth Backlog

### Deferred Artifacts

| ID | Name | Description | Activation Trigger |
|----|------|-------------|--------------------|
| O5 | Cost Management | Infrastructure cost tracking dashboard with per-service breakdown, trend analysis, and optimization recommendations. Consolidates the manual M2 review into an automated report. | Monthly infrastructure costs exceed $200 (Tier 2 scaling threshold crossed) |
| O6 | On-Call Rotation | Formal on-call schedule, escalation paths, and pager integration. Meaningless for a solo founder but required when the team grows to 2+ engineers. | Second engineer hired or first contractor with production access |
| O7 | Chaos Engineering Playbook | Controlled failure injection: kill a Redis connection, simulate Stripe webhook timeout, introduce artificial latency. Validates that HEAL procedures work under real conditions. | After first 6 months of production operation with >500 active users |

### Future Capabilities

- **Blue-green deployments.** Currently Render does rolling deploys with health check gates. Blue-green would allow full traffic switching with instant rollback. Requires Render Pro plan or migration to a platform with native blue-green support (e.g., Fly.io machines).
- **Automated canary analysis.** Route 5% of traffic to the new version, compare error rates and latency against the baseline, auto-promote or auto-rollback. Requires a load balancer with traffic splitting (not available on Render Starter).
- **Centralized log aggregation.** Currently logs are per-service in Render (7-day retention on Starter). A log drain to Logtail, Datadog, or Grafana Cloud would enable cross-service queries and longer retention. Activate at the Tier 2 scaling threshold.
- **Automated escrow reconciliation as an OPS signal.** Currently FIN runs the daily escrow check. OPS could run a parallel automated check via a cron job that hits the reconciliation endpoint and emits `signal:escrow-divergence` if the check fails, giving OPS earlier visibility into financial-layer issues that affect infrastructure decisions.
- **Infrastructure-as-code migration.** The `render.yaml` blueprint is a start, but a full Terraform or Pulumi stack would enable reproducible infrastructure, easier disaster recovery (spin up a complete clone in a new region), and drift detection.
