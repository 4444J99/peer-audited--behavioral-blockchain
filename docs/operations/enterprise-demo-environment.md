# Enterprise Demo Environment — Sandboxed Render Instance
> Issue: #361
> Phase: Pre-Launch (B2B Sales Ready)

## Overview

Enterprise prospects (rehab centers, coaching practices, corporate wellness programs) need a sandboxed Styx instance to evaluate before purchasing. The demo environment must be isolated from production data, seeded with realistic demo data, accessible only to authorized prospects, and tear-downable without trace. This doc covers infrastructure requirements, data isolation, demo data seeding, access controls, and teardown procedures.

## Infrastructure Requirements

### Architecture

```
Cloudflare WAF
    │
    ├── *.demo.styx.app ────┐
    │                         │
    ├── Render Blueprint ────┤
    │   ├── styx-demo-api    │  (NestJS, dedicated service)
    │   ├── styx-demo-web    │  (Next.js, dedicated service)
    │   ├── styx-demo-pg     │  (PostgreSQL, dedicated instance)
    │   └── styx-demo-redis  │  (Redis, dedicated instance)
    │                         │
    └── Deploy: GitHub Actions workflow (manual dispatch)
```

### Service Specifications

| Service | Plan | Spec | Monthly Cost |
|---------|------|------|-------------|
| `styx-demo-api` | Render Starter | 512 MB RAM, 0.1 CPU | $7/mo |
| `styx-demo-web` | Render Starter | 512 MB RAM, 0.1 CPU | $7/mo |
| `styx-demo-postgres` | Render Starter | 1 GB RAM, 1 GB storage | $7/mo |
| `styx-demo-redis` | Render Free | 25 MB | $0/mo |
| Cloudflare WAF rule | Free | Rate limiting, IP allowlist | $0/mo |
| **Total per instance** | | | **~$21/mo** |

### Environment Variables

| Variable | Demo Value | Production Value |
|----------|------------|-----------------|
| `NODE_ENV` | `demo` | `production` |
| `STRIPE_MODE` | `test` | `live` |
| `KYC_ENFORCEMENT_ENABLED` | `false` | `true` |
| `GEOFENCE_ENABLED` | `false` | `true` |
| `DEMO_MODE` | `true` | `false` |
| `SEED_DATA_ENABLED` | `true` | `false` |
| `API_URL` | `https://api-demo-{id}.styx.app` | `https://api.styx.app` |
| `WEB_URL` | `https://demo-{id}.styx.app` | `https://styx.app` |

### Subdomain Convention

```
demo-{prospect-slug}.styx.app      → Web UI
api-demo-{prospect-slug}.styx.app  → API endpoint
```

## Data Isolation

### Isolation Principles

1. **Separate database:** Each demo environment gets its own PostgreSQL instance
2. **Separate Redis:** Each demo environment gets its own Redis instance
3. **Separate Stripe account:** All demo environments use Stripe test mode (shared test keys are fine — test mode has no real money)
4. **No production data access:** Demo API never reads from production databases
5. **No network access between demo instances:** Each demo environment is network-isolated
6. **R2 bucket isolation:** Demo proof uploads go to a separate R2 bucket (`styx-demo-proofs`)

### Data That Must Be Isolated

| Data Type | Isolation Method | Cross-Instance Visibility |
|-----------|-----------------|--------------------------|
| User accounts | Per-database | Zero |
| Contracts | Per-database | Zero |
| Ledger entries | Per-database | Zero |
| Proof submissions | Per-database + separate R2 bucket | Zero |
| Fury audit verdicts | Per-database | Zero |
| Practitioner profiles | Per-database | Zero |
| Session data | Per-Redis | Zero |

## Demo Data Seeding

### Seed Script

**Location:** `scripts/seed-demo-data.ts`
**Run via:** Render deploy hook (after migration, before first request)

### Seeded Data

| Entity | Count | Details |
|--------|-------|---------|
| Demo users | 5 | 3 consumers, 1 practitioner, 1 Fury auditor |
| Contracts | 8 | Mix of statuses (pending, in_progress, completed, failed) |
| Ledger entries | 20 | Realistic transaction history |
| Fury audits | 6 | Mix of verified, flagged, and pending audits |
| Proof submissions | 6 | Sample image/video files (stored in R2 demo bucket) |
| Practitioner dashboard | 1 | Pre-populated with 5 client contracts |

### Demo User Accounts

| User | Role | Email | Password | Purpose |
|------|------|-------|----------|---------|
| Alex Consumer | Consumer | `alex@demo.styx` | `demo123` | Show consumer flow |
| Jordan Consumer | Consumer (high-completion) | `jordan@demo.styx` | `demo123` | Show success stories |
| Sam Practitioner | Practitioner (Solo) | `sam@demo.styx` | `demo123` | Show practitioner dashboard |
| Casey Practitioner | Practitioner (Practice) | `casey@demo.styx` | `demo123` | Show advanced features |
| Riley Fury | Fury Auditor | `riley@demo.styx` | `demo123` | Show Fury queue |

### Seeded Contracts

| ID | User | Type | Status | Stake | Created | Outcome |
|----|------|------|--------|-------|---------|---------|
| C001 | Alex | Recovery (no-contact) | `completed` | $39 | 7 days ago | Completed on time |
| C002 | Alex | Biological (exercise) | `in_progress` | $39 | 3 days ago | 3 of 7 proofs submitted |
| C003 | Alex | Cognitive (reading) | `failed` | $39 | 10 days ago | Missed proof deadline |
| C004 | Jordan | Biological (sleep) | `completed` | $29 | 14 days ago | 14-day streak completed |
| C005 | Jordan | Fitness verified | `completed` | $49 | 21 days ago | Wearable data validated |
| C006 | Sam-Practitioner | Recovery (assigned to "Client A") | `completed` | $39 | 5 days ago | Practitioner-assigned |
| C007 | Sam-Practitioner | Professional (assigned to "Client B") | `in_progress` | $99 | 1 day ago | Practice account |
| C008 | Casey-Practitioner | Custom (assigned to "Client C") | `pending` | $199 | Today | Upcoming contract |

### Seed Data Freshness

| Data | Refresh Strategy | Tool |
|------|-----------------|------|
| Demo user accounts | Every deploy (reset passwords) | Seed script |
| Contracts | Every deploy (new randomized data) | Seed script |
| Proof submissions | Every deploy (new sample files) | Seed script |
| Ledger entries | Every deploy (rebuilt from contract data) | Seed script |
| Fury audits | Keep 3 as-is, re-run 3 on deploy | Seed script |

## Access Controls

### Authentication

| Layer | Method | Details |
|-------|--------|---------|
| App login | Email + password (demo accounts only) | Pre-seeded accounts, no sign-up |
| Cloudflare WAF | IP allowlist + rate limiting | Restrict to prospect's IP range if known |
| Basic auth (gate) | `nginx` htpasswd or Cloudflare Access | Optional additional layer for sensitive prospects |
| Session timeout | 60 minutes inactivity | Auto-logout for shared demo machines |

### Authorization Matrix

| Role | Dashboard Access | Contract Creation | Fury Audit | Settings |
|------|-----------------|-------------------|------------|----------|
| Demo consumer | Own contracts only | Create test contracts | N/A | Limited |
| Demo practitioner | Assigned client contracts | Assign contracts | N/A | Full demo settings |
| Demo Fury | Audit queue | N/A | Submit verdicts | Limited |

### WAF Rules

| Rule | Scope | Action |
|------|-------|--------|
| Rate limiting | All `/api/*` endpoints | 100 req/min per IP, 429 after |
| Block known bad IPs | All | 403 |
| Allow specific IPs | Optional (enterprise prospects) | Allow if configured |
| Geographic restriction | All | US-only (matching production) |

### Access Grant Process

```
1. Sales call booked → prospect qualifies for demo
2. Create demo environment → provision via workflow
3. Generate unique subdomain → `demo-{prospect-slug}.styx.app`
4. Configure IP allowlist (if prospect provides range)
5. Send credentials → email to prospect + sales rep
6. Schedule demo walkthrough → 30-min guided tour
7. After demo → retain for 7 days (follow-up window)
8. Teardown → 30 days after last contact
```

## Teardown Procedures

### Automatic Teardown

**Trigger:** 30 days since last login OR 7 days after deal lost/closed.

**Automated process (GitHub Actions):**

```
1. Extract demo service IDs from Render dashboard → API
2. Delete Render web services (API + Web)
3. Delete managed PostgreSQL database
4. Delete Redis instance
5. Clear R2 demo bucket objects
6. Remove Cloudflare DNS records
7. Notify sales rep: "Demo environment for {prospect} torn down"
8. Archive demo config (JSON) in R2 audit bucket
```

### Manual Teardown

```bash
# Via Render Dashboard
1. Go to Render dashboard → Select demo services
2. Stop `styx-demo-api` and `styx-demo-web` (confirm)
3. Delete services (this also deletes attached PG + Redis)
4. Go to Cloudflare DNS → Remove `demo-{slug}` records
5. Verify no data remains: check R2 demo bucket is empty

# Via CLI (if scripted)
./scripts/teardown-demo.sh --slug {prospect-slug} --confirm
```

### Teardown Checklist (Per Instance)

| Item | Action | Verification |
|------|--------|-------------|
| API service | Delete from Render | Gone from dashboard |
| Web service | Delete from Render | Gone from dashboard |
| PostgreSQL | Delete (auto-deletes with service) | Can't connect |
| Redis | Delete (auto-deletes with service) | Can't connect |
| DNS records | Remove A/CNAME records | `dig demo-{slug}.styx.app` = NXDOMAIN |
| R2 proof files | Delete bucket objects | Bucket empty or removed |
| Stripe test data | No action needed (test mode keys) | — |
| Prospect contact data | Retain in CRM only | CRM note: "Demo environment removed" |

## Provisioning Workflow

### GitHub Actions Workflow

**Trigger:** Manual dispatch with parameters:

```yaml
inputs:
  prospect_slug:
    description: "Unique identifier for the prospect"
    required: true
  prospect_name:
    description: "Company or individual name"
    required: true
  ip_allowlist:
    description: "Comma-separated IP ranges (optional)"
    required: false
  retention_days:
    description: "Days before auto-teardown"
    default: "30"
    required: false
```

**Steps:**
1. Validate inputs (slug is alphanumeric, IPs are valid CIDR)
2. Deploy API to Render with demo env vars
3. Deploy Web to Render with demo env vars
4. Run seed script post-deploy
5. Configure Cloudflare DNS (create subdomain)
6. Configure Cloudflare WAF (IP allowlist if provided)
7. Send credentials to configured email
8. Schedule teardown cron job (Render cron)
9. Log: "Demo {slug} provisioned — accessible at https://demo-{slug}.styx.app"

## Monitoring & Costs

### Cost Per Instance

| Item | Cost |
|------|------|
| Render API + Web Starter | $14/mo |
| Render PostgreSQL Starter | $7/mo |
| Render Redis Free | $0/mo |
| Cloudflare WAF (free tier) | $0/mo |
| R2 storage (negligible) | ~$0.01/mo |
| **Total** | **~$21/mo per instance** |

### Monitoring

| Metric | Check | Alert |
|--------|-------|-------|
| Instance uptime | Render dashboard | If service goes down > 5 min |
| Last login date | DB query | If > 7 days, send reminder; > 30 days, auto-teardown |
| Storage used | Render PG dashboard | If > 80% of 1 GB |
| Cost accrual | Render billing | If > 5 instances running concurrently |
| Teardown completeness | Weekly audit | If any abandoned instances found |

### Concurrent Instance Limit

| Phase | Max Concurrent Demos | Rationale |
|-------|---------------------|-----------|
| Pre-launch | 2 | Limited sales pipeline |
| Post-launch (month 1-3) | 5 | Growing B2B interest |
| Post-launch (month 4+) | 10 | Active B2B sales motion |
| Hard limit | 15 | Budget constraint ($315/mo max) |

## Troubleshooting

| Issue | Likely Cause | Fix |
|-------|-------------|-----|
| Demo pages not loading | DNS propagation delay | Wait 5 min, check Render logs |
| Seed data not appearing | Seed script failed | Re-run seed script manually |
| Payment flow errors | Stripe test mode keys misconfigured | Check `STRIPE_MODE=test` |
| User can't log in | Demo accounts not seeded | Re-run seed script |
| Slow page loads | Render starter plan cold start | Expected; first request after idle takes 10-30s |
| Cross-instance data leak | Database URL misconfigured | Verify instance uses its own PG |
