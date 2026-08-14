# Jessica demo runbook

## Before leaving

1. Use a machine with Node 24 LTS, this checked-out repository, and either Docker Compose or local PostgreSQL plus Redis.
2. Start from the recorded commit for the demo.
3. Run `npm run demo:reset:verify` to recreate the named `styx-demo` synthetic project and run the full live-stack gate without any gap between launch and verification. Do not call the demo green unless this exact command passes on the same commit.
4. Open the Tour URL printed by the launcher (`http://localhost:3001/tour` with Docker, or `http://127.0.0.1:4311/tour` with the native fallback) and keep the presenter script available offline.
5. Run `npm run demo:capture:rehearsal` to refresh the signed-in fallback recording against the commit you are presenting. It re-runs the verification gate itself, so this doubles as the final check.

If the launcher reports that a service "did not become ready" while its log shows the server started
cleanly, check `curl` before you check the app: an `--http2` line in the operator's curlrc (curl reads
`$CURL_HOME/.curlrc`) makes the readiness probe request an h2c upgrade that Next answers by closing the
connection. The launcher now runs `curl -q --http1.1` to ignore ambient curl config, and no browser
reproduces the failure, which is why it never appeared in CI.

The launcher creates a random synthetic-only login password outside version control. Reveal it only when rehearsing with `npm run demo:credentials`; it is never a live credential and must not be copied into slides, recordings, or messages.

The demo data is synthetic. With Docker, reset removes only containers and volumes in the named `styx-demo` Compose project. Without Docker, it uses only the explicitly named local database `styx_demo_styxlaunch` and Redis port `6391`. Neither path selects a hosted environment or payment account.

## Showing it to people in the room

The demo already binds every interface, so anyone on the same Wi-Fi can open it. The one address
that will **not** work from their device is the `127.0.0.1` one the launcher prints.

```bash
npm run demo:share        # prints the LAN URL, a QR code, and writes a printable PNG
```

That is the only command you need. The note/interaction collector now starts **with** the demo and
stops with it — `demo:launch` and `demo:reset:verify` bring it up detached, `demo:down` takes it
down, and everything collected is retained across a reset. Closing the terminal stops none of it.

Its start is deliberately non-fatal: if the collector cannot start, the launch prints a warning and
the demo comes up anyway. Telemetry must never turn a working demo into a failed launch.

The separate controls remain for when you want them: `npm run demo:feedback:status` (up? how much
collected?), `demo:feedback:stop`, `demo:feedback` to start it again. Starting twice is safe — it
reports the running instance rather than fighting for the port.

`demo:share` resolves the address on the interface carrying the default route, refuses to print an
address that is not actually answering, and tells you whether the collector is running — an empty
report afterwards should never be the first sign that it was not.

Everyone scans the QR, opens the tour, and drives it themselves. Read the synthetic password aloud
from `npm run demo:credentials`; never put it on a slide.

Two practical failure modes: the address changes when you join a different network (re-run
`demo:share`), and a sleeping machine drops everyone (`caffeinate -d` while presenting).

### Notes and interaction tracking

Every viewer can leave a note on any page, from the panel itself, with an optional name. Notes are
recorded against the route they were left on, which is what makes them actionable later — "this was
confusing" is worth much more when you know which screen it was about.

```bash
npm run demo:feedback:report   # who came, where they lingered, what they wrote
```

The report also prints **NOBODY OPENED** — the routes no one reached. That list is usually the more
useful half: a route nobody opened during a walkthrough is unreachable, uninteresting, or badly
signposted, and a report that only shows what people *did* look at hides all three.

The collector is a **separate, detached process** on purpose (`scripts/demo/feedback.sh` supervising
`feedback-server.mjs`, port 4312, append-only NDJSON under `artifacts/`, gitignored). Detaching
matters because of an asymmetry that is otherwise silent: the demo survives the terminal that
launched it, so a foreground collector would stop while the demo kept working perfectly — and the
first sign would be an empty report after everyone had gone home. `demo:share` probes its health for
the same reason.

It is not part of the product API: rehearsal
telemetry must never land in a migration, a seed, or the product database, and a telemetry failure
must never be able to break a demo launch. If it is not running, the tour behaves exactly as it does
without it — except that a viewer who tries to send a note is told plainly that it was not saved.

What is recorded: a random per-browser id, a name the viewer types, routes and dwell time, tooltip
opens, explanation depth, and notes. What is not: no IP addresses, no user agents, no account
identity, no page content. Everyone shares the same synthetic accounts, so account identity would be
noise — the self-entered name is the only attribution, and the panel says so on screen.

**Automation is excluded.** Every script that drives the demo in a browser — the fixture capture,
the snapshot sweep, both recorders — sets `styx.guidedTour.telemetry = off` in localStorage and is
therefore absent from the report. Before that existed, the report showed "8 viewer(s)" for a demo
no human had ever opened: a confident wrong answer to the only question the report exists to
answer. Set the same key by hand on a device you do not want counted.

## Showing it to people who are NOT in the room

The LAN demo needs everyone on the same Wi-Fi. For an investor or a remote reviewer there is a
Cloudflare Pages snapshot: the same app, exported as static files, with **no API, no PostgreSQL and
no Redis** behind it.

```bash
npm run snapshot:capture   # fixtures, recorded off the running demo
npm run snapshot:build     # static export into src/web/out
npm run snapshot:verify    # drives all 48 routes; exit 0 ⟺ shippable
npm run snapshot:serve     # preview on http://127.0.0.1:4315
npm run snapshot:deploy    # runs verify first, then wrangler pages deploy
```

**The snapshot is published at `https://styx-demo-snapshot.pages.dev`** (first deployed
2026-08-14, all 48 routes verified against the live host). `snapshot:deploy` re-publishes to
the same address; the URL is safe to hand to anyone — there is nothing behind it to break
into. One first-deploy lesson is now baked into the script: the deploy pins `--branch main`,
because wrangler otherwise labels the upload with the checkout's git branch and a
non-production branch becomes a *preview* deployment — the canonical URL serves nothing
while the deploy output still says "Success".

`snapshot:verify` is the gate, and `snapshot:deploy` runs it for you — you cannot publish
a snapshot that fails it. It exists because none of the cheaper checks can see the failure
that matters: a broken route still builds, still exports an HTML file, and still answers
`200`, because the error is *text inside the page*. It fails on three things — a route that
reaches for `/api`, a route that calls anything off-origin, and a route the snapshot layer
had no fixture for.

That last one is the valuable one, and it is worth reading as a product signal rather than
a packaging problem: the capture only records successful responses, so **a missing fixture
usually means that endpoint is broken on the live demo.** It found two, both invisible
until then because the pages caught their own errors and rendered a plausible empty state —
`/admin/cac-ltv` reported "$0 revenue, 0 users" for a permanently-403 endpoint, and
`/behavioral/habit-strength` was returning a 500 from an ambiguous SQL column.

Reads are answered from fixtures captured by driving the real demo as each persona and recording
what the app actually requests — not hand-written, because a hand-written fixture drifts and renders
a plausible, wrong screen. The capture refuses to write an empty snapshot for the same reason.

What the snapshot deliberately cannot do: **writes**. Creating a contract or attesting is refused in
plain language rather than faked into looking successful, and a screen with no captured fixture says
so instead of rendering an empty page that reads as a real but empty product. Anyone who needs to
actually click through a write needs the live demo.

Two operational traps, both of which cost real time:

- A snapshot build **overwrites `.next`**, so the running local demo afterwards serves snapshot
  client code that answers from fixtures and never calls `/api`. Run `npm run demo:reset:verify`
  before capturing again. `snapshot:build` prints this reminder.
- Preview with `snapshot:serve`, never `serve -s`. SPA mode rewrites every unmatched path to
  `index.html`, so each route returns the landing page with a `200` while the URL bar still looks
  right — a preview that looks fine and tests nothing.

Two things to say honestly if someone asks:

- The snapshot sends **no telemetry**. The note/interaction collector does not exist behind the
  pages.dev host, so notes there are a live-demo and hosted-beta feature. Ask a snapshot
  reviewer for comments directly.
- `/admin/cac-ltv` now shows real synthetic user, paying-user and revenue counts, but **CAC, LTV,
  payback and burn are still hard-coded zeros in the API** — the product does not compute them
  yet. That is a real gap, not a snapshot artifact; do not present those four tiles as measured.

### The hosted beta, for a remote tester who needs to actually DO things

The snapshot refuses writes by design. When a remote tester needs to create a contract,
attest, or drive any real interaction, use the **Render beta** — the same app and API,
hosted, seeded with the same synthetic personas, tour on every route.

```bash
gh workflow run beta-promotion.yml -f promotion_target=beta -f run_migrations=true
```

That one dispatch is the whole lifecycle: it checks the secrets, ensures the Render services
and their env vars (the tour flags are baked at build time — this is what turns the tour ON),
deploys API + web, migrates, **seeds the synthetic accounts and binds them to the beta demo
password**, then refuses to declare `promotion_ready` until three predicates pass: the smoke
suite, the strict readiness suite, and `beta_verify` — every tour route, signed in per
persona, tour present, no API errors.

What the tester needs from you: the beta web URL (it lives in the Render dashboard and in
the repo's `beta` environment secrets — deliberately not printed in this public file), one
account (`river@demo.styx.protocol` covers 40 of 48 tour chapters), and the demo password —
**spoken, never written**. The password is minted locally and stored in
`artifacts/styx-beta.env` (gitignored, 0600); the same value lives in the `BETA_DEMO_PASSWORD`
environment secret, and the `seed_beta` job is what keeps the two from drifting.

Notes and interaction tracking DO work on the beta: the promotion workflow provisions a
hosted collector (`styx-beta-feedback` on Render, 1GB disk) and bakes its URL into the web
build. Reading the summary requires the bearer token in `BETA_FEEDBACK_TOKEN` — viewer names
and notes are not public. Two honest limits: sessions hard-expire after 7 days of refresh
cookies; and the beta shares one synthetic world, so two testers at once will see each
other's contracts on the shared accounts — that is the design, not a leak.

## The guided tour (self-driving, for five different readers)

The demo explains itself. Every route in the app carries a synced panel on the right with the
route's truth label, a plain-language summary, and — for anyone past "New to this" — the mechanism
behind it. Numbered markers anchor to real elements on the page; clicking one says what that element
is. Arrow keys move between chapters.

This is what lets you, Jessica, an investor, a user tester and someone who has never heard of a
commitment contract all open the same demo and each get an explanation pitched at them: the
**Explain it for** control at the bottom of the panel switches depth without changing what is shown.
The choice is remembered per browser, so five people can be at five different depths simultaneously.

Coverage is enforced, not asserted: `src/web/lib/guided-tour/registry.test.ts` fails if any route in
`src/web/app` has no entry, if an entry points at a route that no longer exists, or if any summary is
short enough to be a placeholder. Widening the tour is a data edit in
`src/web/lib/guided-tour/registry.ts` — the overlay engine knows nothing about any specific route.

Two honest limits to state if asked. The truth labels in the panel are the tour's, sourced from
`/tour`'s own vocabulary — most routes do not render a label themselves. And a marker whose element
has moved is dropped silently rather than mispointing, so a UI change degrades the tour instead of
breaking the demo underneath it.

The tour is compiled out of any build that is not a demo build: it renders only when
`NEXT_PUBLIC_STYX_GUIDED_TOUR` or `NEXT_PUBLIC_STYX_TEST_MONEY_MODE` is `true` at build time.

## Rehearsed route

| Moment               | Route / account                           | Truth label                  |
| -------------------- | ----------------------------------------- | ---------------------------- |
| Explain the boundary | `/tour`                                   | Test-money beta              |
| Individual flow      | synthetic River account → `/dashboard`    | Working today                |
| Coach flow           | synthetic Moira account → `/practitioner` | Working today                |
| Enterprise direction | synthetic HR account → `/hr`              | Future enterprise capability |

## Screen-recorded fallback

Two fallbacks exist. Both are silent screen recordings of the local synthetic demo.

| File | What it shows | Command |
| --- | --- | --- |
| `docs/demo/assets/styx-tour-fallback.mp4` | The static `/tour` page only. No signed-in session, and not proof of the live-stack gate. | `npm run demo:capture:tour` |
| `docs/demo/assets/styx-signed-in-rehearsal.mp4` | All four moments in the table above, in order, signed in. | `npm run demo:capture:rehearsal` |

The rehearsal recorder runs the full live-stack gate itself before recording, so the artifact cannot
exist without a passing verification on the same commit — and its opening card names that commit and
the recording date, because the seeded attestation streaks are relative to `CURRENT_DATE` and shift
day to day. Sessions are established off camera through the demo API, so the synthetic password is
never typed, masked, or shown.

One thing to say out loud if asked: the truth labels on the three signed-in routes are **recorder
captions**, not product chrome. Only `/tour` renders its own label today. The captions are checked
against `/tour`'s label text before recording, so they cannot drift, but they are the recording's
annotation and the runbook says so rather than letting a viewer infer the app displays them.

## If something fails

- Do not switch to a real account, live payment setting, or personal source data.
- Open the prepared static `/tour` page if the signed-in flow is unavailable.
- State the relevant boundary: “This specific working-today route is not verified on this machine, so I am showing the prepared explanation rather than substituting a claim.”
- Record the failure against the demo commit, then reset and rerun `npm run demo:verify`.
