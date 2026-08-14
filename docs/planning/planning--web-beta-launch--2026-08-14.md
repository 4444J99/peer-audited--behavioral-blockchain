# Web Beta Launch — the full build (2026-08-14)

The plan that took the demo estate from two dark surfaces to all-live, and the record of
what was found on the way. Companion to the scope change recorded in
[`planning--phase1-private-beta-scope.md`](./planning--phase1-private-beta-scope.md).

## Starting state (all verified, not assumed)

| Surface | State on 2026-08-14 morning |
|---|---|
| Local demo | Live and verified (48 tour routes, LAN share, collector) |
| Cloudflare snapshot | Built + verified, never published |
| Render beta | Dark since 2026-03-10; preflight hard-fails on the missing `BETA_DEMO_PASSWORD`; the one green March run had **skipped migrations**; every documented beta/dogfood URL returned Render's `no-server` |
| Docs | Dead URLs, wrong script paths, one false capability claim, a machine-local path leak |

## Why the beta could not have worked even with the secret set

Three structural gaps, each closed by `.github/workflows/beta-promotion.yml` jobs (#886):

1. **Nothing seeded the database.** `migrate_beta` creates the schema; no workflow anywhere
   created data. The readiness suite's only authenticated gate logs in as
   `demo@styx.protocol` — a row that never existed on the beta. → `seed_beta`.
2. **The password rotation could not reach the account the gate uses.** Both provisioning
   scripts' UPDATE matched `%@demo.styx.protocol` + `hr.lead@acheron.example`;
   `demo@styx.protocol` matches neither. → WHERE widened (also #886).
3. **The tour compiled out of the web build.** `NEXT_PUBLIC_STYX_GUIDED_TOUR` is inlined at
   build time and was unset on the service — while the Private-Beta banner defaults ON.
   → `ensure_beta_env` sets the env vars *before* the deploys.

## Defects found while building (each with its own PR)

- **#884** — the readiness artifact collapsed six unrun gates into one skip row and dropped
  the `required` flag; the deploy preflight audited the wrong GitHub org by default and
  omitted the one secret that was actually missing.
- **#885** — the refresh cookie was scoped to `/auth/refresh`, a path the browser never
  requests behind the `/api` rewrite: every session hard-logged-out at 15 minutes, at BOTH
  issue sites (login and rotation).
- **#887** — `GET /users/me/history` queried a `truth_log` table no migration ever created;
  a guaranteed 500 that `/profile` rendered as a plausible empty history. Found by the new
  live sweep within minutes of it existing.
- Snapshot deploy lessons (in #886): `wrangler pages deploy` neither creates a missing
  Pages project (interactive prompt = CI hang) nor labels uploads production unless
  `--branch main` is pinned (a topic-branch deploy is a *preview*, and the canonical URL
  serves nothing while the output says Success).

## What is live

- **Snapshot**: `https://styx-demo-snapshot.pages.dev` — 48/48 routes verified against the
  live host, no backend, no off-origin calls beyond the documented cdnjs font.
- **Beta**: one dispatch away. `gh workflow run beta-promotion.yml -f promotion_target=beta
  -f run_migrations=true` runs the full lifecycle and refuses `promotion_ready` until
  smoke + strict readiness + `beta_verify` (every tour route, signed in per persona) are
  all green. Prerequisite: `BETA_DEMO_PASSWORD` + `BETA_FEEDBACK_TOKEN` in the `beta`
  environment (minted 2026-08-14; landing them is a one-paste operator action).
- **Notes/tracking on the beta**: the workflow provisions `styx-beta-feedback` (Render,
  1GB disk), bakes its URL into the web build, and gates `/summary` behind
  `BETA_FEEDBACK_TOKEN`.

## Deliberately out of scope

iOS/TestFlight distribution (separate machinery, no credentials modelled), real-money
activation (KYC enforcement stays off; StripeProductionGuard couples the two), and
staging/prod promotion (the staging environment holds zero secrets; prod is gated on it).
