# `scripts/validation/` — Surface Index

Numbered **validation gates** asserting the system's hard invariants (ledger, anti-spoof,
security, behavioral physics, brand/terminology). **User/buyer:** release engineer / QA /
compliance reviewer gating a release. The `.ts` gates hit a running API (need an API base
URL); `.sh`/`.js` gates scan source or the repo. Template:
[`../SURFACE-PACKET.template.md`](../SURFACE-PACKET.template.md).

| Name | Problem solved | Run | Verify | Safety | Level |
|------|----------------|-----|--------|--------|-------|
| `01-phantom-money-check.ts` | Double-entry ledger rejects unbalanced entries | `npx tsx scripts/validation/01-phantom-money-check.ts` (API base set) | Creates a contract; balance reflects the stake hold; fails on imbalance | Hits a running API; use staging, not prod | L1 |
| `02-simulator-spoof-check.ts` | Manual HealthKit/GoogleFit entries are blocked | `npx tsx scripts/validation/02-simulator-spoof-check.ts` | Spoofed-metadata proof is rejected by the Aegis protocol | Hits a running API | L1 |
| `03-the-full-loop.ts` | End-to-end contract lifecycle works over real HTTP+JWT | `npx tsx scripts/validation/03-the-full-loop.ts` | Login → create → proof → 3 Fury verdicts → resolution all succeed | Creates real records via API; staging only | L1 |
| `04-redacted-build-check.sh` | Client bundles contain no legally banned wording (Apple/Stripe triggers) | `bash scripts/validation/04-redacted-build-check.sh` | Exit 0 = clean; nonzero lists offending strings. Needs built bundles | Read-only grep of build output | L1 |
| `05-behavioral-physics-check.ts` | API enforces cool-off, downscaling, stake-tier limits | `npx tsx scripts/validation/05-behavioral-physics-check.ts` | 7-day lockout, post-failure downscale, and tier max all enforced | Hits a running API | L1 |
| `06-security-invariant-check.ts` | No dev tokens/secrets/backdoors in compiled prod output | `npx tsx scripts/validation/06-security-invariant-check.ts` | Exit 0 = none found (excludes `.spec/.test`); nonzero lists hits | Read-only scan of build output | L1 |
| `07-claim-drift-check.js` | Implementation-status matrix matches reality | `npm run validate:claims` | Reports drift between `docs/planning/implementation-status*.md` and code | Read-only | L1 |
| `08-brand-propagation-check.js` | Brand/terminology env vars propagate consistently | `node scripts/validation/08-brand-propagation-check.js` | Validates brand vars in `.env` (falls back to `.env.example`) | Read-only; reads env files | L1 |
| `08-fury-crucible-simulation.ts` | Fury network holds under adversarial reviewers | `npx tsx scripts/validation/08-fury-crucible-simulation.ts` | High-volume sim (honest Furies ~95% accuracy) reaches correct verdicts | Hits a running API; load — staging only | L1 |
| `09-realm-sync-check.ts` | Compile-time `REALM_REGISTRY` ↔ `realms` DB table agree | `npx tsx scripts/validation/09-realm-sync-check.ts` | Same realm IDs + stream-prefix mappings in TS and DB | Reads DB; needs DB access | L1 |
| `generate-handoff-index.js` | Build a handoff index from issues/repo metadata | `node scripts/validation/generate-handoff-index.js` | Emits the handoff index (repo from `package.json`, GitHub API) | Reads GitHub API; needs token for private | L1 |

> **Disable/uninstall (all):** stateless CLIs — stop invoking / remove from CI.
> **Proof:** `04`/`06` use `set -euo pipefail` / strict scans; `.ts` gates resolve an API
> base via `requireApiBase()` and fail fast when unset. Capture a live gate-run log on next release.
