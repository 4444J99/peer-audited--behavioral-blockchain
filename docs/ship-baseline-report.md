# Ship Baseline Report (Phase 1 Private Beta)

Generated: 2026-02-26 (local execution)

## Scope

- Root baseline commands (`lint`, `test`, `build`)
- Notes on execution artifacts and blockers
- Seeded red-list for ship-readiness work

## Results

### Root `npm run lint`

- Status: `PASS`
- Notes:
  - `turbo run lint` completed successfully across all workspaces in the run.

### Root `npm test`

- Status: `PASS` (serial run)
- Notes:
  - Initial parallel run failed due a Next.js build lock at `src/web/.next/lock` while `build` was running concurrently.
  - Serial rerun passed across all workspace tests.
  - API tests emitted an open-handle warning:
    - `A worker process has failed to exit gracefully...`
    - Track as a non-blocking reliability smell for cleanup (`--detectOpenHandles` follow-up).

### Root `npm run build`

- Status: `PASS`
- Notes:
  - `@styx/web` build completed successfully.
  - `@styx/pitch` produced a large-chunk warning (>500kB after minification) but build passed.

## Red List (Current)

### Severity 1 (Blockers)

- None observed in serial baseline.

### Severity 2 (Release / CI Risk)

- Concurrent `test` + `build` can collide on `src/web/.next/lock`.
  - Impact: false negatives when multiple Next.js builds run simultaneously.
  - Action: avoid parallel `next build` executions against same workspace; clean `.next` tracking/ignore hygiene.

- Tracked generated artifacts still exist in repo (notably `src/desktop/src-tauri/target`).
  - Impact: noisy diffs, slower CI, accidental merge churn.
  - Action: update `.gitignore` and untrack generated directories.

### Severity 3 (Tech Debt / Beta Hardening)

- API test suite reports a forced worker exit / likely open handle.
  - Action: targeted `jest --detectOpenHandles` pass in API workspace after core beta patches land.

- `@styx/pitch` bundle size warning.
  - Action: defer to Phase 2 unless pitch deck becomes beta-critical runtime surface.

## Follow-up Commands (Next Truth Pass)

```bash
npm run lint
npm test
npm run build
cd src/api && npx jest --detectOpenHandles
```

