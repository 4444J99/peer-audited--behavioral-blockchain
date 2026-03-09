---
generated: true
department: OPS
artifact_id: O2
governing_sop: "SOP--deployment-procedures.md"
phase: foundation
product: styx
date: "2026-03-08"
---

# Deployment Procedure — Styx

## Overview

Styx deploys to Render (Oregon region) via tag-triggered GitHub Actions workflows. The pipeline: local development → CI tests → git tag → deploy workflow → Render services → smoke tests. This document covers the full deployment lifecycle, pre-deploy checks, rollback procedures, and environment management.

## Architecture

### Deployment Targets

| Service | Render Service | Port | Type |
|---------|---------------|------|------|
| styx-api | `styx-api` | 3000 | Web Service (NestJS 11) |
| styx-web | `styx-web` | 3001 | Web Service (Next.js 16) |
| styx-postgres | `styx-postgres` | 5432 | Managed PostgreSQL 15 |
| styx-redis | `styx-redis` | 6379 | Managed Redis 7 |

### Deploy Flow

```
Developer
    │
    ├── git push origin main          ─── triggers CI (test + lint + validate)
    │
    ├── git tag v1.2.3 && git push --tags  ─── triggers deploy workflow
    │
    └── GitHub Actions (deploy.yml)
            │
            ├── Run full test suite (499+ tests)
            ├── Run 8 validation gates
            ├── Build Docker images
            ├── Push to Render via deploy hook
            │
            └── Render
                    ├── Pull image
                    ├── Run health check
                    ├── If healthy → route traffic
                    └── If unhealthy → auto-rollback
```

## GitHub Actions Workflows

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| `ci.yml` | Push to main, PRs | Tests, lint, type-check |
| `deploy.yml` | Tag `v*` | Full deploy pipeline |
| `beta-promotion.yml` | Manual dispatch | Promote to beta environment |
| `staging-promotion.yml` | Manual dispatch | Promote to staging |
| `security-scan.yml` | Weekly + PR | Dependency vulnerability scan |
| `e2e.yml` | Deploy completion | Playwright end-to-end tests |
| `validate-gates.yml` | PR | Run 8 validation gates |

## Pre-Deploy Checklist

Complete every item before creating a release tag:

### Code Quality

- [ ] All tests pass: `npm run test` across all packages
- [ ] Lint clean: `npm run lint` (ESLint + Prettier)
- [ ] Type-check clean: `npm run typecheck` (TypeScript strict mode)
- [ ] No `console.log` in production code (use pino structured logging)

### Validation Gates (8 gates)

Run the full gate suite:

```bash
npm run validate:all
```

Individual gates:

| Gate | Command | What It Checks |
|------|---------|---------------|
| 1. Unit Tests | `npm run test` | 499+ tests pass |
| 2. Lint | `npm run lint` | No lint errors |
| 3. Type Safety | `npm run typecheck` | No TypeScript errors |
| 4. Security | `npm audit --audit-level=high` | No high/critical vulns |
| 5. Ledger Integrity | `npm run validate:ledger` | Double-entry reconciliation |
| 6. API Readiness | `npm run validate:api` | All endpoints respond correctly |
| 7. E2E | `npm run test:e2e` | Playwright scenarios pass |
| 8. Performance | `npm run validate:perf` | Response times within SLA |

### Financial Safety

- [ ] Ledger reconciliation passes (debits == credits)
- [ ] No phantom money detected
- [ ] Stripe webhook endpoint URL unchanged (or updated in Stripe dashboard)
- [ ] Escrow state consistent with Stripe dashboard

### Infrastructure

- [ ] Database migrations tested locally: `cd src/api && npm run migrate`
- [ ] No breaking schema changes without migration
- [ ] Environment variables verified (see Environment Variables section)
- [ ] Render health check endpoint responds (`/health`)

## Deployment Steps

### 1. Create Release Tag

```bash
# Ensure main is up to date
git checkout main
git pull origin main

# Create annotated tag
git tag -a v1.2.3 -m "Release v1.2.3: brief description of changes"

# Push tag to trigger deploy workflow
git push origin v1.2.3
```

### 2. Monitor Deploy Workflow

1. Go to GitHub Actions → `deploy.yml` → watch the triggered run.
2. Stages to monitor:
   - **Test:** All 499+ tests pass
   - **Validate:** 8 gates green
   - **Build:** Docker images built successfully
   - **Deploy:** Render deploy hooks triggered

### 3. Verify Deployment

After Render reports the deploy is live:

```bash
# API health check
./scripts/check-api-ready.sh

# Web health check
./scripts/check-web.sh

# Full endpoint smoke test
./scripts/check-endpoints.sh

# Beta readiness (comprehensive)
./scripts/beta-readiness.sh
```

### 4. Post-Deploy Smoke Tests

| Check | Command/URL | Expected |
|-------|------------|----------|
| API health | `GET /health` | 200 + JSON with service statuses |
| Web root | `GET /` | 200 + HTML |
| Ledger reconciliation | `GET /api/admin/reconcile` | `{ balanced: true }` |
| Fury queue | `GET /api/admin/fury/status` | Queue depth reported, workers active |
| Stripe connectivity | `GET /api/admin/stripe/status` | Connected, webhook secret valid |

## Database Migrations

### Running Migrations

```bash
# Local development
cd src/api
npm run migrate

# Production (via Render shell or pre-deploy command)
# Render's pre-deploy command in render.yaml handles this automatically
```

### Migration Safety Rules

1. **Never drop columns in production.** Add new columns, migrate data, then drop old columns in a subsequent release.
2. **Always add columns as nullable** or with a default value. `NOT NULL` without default will fail on existing rows.
3. **Test migrations against a copy of production data** before deploying. Use Render's database fork feature.
4. **Ledger table migrations are SEV1-level changes.** Any modification to `ledger_entries`, `escrow_records`, or `audit_records` requires extra review and a reconciliation check post-migration.

### Rollback a Migration

```bash
# Revert the last migration
cd src/api
npm run migrate:revert

# Revert to a specific migration
npm run migrate:revert -- --to <migration-name>
```

## Render Blueprint (render.yaml)

The `render.yaml` defines the infrastructure:

| Service | Plan | Region | Auto-Deploy |
|---------|------|--------|-------------|
| styx-api | Starter ($7/mo) | Oregon | From `main` branch |
| styx-web | Starter ($7/mo) | Oregon | From `main` branch |
| styx-postgres | Starter ($7/mo) | Oregon | Managed |
| styx-redis | Free | Oregon | Managed |

### Key Configuration

- **Health check path (API):** `/health`
- **Health check path (Web):** `/`
- **Build command (API):** `npm install && npm run build`
- **Start command (API):** `node dist/main.js`
- **Build command (Web):** `npm install && npm run build`
- **Start command (Web):** `npm start`
- **Pre-deploy command:** `npm run migrate` (runs before new version receives traffic)

## Rollback Procedure

### Automatic Rollback (Render)

Render automatically rolls back if the health check fails after deploy. The previous version continues serving traffic. No action needed — monitor the deploy log for "Health check failed, rolling back."

### Manual Rollback

If a deployed version passes health checks but has a runtime issue:

```bash
# Option 1: Redeploy previous tag
git checkout v1.2.2
# Trigger manual deploy in Render dashboard, or:
curl -X POST https://api.render.com/deploy/srv-xxxxx?key=yyyyy

# Option 2: Revert commit and push
git revert HEAD
git push origin main
# Render auto-deploys from main
```

### Database Rollback

If a migration introduced a bug:

1. Revert the migration: `npm run migrate:revert`
2. Redeploy the previous application version
3. Verify ledger reconciliation after rollback

**Warning:** If the migration was destructive (dropped data), a full database restore from backup is required. See `docs/operations/backup-recovery.md`.

## Environment Variables

### Required Secrets (Render Dashboard)

| Variable | Service | Description |
|----------|---------|-------------|
| `DATABASE_URL` | API | PostgreSQL connection string (Render provides automatically) |
| `REDIS_URL` | API | Redis connection string (Render provides automatically) |
| `STRIPE_SECRET_KEY` | API | Stripe API secret key |
| `STRIPE_WEBHOOK_SECRET` | API | Stripe webhook signing secret |
| `STRIPE_PUBLISHABLE_KEY` | Web | Stripe publishable key (client-safe) |
| `R2_ACCESS_KEY_ID` | API | Cloudflare R2 access key |
| `R2_SECRET_ACCESS_KEY` | API | Cloudflare R2 secret key |
| `R2_BUCKET_NAME` | API | R2 bucket name for proof storage |
| `R2_ENDPOINT` | API | R2 S3-compatible endpoint URL |
| `SENTRY_DSN` | API, Web | Sentry error tracking DSN |
| `JWT_SECRET` | API | JWT signing secret (min 256-bit) |
| `SESSION_SECRET` | Web | Session cookie secret |
| `NODE_ENV` | API, Web | `production` |

### Non-Secret Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 3000 (API), 3001 (Web) | Service port |
| `LOG_LEVEL` | `info` | Pino log level |
| `FURY_QUEUE_CONCURRENCY` | 5 | BullMQ worker concurrency |
| `FURY_AUDIT_TIMEOUT_MS` | 172800000 | 48 hours (audit window) |
| `LEDGER_RECONCILE_ON_WRITE` | `true` | Check balance on every ledger write |
| `GEOFENCE_ENABLED` | `false` | Geographic restriction toggle |

## Environments

### Local Development

```bash
docker-compose up -d    # PostgreSQL + Redis
npm run dev             # API + Web in dev mode
```

Docker Compose services: `styx-api`, `styx-web`, `styx-postgres` (5432), `styx-redis` (6379).

### Beta

- Triggered by `beta-promotion.yml` workflow (manual dispatch)
- Uses Render preview environment or separate beta services
- Connected to a separate database (forked from production)
- Stripe test mode keys

### Staging

- Triggered by `staging-promotion.yml` workflow (manual dispatch)
- Mirror of production configuration
- Connected to staging database
- Stripe test mode keys
- Used for final verification before production tag

### Production

- Triggered by `v*` tag push
- Connected to production database
- Stripe live mode keys
- All monitoring and alerting active

## Deploy Cadence

| Type | Frequency | Process |
|------|-----------|---------|
| Hotfix (SEV1/2) | As needed | Branch from tag, fix, new patch tag (v1.2.4) |
| Patch release | Weekly | Batch small fixes, create patch tag |
| Minor release | Bi-weekly | New features, create minor tag (v1.3.0) |
| Major release | Monthly+ | Breaking changes, migration required, create major tag (v2.0.0) |

## Troubleshooting

| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| Deploy stuck at "Building" | OOM during build | Reduce build parallelism, or upgrade Render plan |
| Health check fails post-deploy | Missing env var or bad migration | Check Render logs, verify env vars |
| 502 after deploy | App crashed on start | Check Sentry, Render logs for startup error |
| Slow first request | Render starter plan cold start | Expected behavior — first request after sleep takes 10-30s |
| Database connection refused | Connection string changed | Verify `DATABASE_URL` in Render dashboard |
