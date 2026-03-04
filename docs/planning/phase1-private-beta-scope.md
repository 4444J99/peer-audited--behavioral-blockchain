# Phase 1 Private Beta Scope (Mobile-First iOS)

This document is the scope lock for the first ship-ready private beta.

## Phase 1 Contract

- **Primary user surface**: iOS mobile app (TestFlight external beta)
- **Primary journey**: No-Contact recovery contracts
- **Money mode**: Test-money pilot (realistic hosted infra, no real-money settlement)
- **Region**: US allowlist only
- **Web role**: Admin/support companion (internal/operator workflows)
- **Desktop role**: Internal judge tool only
- **B2B/HR features**: Internal demo only (not tester-facing)

## Required Product Cuts

- Non-recovery contract categories may exist in code but are hidden or deprioritized in Phase 1 UX.
- Broad consumer web parity is explicitly deferred to Phase 2.
- Android formal beta distribution is deferred to Phase 2 unless iOS/TestFlight is blocked.
- KYC / age runtime enforcement remains out of scope for Phase 1 and must be clearly labeled as not active.

## Beta Labels (User-Facing)

All tester-facing surfaces should clearly communicate:

- `Private Beta`
- `Test-Money Pilot`
- `US Allowlist`

## Internal-Only Surfaces

The following are operator/internal-only in Phase 1:

- Web admin/support operations
- Desktop judge/dispute workflows
- B2B/HR demo flows

## Change Control

Any PR that expands tester-facing scope beyond this document must:

- update this file,
- update `docs/planning/implementation-status.md` if claims change,
- update `docs/planning/beta-readiness-contract.md` if release gates or readiness policy change,
- include an explicit rationale for the scope change.

## Readiness Source of Truth

Phase 1 release go/no-go is defined by `docs/planning/beta-readiness-contract.md`.

- Operational checks must run via `npm run beta:readiness`.
- The generated artifact at `artifacts/beta-readiness-summary.json` is the canonical evidence format.
