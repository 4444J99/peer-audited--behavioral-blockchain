# Fix Remaining Gaps: Styx Project Cleanup

## Context

A full project audit found that Styx is code-complete across all 5 workspaces (425 tests, 6 validation gates, CI/CD, Terraform). Only two categories of gaps remain:

1. **One data placeholder** — `avgIntegrityDelta` hardcoded to `0` in the B2B data lake service
2. **Dead code** — 18 unused files in `src/pitch/` from the initial build iteration that was superseded by the rewrite

Fixing these closes every known code gap. The only remaining work after this is operational (native mobile bridges requiring Xcode/Android Studio, merchant underwriting).

---

## Task 1: Fix `avgIntegrityDelta` placeholder

**File**: `src/api/src/modules/b2b/datalake.service.ts:126-153`

The `extractBehavioralTrends` method computes monthly trends but returns `avgIntegrityDelta: 0` as a placeholder. The integrity system works like this:
- Completion → +5 integrity (from `calculateIntegrity` in `src/shared/libs/integrity.ts`)
- Failure → -15 integrity
- These deltas are applied in `src/api/src/modules/contracts/contracts.service.ts:344`

**Fix**: Add a computed column to the SQL query:

```sql
AVG(CASE
  WHEN c.status = 'COMPLETED' THEN 5
  WHEN c.status = 'FAILED' THEN -15
  ELSE 0
END) as avg_integrity_delta
```

Then map it: `avgIntegrityDelta: Math.round(Number(row.avg_integrity_delta) * 10) / 10`

**Test update**: `src/api/src/modules/b2b/datalake.service.spec.ts:30-37` — add `avg_integrity_delta: '-1.7'` to the mock row and assert it maps correctly.

---

## Task 2: Delete dead pitch components

These files were from the initial pitch deck build. The rewrite replaced them with the data-driven `SlideSection.tsx` component. None are imported by `App.tsx` or `SlideSection.tsx` — they only reference each other.

**Delete 18 files:**

```
src/pitch/src/components/SlideShell.tsx
src/pitch/src/components/Header.tsx
src/pitch/src/components/FooterNav.tsx
src/pitch/src/components/SideDots.tsx
src/pitch/src/components/ExpandableCard.tsx
src/pitch/src/components/StatCard.tsx
src/pitch/src/components/SlideContent.tsx
src/pitch/src/components/ContentRenderer.tsx
src/pitch/src/components/slides/S01_TitleHook.tsx
src/pitch/src/components/slides/S02_Problem.tsx
src/pitch/src/components/slides/S03_Solution.tsx
src/pitch/src/components/slides/S04_FuryBounty.tsx
src/pitch/src/components/slides/S05_LegalMoat.tsx
src/pitch/src/components/slides/S06_Market.tsx
src/pitch/src/components/slides/S07_BusinessModel.tsx
src/pitch/src/components/slides/S08_TechStack.tsx
src/pitch/src/components/slides/S09_Team.tsx
src/pitch/src/components/slides/S10_TheAsk.tsx
```

**Keep**: `P5Canvas.tsx` and `SlideSection.tsx` (actively used by App.tsx)

---

## Task 3: Update CLAUDE.md test count

The CLAUDE.md states "307 tests across 5 workspaces" — the actual count is now **425 tests** (api: 307, shared: 43, mobile: 44, web: 20, desktop: 11).

**File**: `CLAUDE.md` — update the test count reference.

---

## Verification

1. `cd src/api && npx jest datalake.service.spec.ts` — updated test passes
2. `cd src/pitch && npx tsc --noEmit` — no broken imports after deleting dead files
3. `cd src/pitch && npx vite build` — pitch deck still builds
4. `npx turbo run test` — all 425 tests pass
5. `git status` — only expected changes (no accidental deletions)
