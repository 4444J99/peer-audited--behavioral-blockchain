---
generated: true
department: OPS
artifact_id: O4
governing_sop: "SOP--backup-recovery.md"
phase: foundation
product: styx
date: "2026-03-08"
---

# Backup & Recovery Plan — Styx

## Overview

Styx stores three categories of data: critical financial records (ledger, escrow), important behavioral data (contracts, proofs, audits), and replaceable operational data (cache, sessions). This plan defines backup strategies, recovery procedures, and RTO/RPO targets for each category. Because Styx handles financial escrow, data integrity after recovery is not optional — a restored ledger that does not balance is worse than no restoration at all.

## Data Classification

### Tier 1: Critical (Financial Integrity)

Data whose loss or corruption would cause financial harm or legal liability.

| Table/Store | Description | Volume (est.) | Backup Priority |
|-------------|------------|---------------|----------------|
| `ledger_entries` | Double-entry debit/credit records | 10 rows per contract lifecycle | Highest |
| `escrow_records` | Stripe escrow holds, captures, refunds | 2-4 rows per contract | Highest |
| `users` | Account records, auth credentials, PII | 1 row per user | Highest |
| `stripe_webhook_events` | Raw webhook payloads for replay | 3-5 per contract | High |
| `reconciliation_snapshots` | Point-in-time balance assertions | 1 per reconciliation cycle | High |

### Tier 2: Important (Operational Continuity)

Data whose loss would degrade service but not cause financial harm.

| Table/Store | Description | Volume (est.) | Backup Priority |
|-------------|------------|---------------|----------------|
| `contracts` | Behavioral contract definitions | 1 per contract | High |
| `proofs` | Proof submission metadata (media in R2) | 1-3 per contract | High |
| `audit_records` | Fury audit decisions and evidence | 1-2 per contract | High |
| `auditor_profiles` | Fury auditor reputation, accuracy | 1 per auditor | Medium |
| `practitioner_accounts` | B2B subscription and client data | 1 per practitioner | High |
| `analytics_events` | Business metrics raw events | High volume | Medium |

### Tier 3: Replaceable (Cache/Ephemeral)

Data that can be regenerated or is inherently temporary.

| Store | Description | Recovery Method |
|-------|------------|----------------|
| Redis cache | Session data, API response cache | Warm-up from database on restart |
| BullMQ job data | Fury queue state | Re-enqueue pending audits from `contracts` table |
| CDN cache | Static asset cache | Rebuild on deploy |
| Temporary upload files | In-progress proof uploads | User re-uploads |

## PostgreSQL Backup Strategy

### Render Managed Backups

Render's managed PostgreSQL provides automatic backups:

| Feature | Starter Plan | Standard Plan | Pro Plan |
|---------|-------------|---------------|----------|
| Automatic backups | Daily | Daily | Continuous (WAL archiving) |
| Retention | 7 days | 14 days | 30 days |
| Point-in-time recovery | No | No | Yes (to any second) |
| Manual snapshots | No | Yes | Yes |
| Cross-region replica | No | No | Add-on |

**Current (Starter Plan):** Daily backups with 7-day retention. Backups occur at a Render-determined time (typically low-traffic hours).

**Target (Standard Plan):** Upgrade when approaching 500 users. 14-day retention and manual snapshot capability before risky operations.

**Target (Pro Plan):** Upgrade when approaching 2,000 users or when RPO < 1 hour becomes a hard requirement. Continuous WAL archiving enables point-in-time recovery to any second.

### Manual Backup Procedure

For operations not covered by Render's automatic backups (e.g., before a risky migration):

```bash
# Connect to Render PostgreSQL via external connection string
pg_dump "$RENDER_EXTERNAL_DATABASE_URL" \
  --format=custom \
  --compress=9 \
  --file="styx-backup-$(date +%Y%m%d-%H%M%S).dump"

# Verify the backup
pg_restore --list "styx-backup-*.dump" | head -20
```

Store manual backups in Cloudflare R2 (separate bucket from proof media):

```bash
# Upload to R2 backup bucket
aws s3 cp "styx-backup-*.dump" \
  s3://styx-backups/postgres/ \
  --endpoint-url "$R2_ENDPOINT"
```

### Backup Verification

Every backup must be verified. An unverified backup is not a backup.

```bash
# Restore to a temporary local database
createdb styx_verify
pg_restore --dbname=styx_verify "styx-backup-*.dump"

# Run integrity checks
psql styx_verify -c "
  SELECT
    (SELECT SUM(amount) FROM ledger_entries WHERE type = 'debit') AS total_debits,
    (SELECT SUM(amount) FROM ledger_entries WHERE type = 'credit') AS total_credits;
"
# MUST be equal. If not, the backup is corrupt or was taken mid-transaction.

# Count key tables
psql styx_verify -c "
  SELECT 'users' AS tbl, COUNT(*) FROM users
  UNION ALL SELECT 'contracts', COUNT(*) FROM contracts
  UNION ALL SELECT 'ledger_entries', COUNT(*) FROM ledger_entries
  UNION ALL SELECT 'escrow_records', COUNT(*) FROM escrow_records;
"

# Clean up
dropdb styx_verify
```

## R2 Backup Strategy (Proof Media)

### Current Approach

Proof media files (images, videos uploaded by contract participants) are stored in Cloudflare R2. R2 provides:
- 99.999999999% (11 nines) durability
- No replication needed — R2 durability is comparable to S3

### Backup Considerations

Given R2's extreme durability, full backup of proof media is lower priority than database backup. However:

1. **Metadata in PostgreSQL:** The `proofs` table contains the R2 object key and signed URL metadata. If the database is restored but R2 objects are missing, proofs are orphaned.
2. **Cross-reference integrity:** After any database restore, verify that all `proofs.r2_key` values correspond to existing R2 objects.

### Signed URL Regeneration

If R2 credentials are rotated (e.g., after a security incident), all existing signed URLs become invalid. Regeneration:

```bash
# Query all active proof records
psql "$DATABASE_URL" -c "
  SELECT id, r2_key FROM proofs WHERE status = 'active';
" --csv > active_proofs.csv

# Regenerate signed URLs (application-level, not a raw script)
# The API's ProofService.regenerateSignedUrls() handles this
curl -X POST https://api.styx.app/admin/proofs/regenerate-urls \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

## Redis Recovery

### Cache Warm-Up

Redis data is ephemeral. On Redis restart or failover:

1. **Session cache:** Users will be logged out. They re-authenticate, and sessions are re-created.
2. **API response cache:** Cache misses hit PostgreSQL directly. Performance degrades temporarily until cache is warm.
3. **Rate limiter state:** Resets to zero. Brief window of no rate limiting until counters rebuild.

### BullMQ Queue State Recovery

BullMQ stores job state in Redis. If Redis is lost:

1. **Waiting jobs:** Lost. Must be re-enqueued from the `contracts` table.
2. **Active jobs:** Lost. Workers will not receive completion callbacks. These contracts are in an indeterminate audit state.
3. **Completed jobs:** Metadata lost, but the `audit_records` table in PostgreSQL has the canonical audit results.

**Recovery procedure:**

```sql
-- Find contracts that were in active audit when Redis was lost
SELECT id, status, fury_job_id
FROM contracts
WHERE status = 'auditing'
  AND updated_at < NOW() - INTERVAL '1 hour';

-- These need to be re-enqueued for Fury audit
-- The API's FuryRouterService.reEnqueueStaleAudits() handles this
```

## Recovery Procedures

### Full Database Restore (from Render Backup)

**When:** Database corruption, catastrophic data loss, failed migration with data loss.

**Steps:**

1. Put application in maintenance mode (return 503 on all endpoints).
2. In Render dashboard: navigate to PostgreSQL service → Backups → select restore point.
3. Render creates a new database instance from the backup.
4. Update `DATABASE_URL` in API service to point to the restored instance.
5. Redeploy API service.
6. Run post-restore verification (see below).
7. Remove maintenance mode.

**Estimated time:** 15-30 minutes depending on database size.

### Partial Table Recovery

**When:** A specific table is corrupted or has bad data, but the rest of the database is fine.

**Steps:**

1. Take a manual backup of the current (partially corrupted) database.
2. Restore the Render backup to a temporary database (Render "fork" feature).
3. Export only the affected table from the temporary database:
   ```bash
   pg_dump "$TEMP_DATABASE_URL" --table=<table_name> --data-only --format=plain > table_data.sql
   ```
4. Truncate the affected table in production (within a transaction).
5. Import the clean data:
   ```bash
   psql "$DATABASE_URL" -f table_data.sql
   ```
6. Run integrity verification on the restored table.
7. Drop the temporary database.

### Post-Restore Verification

After any restore, these checks are mandatory:

| Check | Command | Expected Result |
|-------|---------|----------------|
| Ledger balance | `SELECT SUM(CASE WHEN type='debit' THEN amount ELSE -amount END) FROM ledger_entries` | Exactly $0.00 |
| Escrow vs Stripe | Compare `escrow_records` with Stripe dashboard | All active escrows match |
| User count | `SELECT COUNT(*) FROM users` | Matches pre-incident count |
| Contract states | `SELECT status, COUNT(*) FROM contracts GROUP BY status` | No unexpected states |
| Orphaned proofs | R2 objects without `proofs` table entry | Should be zero |
| Foreign key integrity | `SELECT conname FROM pg_constraint WHERE contype='f'` + validate | No violations |

**Ledger reconciliation is the most critical check.** If `total_debits != total_credits` after restore, the restore is incomplete and financial operations must remain frozen until resolved.

## RTO/RPO Targets

| Tier | RPO (max data loss) | RTO (max downtime) | Current Capability |
|------|--------------------|--------------------|-------------------|
| Tier 1 (Financial) | 1 hour | 1 hour | Daily backup (24h RPO) — upgrade to Standard for improvement |
| Tier 2 (Operational) | 4 hours | 2 hours | Daily backup (24h RPO) |
| Tier 3 (Ephemeral) | N/A | 15 minutes | Redis restart |

**Gap Analysis:**

| Target | Current | Gap | Fix |
|--------|---------|-----|-----|
| Tier 1 RPO: 1 hour | 24 hours (daily backup) | 23 hours | Upgrade to Render Pro (continuous WAL) |
| Tier 1 RTO: 1 hour | ~30 min (Render restore) | None | Met |
| Tier 2 RPO: 4 hours | 24 hours | 20 hours | Upgrade to Render Standard + manual pre-deploy snapshots |
| Tier 2 RTO: 2 hours | ~30 min | None | Met |

Priority: upgrade PostgreSQL to Render Standard ($50/mo) when approaching 500 users. This reduces RPO to ~12 hours (more frequent backups + manual snapshots).

## Disaster Recovery

### Render Region Failure

Render's Oregon region is the single point of deployment. If the Oregon region experiences a prolonged outage:

1. **Short outage (< 4 hours):** Wait for Render to restore. Application is unavailable but data is safe (managed backups are stored independently).
2. **Extended outage (> 4 hours):**
   - Export latest database backup from Render (if accessible).
   - Deploy to an alternative platform (Fly.io, Railway, or manual VPS) using Docker images.
   - Update DNS to point to the new deployment.
   - Estimated time: 2-4 hours of manual work.

### Data Export Procedures

For portability and disaster recovery, maintain the ability to export all data:

```bash
# Full database export
pg_dump "$DATABASE_URL" --format=custom --file=styx-full-export.dump

# Ledger entries (critical financial data)
psql "$DATABASE_URL" -c "COPY ledger_entries TO STDOUT WITH CSV HEADER" > ledger_entries.csv

# Escrow records
psql "$DATABASE_URL" -c "COPY escrow_records TO STDOUT WITH CSV HEADER" > escrow_records.csv

# User data (PII — handle with care)
psql "$DATABASE_URL" -c "COPY users TO STDOUT WITH CSV HEADER" > users.csv

# R2 proof media (bulk export)
aws s3 sync s3://styx-proofs ./proof-export/ --endpoint-url "$R2_ENDPOINT"
```

Store exports in a location independent of Render: local encrypted storage, a separate cloud provider, or an encrypted R2 bucket in a different Cloudflare account.

## Backup Drill Template

### Quarterly Backup Restore Drill

Perform this drill every 3 months to verify backup integrity and practice the recovery procedure.

**Pre-Drill:**
- [ ] Schedule 1-hour maintenance window (or use staging environment)
- [ ] Notify any active B2B practitioners
- [ ] Document current database state (row counts, ledger balance)

**Drill Steps:**
1. [ ] Take a manual backup of current database
2. [ ] Restore the most recent automatic backup to a temporary database
3. [ ] Run post-restore verification checklist (all items above)
4. [ ] Compare row counts between live and restored database
5. [ ] Verify ledger balance in restored database
6. [ ] Test application connectivity to restored database
7. [ ] Run smoke tests against restored database
8. [ ] Document any discrepancies
9. [ ] Drop the temporary restored database
10. [ ] Record drill results and time taken

**Post-Drill Report:**

```markdown
## Backup Drill Report — YYYY-MM-DD

**Backup source:** [Render automatic / Manual]
**Backup date:** [date of backup used]
**Restore time:** [minutes from start to application operational]
**Ledger balanced:** [Yes / No]
**Row count match:** [Yes / No / Delta: N rows]
**Issues found:** [None / Description]
**Action items:** [None / List]
**Next drill date:** [YYYY-MM-DD]
```

## Backup Cost

| Component | Current Cost | At Scale |
|-----------|-------------|----------|
| Render PostgreSQL backup | Included in plan | Included in plan |
| Manual backup storage (R2) | ~$0.015/GB/mo | $0.50-$5.00/mo |
| Backup verification compute | $0 (local) | $0 (local) |
| Drill time (founder hours) | 1 hour/quarter | 1 hour/quarter |
| **Total** | **< $1/mo** | **< $10/mo** |

Backup is one of the cheapest insurance policies in the system. There is no justification for skipping it.
