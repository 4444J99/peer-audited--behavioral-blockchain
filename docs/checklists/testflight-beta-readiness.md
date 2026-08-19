# TestFlight Beta Readiness Gate

**Question this gate answers:** Can we ship the iOS build to external testers?
**Created:** 2026-08-15 (the README advertised this checklist from May 2026, but no document
existed — its de-facto substitute has been the executable beta-readiness contract).

Two halves, deliberately separated:

1. **The executable half is NOT this file.** Product/server readiness is machine-checked by
   `npm run beta:readiness` against `docs/planning/planning--beta-readiness-contract.md`,
   recorded in `artifacts/beta-readiness-summary.json`. A checked box here never substitutes
   for that artifact being green.
2. **This file carries only what TestFlight distribution itself adds** — the Apple-side
   atoms and the human decisions. Per the 2026-08-14 scope amendment, the Phase 1 tester
   surface is the hosted WEB demo-beta (live and verified); iOS/TestFlight distribution is
   additive, and its single hard gate has been open 144+ days.

## Apple-side atoms (human/vendor — each already filed, cited here once)

- [ ] Apple Developer Program enrolment decided and executed
  — Owner: founder decision Q-7 (`planning--founder-decision-brief--2026-07-31.md`) +
  blocked-handoff #141. Default on record: individual enrolment under Anthony (1–3 days),
  transferred to the entity at NewCo. This is the only hard gate on distributing any iOS build.
- [ ] App Store Connect app record + bundle ID registered
  — Owner: #141 (follows enrolment mechanically).
- [ ] iOS build signing configured (certificates, provisioning via Expo/EAS)
  — Owner: #141; the repo side (eas config) is buildable once credentials exist.
- [ ] APNs key minted and uploaded to Expo
  — Owner: blocked-handoff #127. Server sender (`ExpoPushProvider`) already ships.
- [ ] Export compliance questionnaire submitted
  — Owner: #141 (App Store Connect form; the app uses standard HTTPS crypto only).

## Build/product items (buildable in-repo, verified before first external build)

- [ ] `src/mobile` compiles a device build via EAS with no simulator-only code paths
- [ ] Age gate + terms acceptance present in the registration flow (self-declared 18+ plus
      DOB collection — DOB is required by the API's age gate for monetized actions)
- [ ] Synthetic capture path clearly labeled non-production in tester-facing copy
      (`CameraModule` self-labels; native capture is TKT-P0-002, Gamma wave)
- [ ] Crash reporting wired for TestFlight builds (Sentry DSN via EAS secrets)
- [ ] TestFlight "What to Test" notes drafted from the demo runbook's tour script

## Human process items

- [ ] Internal dogfood cohort completed on TestFlight internal testing
  — Owner: issue #369; upstream of it, the dogfood-on-web scope decision
  (founder brief 2026-07-31, proposal 1) is the recorded unblock for the "zero users" root gate.
- [ ] External tester list (50–100) recruited — Owner: issues #372/#373.

## Pass criteria

The executable contract is green against a hosted target AND every Apple-side atom above is
closed. Any open item blocks external TestFlight distribution — it does not block the web
demo-beta, which is the Phase 1 tester surface of record.
