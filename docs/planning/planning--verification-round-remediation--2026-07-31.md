# Heal and evolve the verification-round findings

**Date:** 2026-07-31 · **Repo:** `peer-audited--behavioral-blockchain` · **Base:** `main` @ `6d3c356`

> Supersedes the earlier "what's next, root to leaf" plan in this file. Its durable content
> is tracked at `docs/planning/planning--founder-decision-brief--2026-07-31.md` and
> `docs/planning/concentric-circles-execution.md` — nothing is lost by replacing it here.

## Context

PR #858 (`afbf4dd`) shipped five beta-blocking correctness fixes and merged without ever
being run. A `/verify` round booted the stack, drove the API over HTTP and the web app in
Chrome, and returned **FAIL**. Four claims held; running it exposed a set of defects CI
cannot see.

Reading the code afterward, they are not ten independent bugs. **Each one is a place where
a capability was left half-built, and the half that exists papered over the half that
doesn't.** The corrections below therefore heal the defect *and* finish the capability —
no fix reduces a surface to make itself small.

The three structural ones:

- **The payment port is half-built.** `PayoutProvider`
  (`src/api/src/common/interfaces/payout-provider.interface.ts`) abstracts the *exit* —
  `releaseFunds` / `captureFunds` / `getTransactionStatus` — with two working adapters
  (Stripe, Corepay) routed by `PaymentRouterService`. The *entry* half has no port at all:
  `contracts.service.ts:140` injects `StripeFboService` directly and bypasses the router.
  You can pay **out** through Corepay but can only take money **in** through Stripe. That
  asymmetry is *why* the `sk_test_` bug existed — with the entry path Stripe-shaped,
  "is this real money?" degenerated into "what does the key string look like?"
- **The saga has no drain.** `RECONCILE_REQUIRED` is written by `contracts.service.ts:973`
  and `dispute.service.ts:44`, and read only by an admin *count* at
  `admin.controller.ts:506`. `ReconciliationService.reconcileContract(contractId)` exists
  but nothing ever sweeps. Compensation records a dead letter and walks away.
- **Verification has no surface where the fix lives.** The mobile ZK provider, the
  transactional contract path, the escrow interlock, and the CSS pipeline are each
  unreachable from the harness that is supposed to prove them. ~3,011 green tests over four
  holes.

Two findings are worse than the verification report stated:

- `contracts.service.ts:1291` has an **inverted guard**. The happy path is the branch that
  gets *skipped*, so every contract created through the transactional path stays
  `PENDING_STAKE` with a NULL `payment_intent_id` and no bounty row — while an
  already-finalized row gets its intent overwritten and a duplicate bounty inserted.
- The web app renders unstyled **in production too**: Tailwind **4.3.3** is installed but
  `src/web/app/globals.css` still uses v3 `@tailwind` directives. v4's entrypoint is
  `@import "tailwindcss"`, so no utilities are generated at all.

**Design principle** (`docs/logos/telos.md`): Styx's authority is *verifiability*. Every
change removes a place where the code asserts knowledge it does not have. One predicate per
real property; ignorance is never converted into a verdict. Where a capability is missing,
build it — an N/A is a vacuum, not a resting state.

**Routing:** every item below lands on an existing canonical surface — the `PayoutProvider`
port, `ReconciliationService`, `admin.scheduler`, the shared ledger, `src/shared` types.
Nothing forks a parallel substrate.

---

## Delivery

One branch off `main`, one commit per item so `git log --grep` resolves each to a single SHA
(Rule 11). Do **not** build on `docs/handoff-corrections` — already merged as `6d3c356`,
docs only.

```
git switch -c fix/verification-round-findings origin/main
```

Sequenced so each stage is runnable: **A** (escrow port) → **B** (contract saga) →
**C** (geo resolution) → **D** (boot & config) → **E** (web) → **F** (verification surfaces).

---

## A. Complete the escrow port — Stripe becomes one rail, not the rail

**Heal:** `stripe.service.ts:35` — `isDevMode` is `!key || key === 'sk_test_mock_key'`, so an
ordinary `sk_test_…` key (what `.env.example:1` documents) is treated as real money and
`assertRealMoneyAllowed` 500s contract creation under `render.yaml`'s own
`KYC_ENFORCEMENT_ENABLED=false`. The error text already names the right predicate — "once
STRIPE_SECRET_KEY is a live key" — but the code never checks for `sk_live_`.

**Evolve:** stop sniffing key strings. Which rail is installed *is* the answer.

1. **Extend the existing port** with the entry half, in the file that already defines it:

   ```ts
   // payout-provider.interface.ts — same module, same naming
   export interface EscrowProvider extends PayoutProvider {
     createCustomer(userId: string, email?: string): Promise<string>;
     holdStake(customerId, amountCents, contractId, idempotencyKey?): Promise<EscrowHold>;
     cancelHold(holdId: string): Promise<void>;
     transferFunds(...): Promise<PayoutResult>;
     readonly movesRealMoney: boolean;   // the property, declared by the adapter
     readonly rail: 'STRIPE' | 'COREPAY' | 'LEDGER';
   }
   ```

   `EscrowHold` replaces the leaked `Stripe.PaymentIntent` type at
   `contracts.service.ts:1259` — `{ id, status, amountCents, currency, rail }`.

2. **Three adapters.** `StripeEscrowProvider` wraps the existing `StripeFboService`
   unchanged (`stripe-payout.provider.ts` already does exactly this for the exit half —
   same pattern). `CorepayEscrowProvider` completes the rail that can already pay out, so
   the high-risk merchant path in `docs/legal/` becomes usable end to end.
   **`LedgerEscrowProvider`** performs the hold against the internal double-entry ledger:
   `LedgerService.recordTransaction(userAccount, SYSTEM_ESCROW, cents, contractId, …,
   idempotencyKey)` — every piece already exists (`services/ledger/ledger.service.ts:23`,
   `SYSTEM_ESCROW` at `contracts.service.ts:1042`), and it declares `movesRealMoney: false`.

3. **Route the entry half through `PaymentRouterService`**, which already picks a processor
   by risk (`determineProcessor`). `contracts.service.ts` injects `EscrowProvider` instead of
   `StripeFboService`. A user routed to `HIGH_RISK_COREPAY` at settlement no longer has a
   Stripe-held stake.

4. **`STYX_TEST_MONEY_MODE` becomes a real interlock**, not a banner string — the open item
   from the strategic plan. `true` (the default) selects `LedgerEscrowProvider`: the pilot
   holds real balances on the real ledger with no external rail attached, so the escrow path
   is *exercised* rather than mocked, and no configuration mistake can move outside money.
   `assertRealMoneyAllowed` gates on `provider.movesRealMoney` — a declared property, not a
   prefix guess. `stripe-production.guard.ts` already enforces `sk_live_` in production and
   is unchanged.

`isDevMode` disappears entirely rather than being repaired: the concept it conflated ("do we
fabricate?" vs "does real money move?") is now two adapters and one flag.

## B. Make the contract saga complete and self-healing

**Heal 1 — inverted guard** (`contracts.service.ts:1291`):

```ts
if (!(existing.status === "PENDING_STAKE" && existing.payment_intent_id === null)) {
```

`PENDING_STAKE` + NULL intent makes the inner expression true, so `!true` skips the
`UPDATE … SET payment_intent_id, status='ACTIVE'` **and** the bounty insert. Re-entry on an
already-finalized row does the opposite. The comment above it states the correct intent; the
code is its negation. Drop the `!`. In the else-branch (a concurrent finalize won), cancel
**our** hold after commit — otherwise the losing racer's hold is orphaned with no
compensation. Keep the `SUSPENDED` check at `:1286` ahead of both branches.

**Heal 2 — orphaned rows.** Phase A commits before `holdStake` runs (`:1259`, and `:1642` on
the non-transactional path). When the hold throws, the row is never cleaned up — and
`:912`/`:926`/`:942` count `PENDING_STAKE` toward active-contract limits, so **every failed
attempt permanently burns a contract slot** (three accumulated in one verification session).
Wrap both call sites; on failure call `markContractReconcileRequired(contractId, null,
'stake_hold_failed:…')` (`:965`) and rethrow.

**Evolve — drain the dead letters.** Both heals above deposit into `RECONCILE_REQUIRED`, a
status nothing sweeps. Add a `reconcileStuckContracts()` pass to `admin.scheduler.ts` (the
existing scheduler surface) that selects `status = 'RECONCILE_REQUIRED'`, runs each through
the existing `ReconciliationService.reconcileContract`, releases or re-marks with an attempt
count, and emits the outcome to the admin counters already wired at
`admin.controller.ts:506,526`. Compensation becomes a loop instead of a landfill (Rule #7).

**Close the hole that hid it.** `contracts.service.spec.ts:444` and `:504` mock the third
phase-B query as rejecting — which lands on `COMMIT`, not the `UPDATE` — and assert only on
`cancelHold`, so the inversion was invisible. Add the missing assertion: with a
`.connect`-bearing pool, the happy path **issues** the finalize `UPDATE` and inserts exactly
one bounty row.

## C. Evolve geo resolution into a provenance chain

**Heal:** with the exact config `render.yaml` ships (`TRUST_PROXY_HEADERS=true`,
`GEO_MISSING_HEADER_ACTION=block`), `GET /contracts` 403s for any US client whose IP
geoip-lite resolves as `{country:'US', region:''}` — common across the bundled GeoLite ranges
(8.8.8.8, most Cloudflare space). `lookupStateFromRequestIp:599` returns null and
`evaluateRequestPolicy:436` reads that as "location unknown," blocking `READ_ONLY` too.
Observed as a user: login succeeds, `/dashboard` dies on `JURISDICTION_BLOCKED`. The #858
commit claims `TRUST_PROXY_HEADERS` prevents exactly this; it only fixes the proxy-socket
cause.

The category error is collapsing three states into two. Model them separately:
`resolveStateFromRequest` returns `country` alongside `state` and a
`stateSource: "ip-country-only"`; `ComplianceDecision` (`:23-38`) carries both. The
missing-location branch admits the request **only** when `country === 'US' && action ===
'READ_ONLY'`. Non-US, no-IP, and every money action block exactly as today —
`RESTRICTED_REFUND_ONLY_ACTIONS` and `KYC_GATED_ACTIONS` never reach the carve-out, so no
monetized path loosens.

**Evolve:** replace the single hardcoded `geoip.lookup` with an ordered `GeoResolver` chain,
each link returning `{country, region, source, confidence}`:

1. `cf-ipstate` / `cloudfront-viewer-country-region` (gated on `trustProxy` — the guard at
   `geofence.guard.ts` *already logs* `hasCloudfrontViewerCountryRegion`, a header nothing
   reads; wire it rather than deleting the diagnostic)
2. **MaxMind GeoLite2 City** when `MAXMIND_DB_PATH` is present — this is the fix for the
   *data*, and it belongs alongside the model fix, not instead of it
3. `geoip-lite` as the always-present floor, so no new hard dependency at boot
4. dev-only `x-styx-state` override, unchanged

Adding a better source becomes a config entry. The chain's `source` and `confidence` flow
into the decision, the audit row (`logDecision:332`), and the guard's warn payload — so a
future "why was this user blocked?" has an answer on record. `users.last_known_state` stays
out of the chain: a remembered fact is not a verified one, and this is a compliance decision.

## D. Boot and configuration honesty

**BillingService** (`b2b/billing.service.ts:28`) — `new Stripe(process.env.STRIPE_SECRET_KEY
|| "")` throws `Neither apiKey nor config.authenticator provided` at DI time, aborting boot.
The pilot's stated safety property is that safety comes from the key being unset — a
configuration that does not start. Lazy-initialize behind a getter that throws a named error
at first use. Every other construction site is already safe; this is the outlier. With **A**
in place the app boots on the ledger rail with no Stripe key at all.

**Redis** (`config/runtime.ts:158-173`) — `resolveBullmqRedisConfig` falls back to shared
Redis on the `{127.0.0.1, 6379}` sentinel, but `resolveRedisByPurpose` only returns that
sentinel under `NODE_ENV==="test"` and otherwise throws at `requireOneEnv` first. The
fallback is unreachable; `resolveCacheRedisConfig` tests for port `6381`, which the sentinel
never returns. The API refuses to boot with only `REDIS_URL` set. Heal by returning `null`
for "not configured" and moving the requirement to the callers
(`purpose-specific ?? resolveRedisConnectionConfig()`); keep throwing on *partial* config,
which is misconfiguration rather than absence. Evolve into a small purpose registry so a new
queue is a table row, not a copied function. Render sets both purpose URLs — deployed
behavior unchanged.

**Swagger examples that the runtime rejects** (`contracts/dto.ts:161-175`) —
`example: "Biological"` and `example: "photo"` are rejected by `contracts.service.ts:1379`
and `:1386`. Heal with real values from `src/shared/libs/behavioral-logic.ts:7,50`; evolve by
deriving them — `enum: Object.values(OathCategory)` — so the docs cannot drift from the
validator again (Rule #6: fix the base, not the output).

**`.env.example`** — add `REDIS_BULLMQ_URL` and `REDIS_CACHE_URL` (both required to boot,
both absent) and document the escrow rails introduced in **A** rather than a bare
`sk_test_...` that now means something specific.

**Error details** (`global-http-exception.filter.ts:133`) — the stack in `details.stack` is
already gated on `NODE_ENV !== 'production'` and `render.yaml` sets `NODE_ENV=production`, so
this is dev-only by design and smaller than the report implied. Require an explicit
`STYX_DEBUG_ERROR_DETAILS === 'true'` **in addition**, so a misconfigured `NODE_ENV` cannot
leak absolute paths on its own.

## E. Web — restore the design system and let the UI degrade

**Tailwind** (`src/web/app/globals.css:1-3`) — v4.3.3 installed, v3 directives in the file, no
utilities generated, in the production build as much as in dev. Replace with
`@import "tailwindcss";` and **migrate** `tailwind.config.ts` into a v4 `@theme` block rather
than deleting it — the `background`/`foreground` tokens become real, and `bg-background` /
`text-foreground` get adopted in the shell so the tokens are load-bearing instead of
decorative. A dead v3 config in a v4 repo is what made this invisible; a live v4 theme is
what keeps it visible.

**Typed errors** — `parseErrorMessage` (`api-client.ts:62`) flattens everything to a string,
so callers cannot tell a 403 from an outage. `dashboard/page.tsx:55` `Promise.all`s four
calls, blanks the page on any rejection, and advises "Ensure the backend service is
reachable" — false when the backend answered correctly with `JURISDICTION_BLOCKED`. Add
`ApiError` carrying `status` and `code`, thrown from all three sites; message text is
unchanged so `api-client.test.ts` still holds. Evolve by putting the error-envelope type in
`src/shared` so the API's `error_code` contract and every client share one definition.
Give the contracts call its own `.catch` (as `getStreakChain` already has at `:59`), render
the jurisdiction case as its own notice with the API's own message, and drop the reachability
line for non-network errors.

## F. Build the verification surfaces that are missing

The mobile ZK fix from #858 was reported unverifiable — no web target, `build` is
`tsc --noEmit`. That is a vacuum, not a verdict. `react-dom` is **already** in
`src/mobile` devDependencies (for `jest-environment-jsdom`), so the gap is
`react-native-web`, an `expo.web` block in `app.json`, and a `web` script. Add them, then
drive `DigitalExhaustScreen` in a browser and confirm the fail-closed `NoLogProviderError`
actually surfaces as "Scan Unavailable" instead of a silent `COMPLIANT` — the one Phase 1
journey with money on it.

Then persist `.claude/skills/verify/SKILL.md` at the repo root: the cold-start handle, the
flows worth driving, and the gotchas that cost time (`curl -q`, lowercase `access_tier`,
real enum values). Ten green checks over four holes is the finding under the findings; a
recipe that starts the next round from a *running app* is the fix for it.

---

## Verification

Runtime only. No test runs, no typecheck — CI already does that, and CI is what missed all of
this. Each item is re-driven at the surface that exposed it.

**Handle** (~5 min):

```bash
createdb styx_v858 && npm run dev:migrate          # 71 migrations incl. 066
# .env.local (gitignored): DATABASE_URL, REDIS_URL, REDIS_BULLMQ_URL, REDIS_CACHE_URL,
#   STYX_API_PORT=3900, STYX_WEB_PORT=3901, JWT_SECRET, STYX_API_KEY_PEPPER
npm run dev:api & npm run dev:web
```

| # | Drive | Expect |
|---|---|---|
| 1 | `POST /contracts` on the **ledger** rail (`STYX_TEST_MONEY_MODE=true`, no Stripe key), then query `contracts` + `ledger_entries` | `ACTIVE`, hold id set, one bounty row, a balanced user→`SYSTEM_ESCROW` pair. Repeat the finalize → no duplicate bounty |
| 2 | Same with a real `sk_test_…` key and `STYX_TEST_MONEY_MODE=false` | 201 on the Stripe rail — not the 500 "Refusing to authorize a hold with real money" |
| 3 | Force the hold to fail, then run the scheduler pass | Row lands `RECONCILE_REQUIRED`, is swept, and a second create is allowed (slot not burned) |
| 4 | `GET /contracts` with `x-forwarded-for: 8.8.8.8`, `TRUST_PROXY=true` + `GEO=block` | **200**, `source: ip-country-only`. Contrast: `POST /contracts` same header → 403 `JURISDICTION_BLOCKED`; `91.198.174.192` (NL) → 403 on both |
| 5 | Same request with `MAXMIND_DB_PATH` set | Resolves to a real state, `source: maxmind`, higher confidence in the audit row |
| 6 | Boot with no `STRIPE_SECRET_KEY`; boot with only `REDIS_URL` | Both listen on :3900, `/health` 200 |
| 7 | Load `/dashboard` and `/help` in Chrome | Styled — real utilities and live `@theme` tokens, not native `<details>` and blue links. Screenshot both |
| 8 | Log in from an IP with no region | Dashboard renders; contracts section shows the jurisdiction notice; no "backend service is reachable" |
| 9 | `GET /api/docs`, paste the `CreateContractDto` example verbatim into `POST /contracts` | Accepted |
| 10 | `npm run web` in `src/mobile`, open `DigitalExhaustScreen` with no log provider installed | "Scan Unavailable" — **not** a clean `COMPLIANT`. Screenshot |
| 11 | Trigger a 500 with `NODE_ENV` and `STYX_DEBUG_ERROR_DETAILS` unset | No `details.stack` in the body |

Screenshots for 4, 7, 8, 10 delivered via `SendUserFile`; the report names what was sent.
