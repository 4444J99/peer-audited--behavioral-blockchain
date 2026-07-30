# Stub and Placeholder Inventory

Generated: 2026-06-06

This report closes the stub/placeholder audit sequence by separating real incomplete-implementation signals from ordinary test doubles, form placeholder attributes, and defensive guard clauses.

## Scope

Scanned source-bearing TypeScript/JavaScript surfaces under:

- `src/api`
- `src/web`
- `src/mobile`
- `src/desktop`
- `src/shared`
- `src/pitch`
- `src/ask-styx`
- `src/test-harness`
- `scripts`
- `.config`

Excluded dependency and build artifacts: `node_modules`, `dist`, `.next`, `.turbo`.

## Summary

| Audit item                                                                                          |   Result | Classification                                 |
| --------------------------------------------------------------------------------------------------- | -------: | ---------------------------------------------- |
| Comment markers: `TODO`, `FIXME`, `HACK`, `STUB`, `WIP`                                             |   2 hits | Stale knowledge snapshot, not executable code  |
| Explicit unimplemented code: `not implemented`, `unimplemented`, `throw new Error(...todo/stub...)` |   0 hits | No production blocker found                    |
| Bare `return;` / `return undefined` scan                                                            | 150 hits | Guard clauses and early exits, not stub bodies |
| UI placeholder text: `Coming soon`, `under construction`, `placeholder text`, `lorem ipsum`         |   0 hits | No placeholder UI copy found                   |
| Production mock data: `mockData`, `const mock*`, `MOCK:`, `STUB:`                                   |   0 hits | No production mock payloads found              |
| Stub/mock/dummy filenames                                                                           |    1 hit | Historical migration name, active schema       |
| Targeted `services/`, `modules/`, `screens/`, `panels/` scan                                        |    1 hit | Benign use of "stub" in a testability comment  |

## Findings By Workspace

### API

Priority: P2 documentation cleanup only.

Signals:

- `src/api/database/migrations/016_biometric_verification_stub.sql` is the only filename-based stub hit. The migration is real and adds `proofs.biometric_verified` plus `proofs.biometric_type`; the word `stub` is historical naming, not a placeholder implementation.
- `src/api/src/modules/b2b/webhook.service.ts` contains "unit tests can stub the actual network call" in a comment. This is an intentional test seam, not production mock behavior.
- `src/api/src/modules/auth/auth.service.ts` uses a dummy bcrypt compare path to avoid timing leaks when a user is missing. This is a security control, not fake auth.

Action:

- No code remediation required from this audit.
- Optional cleanup: rename or supersede the migration label in future documentation only. Do not rewrite applied migration filenames.

### Mobile

Priority: P1 tracked implementation gap, not hidden technical debt.

Signals:

- `src/mobile/components/CameraModule.tsx` is explicit about the beta preview path: it creates a synthetic capture session and warns that the path is non-production.
- `src/mobile/services/UploadService.ts` uses real API calls for presigned upload URL request, R2 upload, and upload confirmation.
- `src/web/lib/styx-knowledge.ts` still describes `F-MOBILE-01` as `STUB`. That snapshot is stale relative to the current code shape: the mobile surface is no longer a hidden stub, but native camera capture remains a tracked production gap.

Action:

- Keep native camera bridge work open as a product/implementation issue.
- Treat the current mobile code as a transparent beta preview path, not as completed native capture.

### Web

Priority: P2 stale generated knowledge cleanup.

Signals:

- `src/web/lib/styx-knowledge.ts` is the only executable-source file with `STUB` table entries.
- UI text scan found no `Coming soon`, `under construction`, `placeholder text`, or `lorem ipsum` production copy.
- Form `placeholder=` attributes exist, but those are normal input hints and were excluded from the blocker count.

Action:

- Regenerate or update the knowledge snapshot when the feature backlog is refreshed.

### Desktop

Priority: none from this audit.

Signals:

- No explicit unimplemented methods.
- No placeholder UI copy.
- No production mock data.

Action:

- No remediation required.

### Shared, Pitch, Ask Styx, Test Harness

Priority: none from this audit.

Signals:

- No explicit unimplemented methods.
- No placeholder UI copy.
- Test mocks are confined to test files and expected test setup.

Action:

- No remediation required.

## Command Evidence

Representative commands used:

```bash
rg -n --glob '*.{ts,tsx,js,jsx}' --glob '!**/node_modules/**' --glob '!**/dist/**' --glob '!**/.next/**' --glob '!**/.turbo/**' --glob '!docs/**' '\b(TODO|FIXME|HACK|STUB|WIP)\b' src scripts .config
rg -n --glob '*.{ts,tsx,js,jsx}' --glob '!**/node_modules/**' --glob '!**/dist/**' --glob '!**/.next/**' --glob '!**/.turbo/**' --glob '!**/*.spec.*' --glob '!**/*.test.*' --glob '!**/__tests__/**' --glob '!**/__mocks__/**' --glob '!docs/**' -i -e 'not implemented' -e 'unimplemented' -e 'throw new Error\([^)]*(todo|stub)' src scripts .config
rg -n --glob '*.{ts,tsx,js,jsx}' --glob '!**/node_modules/**' --glob '!**/dist/**' --glob '!**/.next/**' --glob '!**/.turbo/**' --glob '!**/*.spec.*' --glob '!**/*.test.*' --glob '!**/__tests__/**' --glob '!**/__mocks__/**' --glob '!docs/**' -i -e 'coming soon' -e 'under construction' -e 'not available yet' -e 'lorem ipsum' -e 'placeholder text' src scripts .config
find src scripts .config -type f \( -iname '*stub*' -o -iname '*placeholder*' -o -iname '*mock*' -o -iname '*dummy*' \) -not -path '*/node_modules/*' -not -path '*/dist/*' -not -path '*/.next/*' -not -path '*/.turbo/*'
```

## Closure Map

| Issue | Evidence                                                                              |
| ----- | ------------------------------------------------------------------------------------- |
| #218  | Comment-marker scan completed; only stale knowledge snapshot hits found               |
| #219  | Explicit unimplemented-code scan completed; no production blockers found              |
| #220  | UI placeholder-copy scan completed; no production blockers found                      |
| #221  | Production mock-data scan completed; no production blockers found                     |
| #222  | Filename scan completed; only historical migration name found                         |
| #223  | Targeted services/modules/screens/panels scan completed; no production blockers found |
| #224  | This report produced the required inventory artifact                                  |
| #436  | This report covers the general TODO/FIXME/stub scan request                           |

## Residual Work

The audit does not close the native mobile camera bridge gap. It clarifies that the gap is visible and tracked rather than hidden as a production stub. The current beta camera path is labeled synthetic and should remain so until native Swift/Kotlin capture is implemented and tested.

## Structural Debt (added 2026-07-30, branch `feat/omega-completion`)

The 2026-06-06 audit above scanned for *stub-shaped code*. It could not catch the
dominant debt pattern that actually accumulated afterward: **complete, tested modules
that were never wired into the running application**. A file-level stub scan reports
these as healthy. This section records that class of debt honestly — what this branch
closed, and what remains open.

### Closed by this branch

| Debt item | Evidence before | Resolution |
| --- | --- | --- |
| `SecurityModule` (anti-Sybil) built but unreachable | `src/api/src/modules/security/security.module.ts` existed; `src/api/src/app.module.ts` never imported it — no `/security/*` route was live | Registered in `app.module.ts` |
| AML HTTP surface built but unreachable | `src/api/src/modules/compliance/aml.controller.ts` (`/compliance/aml/*`) absent from `compliance.module.ts` `controllers` (only `ComplianceController` registered) | Registered in `compliance.module.ts` |
| Practitioner intelligence built but unprovided | `src/api/src/modules/behavioral/practitioner-intelligence.service.ts` not in `behavioral.module.ts` providers | Registered; practitioner web pages added |
| Kill switch not restart-safe | `JurisdictionDispositionMapper.refundOnlyMode` is a static in-memory boolean (`src/api/src/modules/compliance/jurisdiction-disposition.mapper.ts`); a deploy or crash silently disarmed an armed compliance kill switch | Persisted to DB; state re-hydrated on boot |
| Attestation crypto incomplete | `src/api/services/security/device-attestation.service.ts` performed structural + counter checks; its own doc-comment lists App Attest root-cert chain validation and Play Integrity JWT verification as required for production | Real signature/chain verification implemented (credential provisioning still human-gated, below) |
| Fitbit ingestion unverified | `src/api/src/modules/contracts/fitbit.controller.ts` accepted authenticated user-submitted readiness with no provider verification | Provider-verified ingestion added |
| Migration numbering gap | Sequence jumped `057_pod_broadcast_log_cohort.sql` → `059_aml_tables.sql`; `058` never existed | Migrations 058, 060–062 land with this branch's wiring (kill-switch state, retention policy, demo seed support) |
| No general retention scheduler | Only the GDPR erasure sweep existed (`src/api/src/modules/users/gdpr.scheduler.ts`, daily 04:00 cron) | Data-retention scheduler added for policy-driven purge beyond explicit erasure requests |
| Demo-critical web pages missing | No `kyc`, `practitioner`, or `circles` routes under `src/web/app/` despite the backing services being merged | Pages + demo seed added |
| Docs claimed CCPA/AML "remaining" | `docs/planning/concentric-circles-execution.md` listed CCPA data deletion and AML screening under Circle 5 "Remaining" although PR #835 had merged them (`src/api/src/modules/users/ccpa.service.ts`, `src/api/src/modules/compliance/aml-screening.service.ts`, migrations `054`/`059`) | Truth pass applied 2026-07-30 |

### Still open (not closed by this branch)

| Debt item | Nature | Where tracked |
| --- | --- | --- |
| Native mobile camera bridge (Swift/Kotlin) | Implementation gap; beta path is transparently synthetic | This report's Mobile section; `docs/CLAUDE.md` Remaining Limitations |
| HealthKit/Google Fit native bridges | Architectural stubs in `src/mobile/services/` | `docs/CLAUDE.md` Remaining Limitations |
| Apple App Attest root cert + Play Integrity secret provisioning | Ops/credentials, not code; attestation fails closed without them | `docs/enterprise/compliance-packaging.md` §2 |
| Stripe Identity production contract (KYC provider) | Vendor decision; mock adapter is the non-production default (`identity-provider.service.ts`) | Circle 2b, `docs/planning/concentric-circles-execution.md` |
| AML watchlist data feed (OFAC/sanctions) | `internal_watchlist`/`internal_blocklist` are internal tables with no external feed | `docs/enterprise/compliance-packaging.md` §2 |
| Practitioner seat billing | No Stripe price objects or seat-count entitlement code for the published $49/$149/$349/$999 tiers | `docs/enterprise/revenue-packaging.md` Tier 2 |
| `STATE_TIERS` (TS) vs `jurisdictions` (DB) dual source of truth | Admin DB edits do not update the compile-time map that guards read; no reconciliation check | `docs/legal/state-jurisdiction-matrix-DRAFT.md` Sign-Off Blockers #5 |
| NV/SD/AZ/MT tier assignments vs 50-state survey | Code more permissive than survey recommendation; counsel decision, not code | `docs/legal/state-jurisdiction-matrix-DRAFT.md` |
| Non-English key in CCPA types | `PersonalInfoCategory` in `src/api/src/modules/users/ccpa.service.ts` declares the field `'收集目的'` (should be `collectionPurpose`) — harmless but wrong, and a consumer-facing type | New; fix in a follow-up PR (rename is API-visible) |
| SOC 2 audit engagement, counsel retention, FBO production account | Human-gated business processes | Circle 2b / Circle 5 "Remaining (human-gated)" |

### Rule extracted

A stub scan answers "is this file finished?" It cannot answer "is this file *load-bearing*?"
Future audits of this repo must include a wiring pass: every `*.module.ts` diffed
against `app.module.ts` imports, every `*.controller.ts` diffed against its module's
`controllers` array, and every migration sequence checked for gaps.
