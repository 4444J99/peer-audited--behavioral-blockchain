---
generated: true
department: OPS
artifact_id: O3
governing_sop: "SOP--monitoring-and-alerting.md"
phase: hardening
product: styx
date: "2026-03-08"
---

# Monitoring Setup — Styx

## Overview

Styx monitoring covers three layers: application errors (Sentry), infrastructure metrics (Render), and business metrics (custom dashboards). Because Styx handles financial escrow and behavioral/health data, monitoring must detect anomalies that go beyond typical uptime concerns — ledger imbalances, Fury queue stalls, and escrow reconciliation drift are critical business signals, not just operational ones.

## Application Monitoring

### Sentry Error Tracking

**Configuration:**
- DSN: stored in `SENTRY_DSN` environment variable on Render
- SDK: `@sentry/nestjs` (API), `@sentry/nextjs` (Web)
- Environment tagging: `production`, `staging`, `beta`
- Release tagging: matches git tag (e.g., `v1.2.3`)

**Capture Policy:**

| Error Type | Capture | Alert | Notes |
|-----------|---------|-------|-------|
| Unhandled exceptions | Always | Immediate | Sentry auto-captures |
| Ledger write failures | Always | Immediate (SEV1) | Custom breadcrumb: ledger entry details |
| Stripe webhook errors | Always | Immediate (SEV2) | Include webhook event ID |
| Fury audit failures | Always | Batched (1h) | High volume during normal operation |
| Validation errors (user input) | Sample 10% | None | Noise reduction |
| 404 responses | Never | None | Expected traffic from bots |

**Sentry Configuration (NestJS):**

```typescript
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  release: process.env.RENDER_GIT_COMMIT,
  tracesSampleRate: 0.1,        // 10% of transactions
  profilesSampleRate: 0.05,     // 5% of profiled transactions
  beforeSend(event) {
    // Strip PII from error reports
    if (event.request?.data) {
      delete event.request.data.email;
      delete event.request.data.password;
      delete event.request.data.name;
    }
    return event;
  },
});
```

**Alert Rules (Sentry):**

| Rule | Condition | Action |
|------|-----------|--------|
| High error rate | > 50 errors in 5 min | Email + Slack notification |
| New issue in Ledger service | Any new issue tagged `ledger` | Immediate email |
| New issue in Escrow service | Any new issue tagged `escrow` | Immediate email |
| Regression | Previously resolved issue recurs | Email notification |

### Structured Logging (Pino)

**Logger Configuration:**

All services use pino with structured JSON output:

```typescript
{
  level: process.env.LOG_LEVEL || 'info',
  transport: process.env.NODE_ENV === 'development'
    ? { target: 'pino-pretty' }
    : undefined,
  redact: ['req.headers.authorization', 'req.body.password', 'req.body.email'],
}
```

**Log Levels by Context:**

| Context | Level | What Gets Logged |
|---------|-------|-----------------|
| Ledger operations | `info` | Every debit/credit entry, reconciliation results |
| Escrow operations | `info` | Stripe API calls, webhook events, capture/refund |
| Fury routing | `info` | Job enqueue, assignment, completion, bounty |
| Authentication | `warn` | Failed login attempts, token refresh failures |
| API requests | `info` | Method, path, status, duration (via pino-http) |
| Database queries | `debug` | Only in development; query text + duration |
| Health checks | `debug` | Suppressed in production to reduce noise |

**Log Aggregation:**

Pino writes to stdout. Render captures stdout and provides:
- Real-time log tailing in dashboard
- Log search (last 7 days on Starter plan)
- Log drain to external service (if needed): Datadog, Papertrail, or Logtail

For the Starter plan, Render's built-in log viewer is sufficient. When scaling to Standard+, configure a log drain for longer retention and cross-service querying.

## Infrastructure Monitoring

### Render Metrics (Built-In)

Render provides per-service metrics on Standard+ plans. On Starter plans, monitoring is limited to deploy logs and health checks.

| Metric | Service | Threshold (Warning) | Threshold (Critical) |
|--------|---------|--------------------|--------------------|
| CPU usage | API | > 70% sustained 5 min | > 90% sustained 2 min |
| Memory usage | API | > 80% | > 95% |
| Response time (p50) | API | > 500ms | > 1s |
| Response time (p99) | API | > 1s | > 2s |
| Request rate | API | > 1000 req/min | > 5000 req/min |
| CPU usage | Web | > 60% sustained 5 min | > 80% sustained 2 min |
| Memory usage | Web | > 70% | > 90% |

### PostgreSQL Monitoring

| Metric | Check Method | Warning | Critical |
|--------|-------------|---------|----------|
| Connection count | `SELECT count(*) FROM pg_stat_activity` | > 40 (of 50 limit) | > 48 |
| Database size | `SELECT pg_database_size('styx')` | > 800MB (of 1GB) | > 950MB |
| Longest query | `SELECT max(now() - query_start) FROM pg_stat_activity WHERE state = 'active'` | > 10s | > 30s |
| Dead tuples | `SELECT n_dead_tup FROM pg_stat_user_tables` | > 10K per table | > 50K per table |
| Replication lag | Render dashboard | > 1s | > 10s |

### Redis Monitoring

| Metric | Check Method | Warning | Critical |
|--------|-------------|---------|----------|
| Memory usage | `INFO memory` → `used_memory` | > 20MB (of 25MB free tier) | > 24MB |
| Connected clients | `INFO clients` → `connected_clients` | > 50 | > 90 |
| Queue depth (Fury) | `LLEN bull:fury:wait` | > 500 | > 1000 |
| Active jobs (Fury) | `LLEN bull:fury:active` | > 50 | > 100 |
| Failed jobs (Fury) | `LLEN bull:fury:failed` | > 10 | > 50 |
| Evicted keys | `INFO stats` → `evicted_keys` | > 0 | > 100 |

## Business Metrics Dashboards

### Contract Metrics

| Metric | Calculation | Update Frequency | Alert Condition |
|--------|------------|-----------------|----------------|
| Contracts created (daily) | `COUNT(*) WHERE created_at > NOW() - INTERVAL '24h'` | Hourly | Drop > 50% from 7-day avg |
| Contracts completed (daily) | `COUNT(*) WHERE status = 'completed' AND updated_at > NOW() - INTERVAL '24h'` | Hourly | — |
| Completion rate (7-day rolling) | Completed / (Completed + Forfeited) | Daily | Drop below 50% |
| Average stake amount | `AVG(stake_amount)` | Daily | — |
| Active contracts | `COUNT(*) WHERE status = 'active'` | Hourly | — |

### Fury Network Metrics

| Metric | Calculation | Update Frequency | Alert Condition |
|--------|------------|-----------------|----------------|
| Queue depth | BullMQ waiting count | Every 5 min | > 1000 |
| Avg audit duration | Time from enqueue to completion | Daily | > 36 hours |
| Auditor accuracy (30-day) | Correct audits / total audits per auditor | Daily | Any auditor < 85% (auto-suspend) |
| Active auditors | Distinct auditors with audit in last 7 days | Daily | < 5 |
| Bounty pool balance | Sum of unallocated bounty funds | Daily | < $100 |

### Financial Metrics

| Metric | Calculation | Update Frequency | Alert Condition |
|--------|------------|-----------------|----------------|
| Escrow balance | Sum of all active escrow holds | Real-time (on ledger write) | Divergence from Stripe > $0.01 |
| Ledger balance | Total debits - total credits | Real-time (on ledger write) | != $0.00 (SEV1) |
| Daily revenue (platform fees) | Sum of platform fee ledger entries | Daily | — |
| Stripe payout balance | Stripe API balance check | Daily | Unexpected negative |
| Refund rate | Refunds / total captures | Weekly | > 5% |

### B2B Metrics

| Metric | Calculation | Update Frequency |
|--------|------------|-----------------|
| Active practitioners | `COUNT(*) WHERE subscription_status = 'active'` | Daily |
| Client utilization | Avg(active_clients / client_limit) per tier | Weekly |
| MRR (B2B) | Sum of active subscription amounts | Monthly |
| Churn rate (B2B) | Cancellations / active subs (monthly) | Monthly |

## Alerting Rules

### Critical Alerts (Immediate Notification)

| Alert | Condition | Channel | Response |
|-------|-----------|---------|----------|
| Ledger imbalance | `debits != credits` | Email + SMS | Freeze ledger, investigate (SEV1) |
| Escrow reconciliation drift | Styx escrow != Stripe balance | Email + SMS | Freeze escrow, reconcile (SEV1) |
| API down | Health check fails 3 consecutive times | Email | Check Render, redeploy if needed (SEV2) |
| Error rate spike | > 1% of requests return 5xx in 5 min | Email | Check Sentry, investigate root cause |
| Database near capacity | > 950MB of 1GB | Email | Upgrade plan or archive data |

### Warning Alerts (Batched, Hourly)

| Alert | Condition | Channel |
|-------|-----------|---------|
| Fury queue depth | > 500 waiting jobs | Email (hourly digest) |
| API response time | p99 > 2s for 15 min | Email |
| Redis memory | > 80% capacity | Email |
| Failed Fury audits | > 10 failed jobs in 1 hour | Email |
| Stripe webhook delivery failures | > 5 failures in 1 hour | Email |

### Informational (Daily Digest)

| Alert | Condition | Channel |
|-------|-----------|---------|
| Daily contract summary | Auto-generated | Email (daily at 09:00 UTC) |
| Weekly financial summary | Auto-generated | Email (Monday 09:00 UTC) |
| Auditor accuracy report | Weekly | Email (Monday 09:00 UTC) |

## Health Endpoints

### API Health (`GET /health`)

Returns JSON with component-level health:

```json
{
  "status": "healthy",
  "timestamp": "2026-03-08T12:00:00Z",
  "version": "1.2.3",
  "components": {
    "database": { "status": "healthy", "latency_ms": 3 },
    "redis": { "status": "healthy", "latency_ms": 1 },
    "stripe": { "status": "healthy" },
    "r2": { "status": "healthy" },
    "fury": { "status": "healthy", "queue_depth": 12, "active_workers": 5 },
    "ledger": { "status": "balanced", "last_reconcile": "2026-03-08T11:59:45Z" }
  }
}
```

**Health check states:**
- `healthy`: all components operational
- `degraded`: non-critical component down (R2, analytics)
- `unhealthy`: critical component down (database, Redis, Stripe, ledger imbalanced)

Render uses this endpoint for deploy health checks. If `/health` returns non-200, Render rolls back the deploy.

### Web Health (`GET /`)

The web service root returns the dashboard. A 200 response confirms the Next.js server is running. Render checks this for web service health.

## Uptime Monitoring

### External Monitoring (UptimeRobot or Similar)

| Monitor | URL | Interval | Alert After |
|---------|-----|----------|-------------|
| API Health | `https://api.styx.app/health` | 5 min | 2 failures |
| Web Dashboard | `https://styx.app/` | 5 min | 2 failures |
| API Ping | `https://api.styx.app/` | 1 min | 3 failures |

### Synthetic Checks

Weekly synthetic transaction test:

1. Create a test contract (Stripe test mode)
2. Verify escrow hold created
3. Submit a test proof
4. Route to Fury queue
5. Complete audit
6. Verify contract completion and stake refund
7. Verify ledger balanced

This end-to-end synthetic check validates the entire contract lifecycle. Run manually pre-launch; automate when infrastructure supports it.

## Dashboard Access

| Dashboard | URL | Purpose |
|-----------|-----|---------|
| Render | `dashboard.render.com` | Infrastructure metrics, deploy logs |
| Sentry | `sentry.io` | Error tracking, performance monitoring |
| Stripe | `dashboard.stripe.com` | Payment metrics, webhook status |
| Cloudflare | `dash.cloudflare.com` | R2 storage metrics, WAF events |
| UptimeRobot | `uptimerobot.com` | External uptime monitoring |
| Styx Admin | `https://api.styx.app/admin` | Business metrics (authenticated) |

## Monitoring Scaling Plan

| User Count | Monitoring Changes |
|-----------|-------------------|
| 0-500 | Sentry free, Render built-in, UptimeRobot free (50 monitors) |
| 500-2K | Sentry Team ($26/mo), Render Standard metrics, add Logtail log drain |
| 2K-10K | Sentry Business, Grafana Cloud free tier for custom dashboards, PagerDuty free |
| 10K+ | Datadog or Grafana Cloud paid, dedicated alerting pipeline, on-call rotation |
