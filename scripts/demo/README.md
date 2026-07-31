# Styx Demo Substrate — "The Concentric Circles"

`seed-circles.sql` layers a realistic demo cohort on top of the base seed
(`src/api/database/seed.sql`). It is **idempotent** — every insert is guarded
with `ON CONFLICT DO NOTHING` (or `NOT EXISTS`), so re-running it against a
live database is always safe.

## What it seeds

| Circle | Data |
| --- | --- |
| Alpha (wedge) | 4 `beta_waitlist` prospects (organic/creator/practitioner/referral channels), 3 `waitlist_entries` queued for `cohort-2026-08` |
| Beta (contracts) | 7 no-contact consumers with ACTIVE `RECOVERY_NO_CONTACT_TEXT` contracts, day-accurate attestation streaks (perfect, missed-and-recovered, wobbling), today's `PENDING` check-ins, ledger stake holds/return/forfeit |
| Gamma (proof integrity) | 3 Fury auditors (Alecto, Megaera, Tisiphone) with a pending 3-way proof review + a resolved consensus, `fury_realm_expertise` rows, KYC states across users (`VERIFIED` / `PENDING` / `NOT_STARTED`) |
| Delta (retention/pods) | 5-member pod `pod-cerberus` via `contracts.metadata.cohort`, accountability-partner links (incl. one email-only PENDING invite), partner check-ins, a dampened `pod_broadcast_log` failure signal |
| Omega (enterprise) | Enterprise `e0000000-0000-0000-0000-000000000001` ("Acheron Logistics Group" — the id `/hr` defaults to), seats + scopes, contract mix (ACTIVE/COMPLETED/FAILED) that lights up `/api/b2b/metrics`, 1 practitioner with client assignments + journal alerts (guarded — see below) |

All 12 demo users share the base-seed password: `demo-password-123`. <!-- allow-secret: local demo seed credential, not a real secret -->

| Login | Role | Use it on |
| --- | --- | --- |
| `river@demo.styx.protocol` | USER (pod member, 21-day streak) | `/dashboard`, `/recovery`, `/contracts/*` |
| `sage@demo.styx.protocol` | USER (KYC `PENDING`) | `/kyc` |
| `alecto@demo.styx.protocol` | FURY (pending 3-way review) | `/fury` |
| `dr.moira@demo.styx.protocol` | PRACTITIONER | `/practitioner` |
| `hr.lead@acheron.example` | ADMIN (Acheron enterprise) | `/hr`, `/admin/jurisdictions` |

## How to run

From the repo root:

### 1. Bring up the stack

```bash
make deploy            # = bash scripts/deploy.sh local
```

or, equivalently:

```bash
docker compose --env-file .config/docker/compose.defaults.env \
  -f .config/docker/docker-compose.yml up -d --build
```

`schema.sql` is a **reference snapshot only** and is deliberately not mounted into
`/docker-entrypoint-initdb.d/` — an initdb-provisioned database froze at that table
set and caused the migration runner to baseline-stamp (skip) the rest of the chain.
Instead a one-shot `styx-migrate` service applies the full chain, and the API waits
on `service_completed_successfully` before it starts.

### 2. Migrate

The compose stack migrates itself (step 1). Run this only for a non-docker database:

```bash
cd src/api && npm run migrate
```

### 2b. No Docker? Use a local Postgres

Verified path on a machine with Homebrew Postgres and no Docker:

```bash
createdb styx_demo
cd src/api
DATABASE_URL=postgresql://localhost:5432/styx_demo npm run migrate   # 70 migrations
psql styx_demo -f database/seed.sql
psql styx_demo -f ../../scripts/demo/seed-circles.sql
```

Then boot the API against it (redis must be running — `redis-server --daemonize yes`):

```bash
DATABASE_URL=postgresql://localhost:5432/styx_demo \
REDIS_URL=redis://localhost:6379 \
REDIS_BULLMQ_URL=redis://localhost:6379 \
REDIS_CACHE_URL=redis://localhost:6379 \
STYX_API_PUBLIC_URL=http://localhost:4310 \
NEXT_PUBLIC_API_URL=http://localhost:4310 \
STRIPE_SECRET_KEY=sk_test_mock_key STRIPE_PUBLISHABLE_KEY=pk_test_mock_key \
JWT_SECRET=dev-jwt-secret-0123456789abcdef STYX_API_KEY_PEPPER=dev-pepper \
APP_SECRET=dev-app-secret ANONYMIZE_SALT=dev-salt ZK_EXHAUST_SECRET=dev-zk \
STYX_WEBHOOK_SECRET=dev-wh INTERNAL_SERVICE_TOKEN=dev-internal \
ENTERPRISE_SSO_SECRET=dev-sso PORT=4310 npm run dev
```

### 2c. Exercising device attestation in a demo

Attestation is **fail-closed**: without `APPLE_APP_ATTEST_APP_ID` /
`GOOGLE_PLAY_INTEGRITY_JWKS_URL` it refuses to verify rather than rubber-stamping.
For a demo, set `DEVICE_ATTESTATION_DEV_BYPASS=true` (non-production only) — verdicts
come back labeled `deviceIntegrity: 'DEV_BYPASS'`, never `STRONG`.

### 3. Apply the demo cohort

```bash
psql "postgres://styx:styx_local_dev@localhost:5432/styx" -f scripts/demo/seed-circles.sql
```

or without a local `psql`:

```bash
docker compose --env-file .config/docker/compose.defaults.env \
  -f .config/docker/docker-compose.yml \
  exec -T styx-postgres psql -U styx -d styx < scripts/demo/seed-circles.sql
```

### 4. Tour it

Open `http://localhost:3001/circles` — the public demo index that walks each
circle and links every surface.

## Ordering constraints

- **Migrate first, then base seed, then this file.** `seed-circles.sql` references
  base-seed system accounts (`SYSTEM_ESCROW`, `SYSTEM_REVENUE`) and tables that only
  the migration chain creates. Never provision from `schema.sql` — it is a reference
  snapshot, not the source of truth (see step 1).
- **Practitioner tables** (`practitioner_client_assignments`, `practitioner_alerts`)
  come from migration `058_practitioner_tables.sql`. The seed still guards those
  inserts behind `to_regclass()` checks so a partial chain seeds cleanly.
- **Re-running is safe** at any time; existing rows are never modified, only
  missing ones are added (streak dates are relative to `CURRENT_DATE`, so a
  re-run on a later day extends attestation history idempotently).

## Resetting

```bash
bash scripts/deploy.sh down
docker volume rm docker_styx-pg-data   # name may be prefixed by the compose project
make deploy
```

Then repeat steps 2–3.
