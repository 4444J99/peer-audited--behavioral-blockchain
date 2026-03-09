---
generated: true
department: OPS
artifact_id: O1
governing_sop: "SOP--incident-response.md"
phase: hardening
product: styx
date: "2026-03-08"
---

# Incident Response Plan — Styx

## Overview

Styx handles PII, financial data (Stripe FBO escrow), and behavioral/health information. Incidents can have legal, financial, and reputational consequences beyond typical SaaS failures. This plan defines severity levels, scenario-specific response procedures, communication protocols, and post-incident review processes.

## Severity Classification

| Level | Definition | Response Time | Examples |
|-------|-----------|---------------|---------|
| **SEV1 — Critical** | Data breach, financial loss, ledger corruption, escrow failure | Immediate (< 15 min) | PII exposed, phantom money detected, Stripe webhook forgery, database compromised |
| **SEV2 — Major** | Service outage, escrow stuck, core feature broken | < 1 hour | API down, Fury queue stalled, database unreachable, authentication broken |
| **SEV3 — Degraded** | Partial outage, degraded performance, non-critical feature broken | < 4 hours | Slow API (p99 > 2s), R2 proof uploads failing, single endpoint down, analytics broken |
| **SEV4 — Minor** | UI bug, cosmetic issue, non-blocking error | Next business day | Typo in email, dashboard chart rendering issue, non-critical log errors |

## SEV1 Scenarios and Response Procedures

### Scenario 1: Ledger Imbalance Detected (Phantom Money)

**Trigger:** Reconciliation check finds total debits != total credits.

**Immediate actions (< 15 min):**
1. **HALT all financial operations.** Set `LEDGER_FROZEN=true` environment variable or toggle feature flag.
2. Pull the reconciliation report: identify which transactions are imbalanced.
3. Check recent ledger writes: query `ledger_entries` table ordered by `created_at DESC LIMIT 100`.
4. Determine scope: is it one transaction or systemic?

**Investigation:**
1. Check for race conditions in concurrent ledger writes (look for overlapping timestamps on the same contract).
2. Verify Stripe webhook delivery: compare Stripe dashboard events with local `webhook_events` table.
3. Check for partial transaction commits: PostgreSQL should prevent this, but verify no `AUTOCOMMIT` bypass exists.
4. Review recent deployments: was a migration applied that modified ledger schema?

**Resolution:**
1. If isolated to one transaction: create a correcting journal entry (adjustment debit/credit pair) with detailed notes.
2. If systemic: roll back to last known-good state (see Backup Recovery plan), replay transactions from Stripe event log.
3. Unfreeze ledger operations only after reconciliation passes.

**Communication:** Notify all active users that "financial processing is temporarily paused for integrity verification." No details about the specific issue.

### Scenario 2: Fury Queue Stuck (BullMQ Failure)

**Trigger:** Fury queue depth > 1000, or no audits processed in > 1 hour.

**Immediate actions:**
1. Check Redis connectivity: `redis-cli -h styx-redis ping`
2. Check BullMQ worker status: look for worker process in Render logs.
3. Check for poison messages: inspect the first job in the stuck queue.

**Investigation:**
1. Is Redis out of memory? Check `INFO memory` — if `used_memory` near `maxmemory`, the queue cannot accept new jobs.
2. Is the worker crashing on a specific job? Check Sentry for repeated errors from `FuryRouterService`.
3. Is there a deadlock? Check for jobs in `active` state that have been there > 10 minutes.

**Resolution:**
1. Redis OOM: flush completed jobs (`bull:fury:completed` key), increase Redis plan if needed.
2. Poison message: move the failing job to a dead-letter queue, restart worker.
3. Worker crash loop: fix the error, redeploy API service on Render.
4. If audits are time-sensitive: manually process critical audits (contracts near expiry) through admin API.

**Impact:** Contracts awaiting audit are delayed but not lost. Users see "audit pending" status.

### Scenario 3: Stripe Webhook Failure (Escrow Not Captured)

**Trigger:** Stripe sends webhook events but Styx does not process them. Detected by: missing `webhook_events` records for known Stripe events, or user complaints about payment status.

**Immediate actions:**
1. Check Stripe webhook dashboard: are events being delivered? Look for 4xx/5xx responses.
2. Check API logs for webhook handler errors.
3. Verify webhook signing secret matches between Stripe dashboard and `STRIPE_WEBHOOK_SECRET` env var.

**Investigation:**
1. Was the signing secret rotated without updating the env var?
2. Is the webhook endpoint URL correct after the last deploy? (Render URL change?)
3. Is there a payload schema mismatch? (Stripe API version upgrade?)

**Resolution:**
1. Fix the root cause (secret, URL, schema).
2. Replay missed events: use Stripe dashboard "Resend" for each failed event, or use `stripe events resend` CLI.
3. Verify each replayed event is processed: check `webhook_events` table and corresponding ledger entries.
4. If escrow was supposed to be captured but was not: manually capture through Stripe dashboard, then create the ledger entry.

**Critical:** Never create a ledger entry without the corresponding Stripe action (or vice versa). Both must exist.

### Scenario 4: Database Corruption

**Trigger:** PostgreSQL errors indicating data corruption, checksum failures, or unrecoverable transaction log errors.

**Immediate actions:**
1. Set application to maintenance mode (return 503 on all API endpoints).
2. Do NOT attempt writes to the corrupted database.
3. Assess corruption scope: is it a single table or system-wide?

**Resolution:**
1. If single table: attempt `REINDEX TABLE <name>`. If that fails, restore that table from backup.
2. If system-wide: initiate full database restore from Render's managed backup (see Backup Recovery plan).
3. After restore: run ledger reconciliation, verify escrow states match Stripe, verify user accounts.

### Scenario 5: R2 Proof Storage Unavailable

**Trigger:** Proof uploads fail, proof retrieval returns errors, Cloudflare R2 API unreachable.

**Immediate actions:**
1. Check Cloudflare status page for R2 outages.
2. Check R2 API credentials: are they expired or rotated?

**Investigation:**
1. Is it a regional outage or account-specific?
2. Are signed URLs still generating correctly?

**Resolution:**
1. If Cloudflare outage: wait for resolution. Proofs queued in BullMQ will retry automatically.
2. If credential issue: rotate R2 API token in Render environment variables, redeploy.
3. For in-flight audits: extend audit deadline by the duration of the outage.

**Impact:** Auditors cannot view proof media. Contracts are not affected financially, but audit timelines slip.

### Scenario 6: Security Breach (API Key / Credential Exposure)

**Trigger:** Credential found in public repo, logs, or error output. Or: unauthorized API access detected.

**Immediate actions (< 5 min):**
1. **Rotate the exposed credential immediately.** Do not investigate first — rotate, then investigate.
   - Stripe: rotate API keys in Stripe dashboard, update `STRIPE_SECRET_KEY` in Render.
   - Database: change PostgreSQL password in Render, update connection strings.
   - R2: rotate API token in Cloudflare, update in Render.
   - Sentry: rotate DSN (less critical but do it).
2. Redeploy all services with new credentials.
3. Review access logs for the exposed credential: was it used by an unauthorized party?

**Investigation:**
1. How was the credential exposed? (Committed to git, logged in error, leaked in API response?)
2. Was any data accessed or modified using the exposed credential?
3. Scope of potential data exposure: PII, financial, behavioral?

**Legal obligations:**
1. If PII was accessed: notify affected users within 72 hours (GDPR), or per state law (California: "expedient").
2. If financial data was accessed: notify Stripe, review PCI DSS obligations.
3. Document everything in the incident log.

## Escalation Path

Styx is a solo-founder operation. Escalation means expanding the response circle:

| Level | Who | When |
|-------|-----|------|
| L0 | Founder (you) | All incidents |
| L1 | Stripe support | Any payment/escrow incident |
| L2 | Render support | Infrastructure incidents |
| L3 | Cloudflare support | R2/CDN incidents |
| L4 | Legal counsel | Data breach, compliance questions |
| L5 | Law enforcement | Criminal unauthorized access |

## Communication Plan

### Internal (Solo Founder)

- Incident log: create a file `incidents/YYYY-MM-DD-{slug}.md` immediately
- Time-stamp every action taken
- Screenshot relevant dashboards, error messages, logs

### External (Users)

| Severity | Channel | Timing | Template |
|----------|---------|--------|----------|
| SEV1 | Email + in-app banner | Within 1 hour | "We have identified an issue affecting [financial processing / account security]. We have paused affected operations and are actively resolving. Your funds are secure in Stripe escrow." |
| SEV2 | In-app banner | Within 2 hours | "Some features are temporarily unavailable. We are working on restoration." |
| SEV3 | Status page update | Within 4 hours | "Performance may be degraded. We are investigating." |
| SEV4 | No external communication | — | Fix and ship |

### Status Page

Maintain a simple status page (e.g., Instatus free tier, or a static page on the marketing site) with components:
- API
- Web Dashboard
- Fury Audit Network
- Payment Processing
- Proof Storage

## Post-Incident Review

### Blameless Postmortem Template

```markdown
# Incident: [Title]
**Date:** YYYY-MM-DD
**Severity:** SEV[1-4]
**Duration:** [start time] to [resolution time]
**Impact:** [users affected, financial impact, data exposure]

## Timeline
- HH:MM — [event]
- HH:MM — [action taken]
- HH:MM — [resolution]

## Root Cause
[What actually caused the incident. Be specific.]

## Contributing Factors
- [Factor 1]
- [Factor 2]

## What Went Well
- [Thing 1]
- [Thing 2]

## What Went Poorly
- [Thing 1]
- [Thing 2]

## Action Items
- [ ] [Action] — Owner: [name] — Due: [date]
- [ ] [Action] — Owner: [name] — Due: [date]

## Lessons Learned
[What changes to make so this class of incident cannot recur.]
```

### Review Cadence

- SEV1: postmortem within 24 hours of resolution
- SEV2: postmortem within 72 hours
- SEV3: postmortem within 1 week
- SEV4: batch review monthly

### Action Item Tracking

Action items from postmortems go into the project's GitHub Issues with the `incident-action` label. Each action item must have:
- A clear definition of done
- A due date
- A verification method (how do we know it is fixed?)

## Prevention Measures

| Measure | Status | Description |
|---------|--------|-------------|
| Continuous ledger reconciliation | Active | Debits == credits checked on every write |
| Stripe webhook signature verification | Active | All webhooks verified with signing secret |
| Rate limiting | Active | API rate limits on all endpoints |
| Geofencing | Active | Configurable geographic restrictions |
| Honeypot endpoints | Active | Intelligence service detects probing |
| pHash anomaly detection | Active | Proof media tamper detection |
| Database connection pooling | Active | Prevents connection exhaustion |
| Health endpoint monitoring | Active | /health returns system status |
| Secret scanning (GitHub) | Active | Prevents credential commits |
| Dependency vulnerability scanning | Active | Dependabot + `npm audit` |
