# Plan: Reorganize and Rename docs/ Directory

## Context

The `docs/` directory has 37+ files with inconsistent naming conventions. Some use the project's double-hyphen kebab-case (`research--behavioral-economics.md`), others use Title Case with spaces (`Breakup Psychology And Loss Aversion.md`), and some use underscores or mixed conventions. There's also a typo in a subdirectory name (`outisde-sources/` → should be `outside-sources`). Planning/status files are loose at the root instead of organized into a subdirectory.

Goal: Apply consistent double-hyphen kebab naming, fix the typo, move planning files into `planning/`, and clean up reference library filenames — then update all cross-references.

## Target Directory Structure

```
docs/
├── FEATURE-BACKLOG.md                                    (keep at root)
├── MANIFEST.md                                           (keep at root)
├── index.html                                            (keep — GitHub Pages)
├── assets/                                               (keep — GitHub Pages build output)
│   └── *.js, *.css
├── adr/
│   └── 001-dual-layer-services-modules.md                (no change)
├── api/
│   └── spec.md                                           (no change)
├── architecture/
│   ├── architecture--feasibility-stack.md                 (no change)
│   ├── architecture--truth-blockchain.md                  (no change)
│   ├── architecture--technical-feasibility.md             (RENAME from technical-feasibility.md)
│   └── architecture--alpha-to-omega-plan.md               (RENAME from there+back-again.md)
├── brainstorm/
│   └── brainstorm--motivation-validation.md               (no change)
├── legal/
│   ├── legal--aegis-protocol.md                           (RENAME from compliance.md)
│   ├── legal--compliance-guardrails.md                    (no change)
│   ├── legal--gatekeeper-compliance.md                    (no change)
│   └── legal--performance-wagering.md                     (no change)
├── pitch/
│   └── pitch--styx-deck.pptx                              (no change)
├── planning/                                              (NEW directory)
│   ├── implementation-status.md                           (MOVE from root)
│   ├── phase1-private-beta-scope.md                       (MOVE from root)
│   ├── roadmap.md                                         (MOVE from root)
│   ├── roadmap--ai-workstreams.md                         (MOVE from root)
│   └── ship-baseline-report.md                            (MOVE from root)
└── research/
    ├── research--behavioral-economics.md                  (no change)
    ├── research--behavioral-engineering-masters.md         (no change)
    ├── research--behavioral-physics-manifesto.md           (no change)
    ├── research--competitor-teardown.md                    (no change)
    ├── research--differentiation-competitor.md             (no change)
    ├── research--habit-application.md                      (no change)
    ├── research--market-analysis.md                        (no change)
    ├── research--psychology-behavior.md                    (no change)
    ├── evaluation-to-growth--behavioral-physics.md         (no change)
    ├── evaluation-to-growth--strategic-review.md           (no change)
    ├── research--app-verification-tech-privacy-law.md      (RENAME)
    ├── research--b2b-expansion-heartbreak-niche.md         (RENAME)
    ├── research--behavior-change-app-design.md             (RENAME)
    ├── research--bounty-shame-protocol-safety-legality.md  (RENAME)
    ├── research--breakup-psychology-loss-aversion.md        (RENAME)
    ├── research--digital-exhaust-no-contact-contracts.md   (RENAME)
    ├── research--gamified-behavior-change-app-design.md    (RENAME)
    ├── research--prediction-markets-regulation-finance.md  (RENAME)
    ├── research--smart-contracts-behavioral-wagers.md      (RENAME)
    ├── research--commitment-device-market-analysis.md      (RENAME)
    └── reference-library/                                 (RENAME from outisde-sources/)
        ├── pressfield--the-war-of-art.txt                  (RENAME)
        ├── pressfield--the-war-of-art.epub                 (RENAME)
        ├── clear--atomic-habits.txt                        (RENAME)
        ├── wood--good-habits-bad-habits.epub                (RENAME)
        ├── brewer--the-craving-mind.pdf                    (RENAME)
        └── fogg--tiny-habits.azw3                          (RENAME)
```

## Rename Map (Old → New)

### Research files (10 renames)

| Old Name | New Name |
|----------|----------|
| `App Verification_ Tech, Privacy, Law.md` | `research--app-verification-tech-privacy-law.md` |
| `B2B Expansion From Heartbreak Niche.md` | `research--b2b-expansion-heartbreak-niche.md` |
| `Behavior Change App Design.md` | `research--behavior-change-app-design.md` |
| `Bounty_Shame Protocol Safety & Legality.md` | `research--bounty-shame-protocol-safety-legality.md` |
| `Breakup Psychology And Loss Aversion.md` | `research--breakup-psychology-loss-aversion.md` |
| `Digital Exhaust No Contact Contracts.md` | `research--digital-exhaust-no-contact-contracts.md` |
| `Gamified-Behavior-Change-App-Design.md` | `research--gamified-behavior-change-app-design.md` |
| `Prediction Markets_ Regulation & Finance.md` | `research--prediction-markets-regulation-finance.md` |
| `Smart Contracts for Behavioral Wagers.md` | `research--smart-contracts-behavioral-wagers.md` |
| `Styx_ Commitment Device Market Analysis.md` | `research--commitment-device-market-analysis.md` |

### Reference library (directory + 6 files)

| Old | New |
|-----|-----|
| `outisde-sources/` | `reference-library/` |
| `pressfield_the-war-of-art.txt` | `pressfield--the-war-of-art.txt` |
| `The War of Art (HowEntrepreneur.com) By   Steven Pressfield.epub` | `pressfield--the-war-of-art.epub` |
| `Atomic Habits_djvu.txt` | `clear--atomic-habits.txt` |
| `dokumen.pub_good-habits-bad-habits-...epub` | `wood--good-habits-bad-habits.epub` |
| `dokumen.pub_the-craving-mind-...pdf` | `brewer--the-craving-mind.pdf` |
| `dokumen.pub_tiny-habits-...azw3` | `fogg--tiny-habits.azw3` |

### Architecture (2 renames)

| Old | New |
|-----|-----|
| `technical-feasibility.md` | `architecture--technical-feasibility.md` |
| `there+back-again.md` | `architecture--alpha-to-omega-plan.md` |

### Legal (1 rename)

| Old | New |
|-----|-----|
| `compliance.md` | `legal--aegis-protocol.md` |

### Planning (5 moves, 0 renames)

| Old Location | New Location |
|--------------|-------------|
| `docs/roadmap.md` | `docs/planning/roadmap.md` |
| `docs/roadmap--ai-workstreams.md` | `docs/planning/roadmap--ai-workstreams.md` |
| `docs/phase1-private-beta-scope.md` | `docs/planning/phase1-private-beta-scope.md` |
| `docs/ship-baseline-report.md` | `docs/planning/ship-baseline-report.md` |
| `docs/implementation-status.md` | `docs/planning/implementation-status.md` |

## Files Requiring Cross-Reference Updates

### 1. `docs/FEATURE-BACKLOG.md`
- ~120 source references use old filenames (e.g., `Breakup Psychology And Loss Aversion.md` → `research--breakup-psychology-loss-aversion.md`)
- References to `compliance.md` → `legal--aegis-protocol.md`
- References to `roadmap.md`, `phase1-private-beta-scope.md`, `implementation-status.md` (filenames stay the same, just moved)
- References to `there+back-again.md` → `architecture--alpha-to-omega-plan.md`

### 2. `docs/MANIFEST.md`
- All `docs/research/...` file paths need updating for renamed files
- All `docs/legal/compliance.md` → `docs/legal/legal--aegis-protocol.md`
- Architecture path updates
- Planning paths: `docs/roadmap.md` → `docs/planning/roadmap.md`, etc.
- Reference library paths: `docs/research/outisde-sources/...` → `docs/research/reference-library/...`

### 3. `scripts/validation/07-claim-drift-check.js`
- Line 7: `docs/implementation-status.md` → `docs/planning/implementation-status.md`

### 4. `CLAUDE.md` (project root)
- References to doc file locations if any exist

### 5. Other docs that cross-reference each other
- `docs/legal/compliance.md` (internal references)
- `docs/legal/legal--compliance-guardrails.md` (may reference other legal docs)
- Research docs that reference each other

### 6. Cleanup
- Delete `docs/.DS_Store` and `docs/research/.DS_Store`

## Implementation Steps

1. **Create `docs/planning/` directory**
2. **Execute all `git mv` operations** (renames + moves) — one batch of commands
3. **Update `docs/FEATURE-BACKLOG.md`** — find/replace all old filenames with new ones
4. **Update `docs/MANIFEST.md`** — update all file paths in inventory tables
5. **Update `scripts/validation/07-claim-drift-check.js`** — fix implementation-status.md path
6. **Scan and update any other cross-references** in CLAUDE.md, README.md, legal docs, research docs
7. **Delete .DS_Store files** from git tracking
8. **Verify**: `git status` to confirm all renames tracked, no orphaned files

## Verification

- `git status` shows only renames/moves (no deletions without corresponding adds)
- `git diff --stat` confirms file count is unchanged
- `grep -r "outisde-sources" docs/` returns 0 results
- `grep -r "there+back-again" .` returns 0 results outside git history
- `grep -r "compliance\.md" docs/` returns only the new `legal--aegis-protocol.md` references
- `find docs -name "*.md" | grep -E "[A-Z].*[a-z].*[A-Z]"` returns 0 (no Title Case files except FEATURE-BACKLOG.md and MANIFEST.md which are intentionally uppercase)
- `scripts/validation/07-claim-drift-check.js` still references correct path
- All Title Case + space files are gone from `docs/research/`
