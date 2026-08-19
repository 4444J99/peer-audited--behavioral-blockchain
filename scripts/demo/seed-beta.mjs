#!/usr/bin/env node
/**
 * Seed the hosted beta database — the Render-native half of the seeding contract.
 *
 * The GitHub workflow's seed_beta job (psql on a runner) is the CI path; this
 * script is the same operation shaped for Render's pre-deploy command, where
 * one-off jobs are unavailable and psql is not installed but node + pg are.
 * Runs from the repo root with the API service's own environment:
 *
 *   DATABASE_URL              (required) — the service's database
 *   STYX_SEED_PASSWORD_HASH   (optional) — bcrypt hash to bind the shared demo
 *                             password to the synthetic accounts. When unset,
 *                             seeding still runs and account passwords keep
 *                             their committed bootstrap hashes.
 *
 * Idempotent by construction: both seed files are ON CONFLICT-guarded, and the
 * UPDATE is a fixed-point assignment. Nothing here prints a secret; the hash
 * is data the users table already stores.
 */
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { Pool } = require("pg");

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("SEED FAIL: DATABASE_URL is required");
  process.exit(1);
}

const pool = new Pool({ connectionString: databaseUrl });

const SEED_FILES = ["src/api/database/seed.sql", "scripts/demo/seed-circles.sql"];

try {
  for (const file of SEED_FILES) {
    await pool.query(readFileSync(file, "utf8"));
    console.log(`seeded: ${file}`);
  }

  const hash = process.env.STYX_SEED_PASSWORD_HASH || "";
  if (hash) {
    const result = await pool.query(
      `UPDATE users SET password_hash = $1
       WHERE email LIKE '%@demo.styx.protocol'
          OR email = 'hr.lead@acheron.example'
          -- Base-seed accounts live on @styx.protocol, which the LIKE above
          -- does NOT match. Gate 01 logs in as demo@ — leaving these on the
          -- committed bootstrap hash makes the readiness gate unpassable.
          OR email IN ('demo@styx.protocol', 'fury@styx.protocol', 'admin@styx.protocol')`,
      [hash],
    );
    console.log(`password bound: ${result.rowCount} account(s)`);
  } else {
    console.log("STYX_SEED_PASSWORD_HASH unset — bootstrap hashes left in place");
  }
  console.log("seed-beta complete");
  process.exit(0);
} catch (error) {
  console.error("SEED FAIL:", error instanceof Error ? error.message : error);
  process.exit(1);
}
