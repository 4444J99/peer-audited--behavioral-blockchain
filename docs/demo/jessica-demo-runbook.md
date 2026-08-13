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
