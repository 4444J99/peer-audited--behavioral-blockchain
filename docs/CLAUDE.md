# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

Documentation corpus for the **Styx** project (`peer-audited--behavioral-blockchain`). Contains 37+ documents across research, architecture, legal, planning, and brainstorm categories, plus a reference library of external source books. Also serves the interactive pitch deck via GitHub Pages (`index.html` + `assets/`).

For the full project context (build commands, architecture, testing), see the root `CLAUDE.md` one directory up.

## Directory Layout

```
docs/
├── FEATURE-BACKLOG.md          # 78-feature extraction from all 37 docs (keep at root)
├── MANIFEST.md                 # Annotated bibliography with DOC-* IDs (keep at root)
├── index.html + assets/        # GitHub Pages pitch deck (built from src/pitch)
├── adr/                        # Architecture Decision Records
├── api/                        # API specification (api--spec.md)
├── architecture/               # Technical architecture & feasibility docs
├── brainstorm/                 # Raw brainstorm transcripts
├── legal/                      # Compliance, wagering law, platform gatekeeper analysis
├── pitch/                      # PowerPoint deck (binary)
├── planning/                   # Roadmap, implementation status, beta scope, ship reports
└── research/                   # Behavioral science, market analysis, competitor teardowns
    └── reference-library/      # External source books (epub, pdf, azw3, txt)
```

## Naming Conventions

- **Double-hyphen kebab-case**: `{category}--{descriptor}.md` — the single hyphen separates words, the double hyphen separates the category prefix from the topic. Examples: `research--behavioral-economics.md`, `legal--aegis-protocol.md`, `architecture--alpha-to-omega-plan.md`.
- **Reference library**: `{author-surname}--{short-title}.{ext}` — e.g., `research--ref--pressfield--the-war-of-art.txt`, `research--ref--clear--atomic-habits.txt`.
- **Evaluation-to-Growth reviews**: `evaluation-to-growth--{topic}.md` (no `research--` prefix).
- **Root-level files**: UPPERCASE for governance (`FEATURE-BACKLOG.md`, `MANIFEST.md`).
- **No Title Case or spaces in filenames.** All doc filenames are lowercase kebab-case.

## Key Files

### MANIFEST.md

Annotated bibliography (v2.0.0) assigning stable `DOC-*` IDs to every file. Organized into 14 sections with tags, annotations, cross-reference index, and statistics. When adding a new document, assign the next sequential ID in its category (e.g., `DOC-RES-19`) and add an entry to the appropriate table.

### FEATURE-BACKLOG.md

78 features extracted from all 37 source documents. Each feature has a stable `F-{CATEGORY}-{NN}` ID, source citations (backreferencing doc filenames), implementation status (`IMPLEMENTED` / `PARTIAL` / `STUB` / `NOT_STARTED`), and spec details. The appendix contains a source-to-feature reverse mapping table.

### planning/implementation-status.md

Claim-to-Control Matrix mapping product/security/compliance claims to runtime enforcement status. Referenced by validation gate `scripts/validation/07-claim-drift-check.js`, which scans inline code paths in this file and verifies they exist on disk.

## Cross-Reference Integrity

- **FEATURE-BACKLOG.md** references doc filenames by basename (e.g., `` `research--behavioral-economics.md` ``). When renaming a doc, update all `**Source**:` lines and the appendix mapping table.
- **MANIFEST.md** references docs by full relative path (e.g., `` `docs/research/research--behavioral-economics.md` ``). When moving or renaming a doc, update the File column in the inventory tables.
- **07-claim-drift-check.js** validates that file paths mentioned in `docs/planning/planning--implementation-status.md` exist on disk. If you move files referenced there, update the paths or the check will fail in CI.

## Adding New Documents

1. Name the file using double-hyphen kebab-case convention for its category.
2. Place it in the correct subdirectory (`research/`, `legal/`, `architecture/`, `planning/`, `brainstorm/`).
3. Add a `DOC-*` entry to `MANIFEST.md` with ID, path, tags, and annotation.
4. If the document introduces new feature requirements, add `F-*` entries to `FEATURE-BACKLOG.md` with source citations.

## GitHub Pages

`index.html` and `assets/` are the Vite build output from `src/pitch`. Rebuilt via `cd src/pitch && npm run build` — output lands here automatically. Do not hand-edit these files.
