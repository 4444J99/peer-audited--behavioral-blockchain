---
name: verify
description: >-
  Boot the Styx stack and drive it over HTTP and in a browser. Use whenever a
  change touches boot, escrow, contracts, geo/compliance, billing config, the
  web design system, or the mobile ZK surface — CI cannot see these. Starts from
  a running app, never from a green test run.
---

# Styx runtime verification

CI missed four holes in a row because it never boots the stack. This skill is the
fix: **start the app, then drive the surface that exposed the defect.** No test
runs, no typecheck — CI already does that, and CI is what missed all of this.

## Cold start (~5 min)

```bash
createdb styx_v858 && npm run dev:migrate          # migrations incl. 066+
```

`.env.local` (gitignored, repo-root env runner reads it) needs at minimum:

```
DATABASE_URL=
REDIS_URL=
JWT_SECRET=
STYX_API_KEY_PEPPER=
STYX_API_PORT=3900
STYX_WEB_PORT=3901
```

Boot both servers, then run them in the background:

```bash
npm run dev:api & npm run dev:web
```

`GET /health` on `:3900` is the boot gate. If the API refuses to boot, the
absence is usually a config throw, not a crash — read the error before touching
code.

## The flows worth driving

- **Contract creation on the ledger rail.** `STYX_TEST_MONEY_MODE=true` with no
  Stripe key: `POST /contracts` must create, and repeat finalize must not
  duplicate the bounty. Query `contracts` + `ledger_entries` to see the balanced
  user→`SYSTEM_ESCROW` pair.
- **Geo provenance.** `GET /contracts` with `x-forwarded-for: 8.8.8.8` +
  `TRUST_PROXY_HEADERS=true` must 200 with `source: ip-country-only`, while the
  same header on `POST /contracts` must 403 `JURISDICTION_BLOCKED`. An NL IP
  (e.g. `91.198.174.192`) must 403 on both. With `MAXMIND_DB_PATH` set, the
  audit row reports `source: maxmind` and a real state.
- **Boot without secrets.** No `STRIPE_SECRET_KEY`, only `REDIS_URL` — both must
  listen and `/health` must 200. A lazy stripe getter and purpose-scoped Redis
  mean absence is a valid configuration, not a crash.
- **The web design system.** Load `/dashboard` and `/help` in a real browser.
  Tailwind v4 utilities and the live `@theme` tokens are the proof; unstyled
  native `<details>` and blue links are the failure.
- **The mobile ZK surface.** `npm run web` in `src/mobile` (Expo web), open
  `DigitalExhaustScreen` with no log provider installed: the fail-closed path is
  "Scan Unavailable" — a clean `COMPLIANT` verdict is the regression.
- **Swagger honesty.** `GET /api/docs`, paste the `CreateContractDto` example
  verbatim into `POST /contracts` — it must be accepted.

## Gotchas that cost time

- **`curl -q`.** A personal `.curlrc` (user-agent etc.) can trip Cloudflare/bot
  filters or change headers under you. Always `curl -q`.
- **`access_tier` is lowercase.** The API's `allowed_tiers` field is a
  wire-format value (`TIER_1_MICRO_STAKES`), but any *query/param* spelled
  `access_tier` must be lowercase on the wire. Mixed case silently 404s or
  returns an empty set.
- **Real enum values.** `oathCategory` and `verificationMethod` reject prose
  ("Biological", "photo"). Use `src/shared/libs/behavioral-logic.ts` values:
  `OathCategory.DEEP_WORK_FOCUS` / `VerificationMethod.API_SCREEN_TIME`, etc.
  The swagger docs derive from those enums so copy-pasting an example works.
- **Screenshots for the human.** Deliver `/dashboard`, `/help`, the dashboard
  jurisdiction notice, and `DigitalExhaustScreen` as files and name what was
  sent.

## When the app is not the problem

If a boot throws mention `requireOneEnv`, `resolve*RedisConfig`, or the escrow
port: the config layer is honest about absence now — read the thrown name, set
the missing var or fix the caller, and boot again.
