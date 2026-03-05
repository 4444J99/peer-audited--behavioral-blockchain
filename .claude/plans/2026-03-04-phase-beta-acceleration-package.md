# Phase Beta Acceleration Package

**Date**: 2026-03-04
**Status**: IMPLEMENTED
**Session**: acbb7aa → (next commit)

## Delivered

### Workstream 1: Stakeholder Chat v2 — Markdown + Export
- **ChatMessage.tsx**: Added lightweight markdown renderer (~100 lines, zero deps) handling: `**bold**`, `# headers`, `- lists`, `` `code` ``, ` ```blocks``` `, paragraph breaks. User messages render as plain text; assistant messages render with markdown.
- **ChatInterface.tsx**: Added Export button (downloads conversation as .md via Blob URL), message count in header.
- **Tests**: 25 new tests for `renderMarkdown`, `renderInline`, markdown-in-assistant-messages, export/message-count features.

### Workstream 2: Compliance Hardening (P0-003 + P0-004)
- **P0-004 — Fail-closed geofencing**: Changed `shouldFailOpenOnMissingLocation()` default from `true` (fail-open) to `false` (fail-closed). Now requires explicit `GEOFENCE_FAIL_OPEN_ON_MISSING_HEADERS=true` for local dev. Updated `.env.example`.
- **P0-003 — KYC tier gating**: Added `evaluateKycRequirement(userId, stakeAmount)` to CompliancePolicyService. TIER_1 ($20 max) exempt. Above $20 requires verified identity when `KYC_ENFORCEMENT_ENABLED=true`. Integrated into `createContract()` via optional CompliancePolicyService injection.
- **Tests**: Updated 3 existing tests for fail-closed default, added 7 new KYC tier gating tests (boundary, unverified, verified, missing service), added 4 new geofence guard tests.

### Workstream 3: Refund-Only Disposition Engine (P0-011)
- **stripe.service.ts**: Added `resolveDisposition(outcome, jurisdictionTier)` — COMPLETED always returns REFUND; FAILED+TIER_1 returns CAPTURE; FAILED+TIER_2/3 returns REFUND.
- **contracts.service.ts**: Updated `buildContractResolutionSideEffects` to accept optional `jurisdictionTier`, uses disposition engine for ledger routing. TIER_2 failures create `REFUND_ONLY_DISPOSITION` metadata type instead of `STAKE_CAPTURED`.
- **Tests**: 4 new disposition tests (all tiers × both outcomes).

## Test Results
- Web: 346 passed, 0 failed (was 321)
- API: 808 passed, 0 failed (was ~795)

## Files Modified (13)
- `src/web/components/chat/ChatMessage.tsx`
- `src/web/components/chat/ChatInterface.tsx`
- `src/web/components/chat/ChatMessage.test.tsx`
- `src/web/components/chat/ChatInterface.test.tsx`
- `src/api/src/modules/compliance/compliance-policy.service.ts`
- `src/api/src/modules/compliance/compliance-policy.service.spec.ts`
- `src/api/src/common/guards/geofence.guard.spec.ts`
- `src/api/src/modules/contracts/contracts.service.ts`
- `src/api/services/escrow/stripe.service.ts`
- `src/api/services/escrow/stripe.service.spec.ts`
- `src/api/services/ledger/ledger.service.ts` (unchanged — disposition is via metadata)
- `.env.example`

## Phase Beta Gate Status After This
| Ticket | Before | After |
|--------|--------|-------|
| TKT-P0-001 | PARTIAL | PARTIAL (Stripe dashboard external) |
| TKT-P0-002 | STUB | STUB (requires Xcode) |
| TKT-P0-003 | PLANNED | **IMPLEMENTED** |
| TKT-P0-004 | PARTIAL | **IMPLEMENTED** |
| TKT-P0-011 | NOT_STARTED | **IMPLEMENTED** |
| TKT-P1-009 | IMPLEMENTED | IMPLEMENTED |
