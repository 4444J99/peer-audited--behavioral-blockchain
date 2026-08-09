# Jessica demo runbook

## Before leaving

1. Use a machine with Node 24 LTS, this checked-out repository, and either Docker Compose or local PostgreSQL plus Redis.
2. Start from the recorded commit for the demo.
3. Run `npm run demo:reset` to recreate the named `styx-demo` synthetic Compose project.
4. Run `npm run demo:verify`. Do not call the demo green unless this exact command passes on the same commit.
5. Open the Tour URL printed by the launcher (`http://localhost:3001/tour` with Docker, or `http://127.0.0.1:4311/tour` with the native fallback) and keep the presenter script available offline.

The demo data is synthetic. With Docker, reset removes only containers and volumes in the named `styx-demo` Compose project. Without Docker, it uses only the explicitly named local database `styx_demo_styxlaunch` and Redis port `6391`. Neither path selects a hosted environment or payment account.

## Rehearsed route

| Moment | Route / account | Truth label |
| --- | --- | --- |
| Explain the boundary | `/tour` | Test-money beta |
| Individual flow | synthetic River account → `/dashboard` | Working today |
| Coach flow | synthetic Moira account → `/practitioner` | Working today |
| Enterprise direction | synthetic HR account → `/hr` | Future enterprise capability |

## Screen-recorded fallback

`docs/demo/assets/styx-tour-fallback.mp4` is a recorded static Tour fallback with the truth labels visible. It does not include a signed-in session and is not proof of the live-stack gate. After `npm run demo:verify` passes on the exact demo commit, record a signed-in rehearsal of the three routes above if a fuller fallback is needed; preserve the same labels.

## If something fails

- Do not switch to a real account, live payment setting, or personal source data.
- Open the prepared static `/tour` page if the signed-in flow is unavailable.
- State the relevant boundary: “This specific working-today route is not verified on this machine, so I am showing the prepared explanation rather than substituting a claim.”
- Record the failure against the demo commit, then reset and rerun `npm run demo:verify`.
