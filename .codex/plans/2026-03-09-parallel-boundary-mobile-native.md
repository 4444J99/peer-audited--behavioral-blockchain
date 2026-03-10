# Parallel Boundary: Mobile Native Blockers

Date: 2026-03-09
Repo: `peer-audited--behavioral-blockchain`
Session phase: `FRAME`

## Recommended isolated lane

Assign the second assistant to the `mobile-native` boundary only.

## Why this lane

- It is a documented Beta/Gamma blocker in the project backlog.
- It already has a clean ownership label in planning docs: `owner:mobile-native`.
- It stays mostly inside `src/mobile`, which minimizes overlap with API, web, desktop, and infra work.

## In-scope to-dos

1. Replace the current proof-capture placeholder with a true camera-first mobile flow.
2. Enforce "live capture only" behavior on mobile: no gallery upload path, camera watermark/nonce path preserved.
3. Wire a native iOS HealthKit bridge around the existing JS-side metadata guard.
4. Preserve and extend tests for camera flow and HealthKit manual-entry rejection.

## Source evidence

- `docs/FEATURE-BACKLOG.md`
  - `F-MOBILE-01` Native iOS Camera Module = `STUB`
  - `F-VERIFY-02` HealthKit Native Bridge (iOS) = `NOT_STARTED`
  - `F-MOBILE-03` Push Notifications = `PARTIAL`
- `docs/planning/planning--blocked-handoff-index--latest.md`
  - `#124` HealthKit Native Bridge (iOS)
  - `#134` Native mobile blockers: HealthKit + secure camera
- `docs/planning/planning--monthly-calendar--2026-03-08.md`
  - mobile-native work is explicitly tracked as a Beta/Gamma gate

## File boundary

Primary:

- `src/mobile/**`

Allowed if strictly necessary for typing/interfaces only:

- `src/shared/**`

Do not touch in this lane:

- `src/api/**`
- `src/web/**`
- `src/desktop/**`
- `infra/**`
- `.github/workflows/**`

## Explicitly out of scope

- Stripe / FBO settlement
- geofencing or KYC enforcement
- remote push infrastructure / release ops setup
- web dashboard or desktop moderation work

## Exit criteria

1. Mobile proof capture no longer depends on placeholder behavior.
2. Camera flow is camera-only and test-covered.
3. HealthKit bridge path exists and rejects manual entries via native-to-JS contract.
4. Any backend assumptions are documented without changing backend behavior.

## Safe complementary lane for another assistant

Anything outside `src/mobile`, with the cleanest adjacent option being API/compliance hardening in `src/api` around settlement, KYC, and geofence enforcement.
