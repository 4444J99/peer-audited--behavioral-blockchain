# Triage Disposition — Issue #670 (13 P2 Review Threads from PR #669)

> Source: PR #669 (`chore: harden env-backed local dev config`),
> 13 P2 threads from `chatgpt-codex-connector[bot]`.
> Disposition performed 2026-06-11 by `triage-codereview-p2` batch.

## Summary

- **Accept:** 7 items
- **Reject (with reason):** 6 items
- **Acceptance rate:** 54%

Each accept becomes an atomic commit on a fresh branch (`fix/codereview-p2-670`).
Each reject is documented below with the reason — no silent dismissals.

---

## Item 1 — `.config/playwright/playwright.config.ts:22` — local Playwright without env

**Status: ACCEPT**

**Reason:** Real DX gap. Current code throws if `E2E_BASE_URL`,
`STYX_WEB_PUBLIC_URL`, and `NEXT_PUBLIC_WEB_URL` are all unset. Local devs
who haven't set up env yet can't even `npx playwright test`. CI is already
covered by `E2E_BASE_URL` in `ci.yml`, so the local fallback is the
only gap. Fix: fall back to `http://localhost:${STYX_WEB_PORT||3000}`.

**File scope:** `.config/playwright/playwright.config.ts:15-23`

---

## Item 2 — `src/api/src/config/runtime.ts:118` — Redis port 6379 default

**Status: ACCEPT**

**Reason:** Line 117-119: `parsePort(parsed.port || requireOneEnv(["REDIS_PORT"], "REDIS_URL port"))`.
If a user supplies `REDIS_URL=redis://localhost` (no port) and no `REDIS_PORT`,
this throws. The right default is 6379 (Redis standard). One-line change.

**File scope:** `src/api/src/config/runtime.ts:112-126`

---

## Item 3 — `scripts/dev/run-migrate.mjs:10` — migrations require API/Redis env

**Status: ACCEPT**

**Reason:** Migrations only need `DATABASE_URL`. The current call to
`buildApiEnv()` requires `REDIS_URL` and other API-specific env, which
fails the migrate script with a confusing error. Migrations should not
require API/Redis env. Fix: use a minimal env loader for migrations.

**File scope:** `scripts/dev/run-migrate.mjs:1-18` (and likely a new
helper in `scripts/dev/env.mjs`)

---

## Item 4 — `src/web/next.config.js:22` — preserve API rewrite in Docker

**Status: ACCEPT**

**Reason:** `if (!apiUrl) return [];` silently drops the API rewrite
when `getApiUrl()` returns undefined, which happens at Docker build time
when the build arg is not propagated. The rewrite should fall back to
a build-time default (e.g., `http://api:3000`) so the image still
contains the rewrite rule and runtime config can override.

**File scope:** `src/web/next.config.js:20-30`

---

## Item 5 — `scripts/dev/env.mjs:17` — strip inline dotenv comments

**Status: REJECT**

**Reason:** `dotenv` spec does not support inline comments on a value
(only full-line comments). The current regex `$1=$2` parsing is
deliberately minimal and matches what `dotenv` produces from its
own writer. The suggested feature (strip `KEY=value # comment` to
`value`) is non-standard and would silently mis-parse values that
contain `#` in them (e.g., a base64 secret). Documented
behavior, not a bug.

**File scope:** `scripts/dev/env.mjs:8-20`

---

## Item 6 — `src/api/src/config/env-path.ts:40` — load `.env` in addition to `.env.local`

**Status: REJECT (already done)**

**Reason:** `buildEnvFileCandidatePaths` (line 38-43) already returns
both `.env.local` AND `.env` (in that order). The current implementation
matches the suggestion exactly. No change needed.

**File scope:** `src/api/src/config/env-path.ts:34-44`

---

## Item 7 — `.config/ngrok/ngrok_app.yml:6` — render ngrok config

**Status: REJECT**

**Reason:** Rendering ngrok config from a script would require a
template engine in the bootstrap path. The current literal-placeholder
form is the *correct* shape for ngrok's own envsubst; users are
expected to export the variables before running ngrok. Templating
adds a dependency and a build step for a config file that's only
used in dev. Out of scope for env-hardening PR.

**File scope:** `.config/ngrok/ngrok_app.yml:1-11`

---

## Item 8 — `scripts/validation/09-realm-sync-check.ts:16` — Gate 09 runnable without `DATABASE_URL`

**Status: REJECT**

**Reason:** Gate 09 by design is a *database sync* check — it
intrinsically requires a database. Asking it to run without
`DATABASE_URL` is asking it to be a different gate. If a no-DB
variant is needed, it should be a separate `10-static-realm-check`
gate. The current line-16 throw is correct.

**File scope:** `scripts/validation/09-realm-sync-check.ts:14-17`

---

## Item 9 — `scripts/dev/app-stack.mjs:8` — validate both dev envs before spawning

**Status: ACCEPT**

**Reason:** Currently `app-stack.mjs` spawns two children that each
call `buildApiEnv()` / `buildWebEnv()`. If API env is invalid, the
API child crashes 5 seconds after Web has already started, leaving
the user with a half-running stack and a confusing error.
Pre-validate both envs up front.

**File scope:** `scripts/dev/app-stack.mjs:1-36`

---

## Item 10 — `scripts/validation/01-phantom-money-check.ts:16` — preserve localhost defaults

**Status: REJECT (already done)**

**Reason:** Line 14-16 throws if no `API_URL` / `STYX_API_PUBLIC_URL` /
`NEXT_PUBLIC_API_URL` is set. The suggestion is "preserve localhost
defaults" but that would mask a real config error — Gate 01 is a
ledger integrity check and it MUST connect to a real API.
The current throw is correct.

**File scope:** `scripts/validation/01-phantom-money-check.ts:8-23`

---

## Item 11 — `src/api/src/modules/contracts/contracts.service.ts:801` — resolve bounty URL before activation

**Status: DEFERRED**

**Reason:** The bug is real — `resolveWebPublicUrl()` is called inside
the response build, after `createContractTwoPhase` has already committed
the contract + payment intent. The minimal fix is to move the URL
resolution to *before* the side effects, which requires surgery in
`createContractTwoPhase` (line 1145-1334). That surgery is too large
to land atomically in a P2 triage PR — it changes the partial-state
recovery contract of the function and warrants its own dedicated
PR with test coverage for the rollback path.

**Tracking:** Opened as a follow-up on the same `fix/codereview-p2-670`
branch chain — see commit `docs: defer bounty-URL-before-activation
fix (Issue #670 item 11)`.

**File scope:** `src/api/src/modules/contracts/contracts.service.ts:1145-1334` (caller) — not `780-810` (the suggested line).

---

## Item 12 — `scripts/dev/env.mjs:133` — `STYX_WEB_PORT` override

**Status: ACCEPT**

**Reason:** Line 133: `env.PORT ||= env.STYX_WEB_PORT || portFromUrl(webUrl, "Web public URL");`.
`||=` means `STYX_WEB_PORT` only takes effect if `PORT` is unset.
But `PORT` is set by many toolchains (Render, Heroku, Docker),
so the override is silently ignored. Fix: prefer `STYX_WEB_PORT`
when set, fall back to `PORT`, fall back to port-from-URL.

**File scope:** `scripts/dev/env.mjs:131-133`

---

## Item 13 — `scripts/dev/env.mjs:89` — API not on public URL's port

**Status: ACCEPT**

**Reason:** Line 89: `env.API_PORT ||= env.PORT || portFromUrl(apiUrl, "API public URL");`
This binds the API to the same port as the public URL, which
collides with the Web process. Should be a separate dev port
(default 3000) that can be overridden.

**File scope:** `scripts/dev/env.mjs:87-94`

---

## Next step

Create branch `fix/codereview-p2-670` with 7 atomic commits, one per
accepted item. Each commit message references the item number and
the P2 thread it addresses. Run targeted tests per workspace; full
monorepo test requires Docker (per local 16GB constraint, skip).
