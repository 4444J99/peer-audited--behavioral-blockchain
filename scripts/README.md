# Styx Automation Scripts (Ironclad)

## 1. Module Definition
This directory houses the **DevOps Automation** and **Maintenance utilities**. These are the "Janitors" of the Styx ecosystem.

## 2. Script Inventory

### `db-migrate.sh`
- **Purpose**: Runs PostgreSQL migrations via TypeORM/Prisma.
- **Usage**: `./scripts/db-migrate.sh [up|down] [env]`
- **Safety**: Must confirm confirmation prompt for `prod`.

### `seed-furies.ts`
- **Purpose**: Populates the DB with initial "Fury" (Auditor) accounts for testing.
- **Usage**: `ts-node scripts/seed-furies.ts`
- **Output**: Creates 10 Master Furies and 50 Novice Furies.

### `generate-honeypots.sh`
- **Purpose**: Generates "Fake" proof images (pass/fail) for the Fury Router calibration.
- **Dependency**: Requires `imagemagick` or `python-pill`.

### `deploy-r2-worker.sh`
- **Purpose**: Deploys the media compression worker to Cloudflare Workers.
- **Contract**: Expects `wrangler.toml` to be present.

## 3. Error Handling
- All scripts must use `set -euo pipefail` (Bash) or strict try/catch (Node).
- Logs must be written to `stderr` on failure.
- Exit code `1` on any error.

## 4. Verification
- Run `make test-scripts` to execute dry-runs of all logic.
