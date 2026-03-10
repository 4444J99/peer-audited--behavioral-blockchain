# Outstanding Suite Fixes

Date: 2026-03-09

Purpose:
- close the remaining code-side defects from the post-lane review
- remove false-positive verification failures caused by build/tooling drift
- leave only external release evidence as unresolved work

Applied fixes:
- removed the dead mobile dashboard `Fury` quick action and replaced it with `Profile`
- added dashboard test coverage for the locked beta quick actions
- aligned recovery detail-screen target label lookup to `metadata.recovery.noContactIdentifiers`
- removed duplicate `src/web/middleware.ts` so Next uses `proxy.ts` only
- wrapped `src/web/app/contracts/new/page.tsx` in `Suspense` for `useSearchParams()` compatibility
- corrected beta-readiness artifact behavior so skipped required gates report `incomplete` instead of `pass`

Verification target:
- mobile targeted suites
- web targeted suites
- web build
- beta readiness artifact generation

Expected remainder after this pass:
- external Apple/TestFlight/moderation evidence remains unresolved because it cannot be fabricated from code
