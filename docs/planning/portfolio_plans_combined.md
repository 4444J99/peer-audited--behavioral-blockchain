

====================
FILE: ~/.claude/plans/portfolio/curious-napping-gosling.md
====================

# CI/CD Pipeline Resilience: Post-Mortem + Cross-Organ SOP

## Context

The portfolio CI/CD pipeline was blocked for 17 days (Feb 17 – Mar 6, 2026). Unblocking required 10 commits across 4 push-watch-fix cycles, touching 8 files across 5 failure categories. The root cause was not any single bug but a **structural fragility**: 23 independent quality gates with hidden coupling and no mechanism to detect drift until CI failed sequentially.

This plan produces two deliverables:
1. **Generalized SOP** at `meta-organvm/organvm-corpvs-testamentvm/docs/operations/sop--cicd-resilience.md` — project-agnostic, reusable across all ~111 repos
2. **Portfolio hardening** — structural fixes to prevent this class of failure in this specific project

---

## Deliverable 1: Generalized SOP

**File:** `~/Workspace/meta-organvm/organvm-corpvs-testamentvm/docs/operations/sop--cicd-resilience.md`
**Format:** Follows existing corpus SOP conventions (`sop--` prefix, standard header with Created/Author/Status/Companions/Toolchain)

### Document Structure

```
# SOP: CI/CD Pipeline Resilience & Recovery

**Created:** 2026-03-06
**Author:** @4444j99 (AI-conductor model)
**Status:** ACTIVE
**Companions:** emergency-procedures.md, key-workflows.md, operational-cadence.md
**Precedent:** Portfolio pipeline blockage (Feb 17 – Mar 6, 2026)
**Toolchain:** gh CLI, project-specific quality scripts

> Systematic protocol for diagnosing, unclogging, and structurally
> hardening CI/CD pipelines across the ORGANVM system.
```

### SOP Content Sections

#### Part A: Thesis / Antithesis / Synthesis (the "why")

**THESIS — What mature quality systems do well:**
1. Comprehensive gate coverage catches real regressions (not theater)
2. Monotonic ratchets (date-based, phase-based) create sustainable improvement
3. Separating generation from validation catches generator bugs
4. Build-first gating prevents phantom passes (stale artifact false-greens)
5. The "plan all fixes, push once" approach is orders of magnitude faster than serial fix-push-watch

**ANTITHESIS — Structural failure modes common to all quality-gated projects:**
1. **Drift magnets** — Any manually maintained list that mirrors filesystem structure will drift. Law: `P(drift) → 1` as `t → ∞`
2. **Sequential discovery tax** — N hidden failures cost `N × cycle_time` when found serially, but `~1 × cycle_time` if found in parallel locally. The multiplier is the CI round-trip time.
3. **CI-only validation gap** — Checks that can only run in CI (browser-dependent, runner-dependent) create an irreducible feedback delay. Minimize the set of CI-only checks.
4. **Invisible coupling** — When changing file A requires also changing file B, but no document or error message tells you about B until CI fails.
5. **Environment-blind thresholds** — A threshold that works on a developer's M3 but flakes on a GitHub Actions runner is not a quality gate; it's a coin flip.
6. **No local pre-flight** — If nothing runs before `git push`, every mistake costs a full CI cycle.

**SYNTHESIS — Universal structural principles:**
1. **Derive, don't duplicate.** Generate lists from filesystem/data at runtime. Never maintain a parallel copy.
2. **Preflight locally.** Every project should have a single command that runs all locally-reproducible checks.
3. **Document coupling.** Maintain a human-readable coupling map: "if you change X, also change Y, enforced by Z."
4. **Split thresholds by environment.** CI floors (tolerant, catches regressions) vs lab/local targets (aspirational, never blocks deploy).
5. **Diagnose fully before fixing.** Collect the entire failure surface before writing the first line of code.

#### Part B: The Protocol (the "how")

**Phase 0 — Triage** (5 min, any project)
```bash
gh run list --limit 1 --status failure --repo OWNER/REPO
gh run view RUN_ID --repo OWNER/REPO
gh run view RUN_ID --repo OWNER/REPO --log-failed | tail -100
```
Output: complete list of all failing jobs + error messages. Do NOT fix anything yet.

**Phase 1 — Classify** (10 min)
Categorize each failure:
| Category | Pattern | Fix archetype |
|----------|---------|---------------|
| Drift | Hardcoded list ≠ filesystem | Make dynamic |
| Threshold | Score too strict for CI | Relax to env-appropriate value |
| Formatter | Generated file fails lint | Exclude from formatter |
| Stale artifact | Old manifest/summary | Regenerate |
| Missing dep | Tool not installed in CI | Add install step |
| Code bug | Invalid HTML, broken link | Fix the code |

**Phase 2 — Reproduce locally** (15 min)
```bash
# Project-specific preflight (if it exists):
npm run preflight        # or quality:local:no-lh, or pytest, etc.
# Generic fallback:
<lint> && <typecheck> && <build> && <test>
```
Fix all locally-reproducible failures in a single batch.

**Phase 3 — Fix CI-only failures** (varies)
For browser-dependent / runner-dependent failures:
1. Extract exact values from CI logs (not just "failed")
2. Distinguish environmental flake from real regression
3. Fix r

====================
FILE: ~/.claude/plans/portfolio/2026-03-06-portfolio-route-manifest-drift-analysis.md
====================

# Portfolio Route Manifest Drift Analysis

**Date:** 2026-03-06  
**Project:** 4444J99/portfolio  
**Status:** Investigation Complete

## Executive Summary

The Astro portfolio project has an architectural drift problem where the committed route manifest (`scripts/runtime-a11y-routes.json`) can become stale when data files change. The manifest is generated from three data sources (personas.json, targets.json, project-index.ts) but committed to the repository. Changes to these files invalidate the manifest, causing CI failures during the `test-e2e` job's manifest drift detection.

## The Route Manifest System

### Three Components

1. **Route Generation (Dynamic Pages)**
   - `src/pages/for/[target].astro` — generates routes from `targets.json` via `getStaticPaths()`
   - `src/pages/resume/[slug].astro` — generates routes from `personas.json` via `getStaticPaths()`
   - `src/pages/logos/[slug].astro` — generates routes from content collection via `getCollection('logos')`
   - `src/pages/og/[...slug].png.ts` — generates OG image routes for projects, personas, and targets

2. **Manifest Generation**
   - `scripts/sync-a11y-routes.mjs` reads:
     - Static hardcoded routes (28-48 lines)
     - Project slugs from `src/internal/project-index.ts` via regex
     - Persona slugs from `src/data/personas.json`
     - Target slugs from `src/data/targets.json`
   - Writes to `scripts/runtime-a11y-routes.json` (COMMITTED to repo)

3. **Manifest Validation**
   - `scripts/check-runtime-route-manifest.mjs` compares:
     - Committed manifest file (`scripts/runtime-a11y-routes.json`)
     - Actual built routes (all `.html` files in `dist/`)
   - Fails if discrepancies exist

### Data Dependency Chain

```
personas.json ─┐
targets.json  ├──> sync-a11y-routes.mjs ──> scripts/runtime-a11y-routes.json (COMMITTED)
project-index ┘
     ↓
     Triggers getStaticPaths() at build time
     ↓
     dist/*.html files
     ↓
     check-runtime-route-manifest.mjs validates against COMMITTED manifest
```

## The Drift Problem

### Root Cause

The manifest is **committed** but generated from **data files**. When data files change (adding a persona, target, or project), the committed manifest becomes stale.

### CI Execution Order (from quality.yml)

1. **Build job** (lines 63-93)
   - Runs `npm run sync:github-pages`, `npm run sync:vitals`, `npm run sync:omega`, `npm run sync:identity`
   - Does **NOT** run `sync:a11y-routes`
   - Builds site → generates routes via getStaticPaths() → creates dist/*.html

2. **test-a11y job** (lines 119-147, depends on build)
   - Runs `npm run test:a11y:runtime` (line 139)
   - Which calls `npm run sync:a11y-routes` (package.json line 51)
   - REGENERATES the manifest in-memory
   - Then audits all routes in the regenerated manifest

3. **test-e2e job** (lines 149-177, depends on build)
   - Runs `npm run test:runtime:errors` (line 169)
   - Which calls `npm run check:runtime-route-manifest` (package.json line 55)
   - Compares COMMITTED manifest against dist files
   - **FAILS if committed manifest is stale**

### The Race Condition

```
SCENARIO: Developer adds new persona to personas.json and pushes
│
├─ Build completes: getStaticPaths() uses personas.json → generates new route in dist/
├─ build job SKIPS sync:a11y-routes → committed manifest still has old persona list
│
├─ test-a11y job: sync:a11y-routes REGENERATES manifest with new persona
│  (but this is in-memory, not committed)
│
└─ test-e2e job: check-runtime-route-manifest reads COMMITTED manifest
   ✗ FAILS: committed manifest doesn't match dist/ routes
```

### Evidence of the Problem

From `scripts/check-runtime-route-manifest.mjs` (lines 75-81):
```javascript
if (missingInManifest.size > 0) {
  console.error('Routes exist in dist but not in manifest:');
  // FAILS
}
if (notInDist.size > 0) {
  console.error('Routes in manifest but not in dist:');
  // FAILS
}
```

The script reads `scripts/runtime-a11y-routes.json` (line 7), which is the committed version.

## Architectural Issues

### Issue 1: Committed Manifest + Data File Dependencies

**Problem:** The manifest is version-controlled but its contents are derived from uncommitted data dependencies.

**Impact:** 
- Data changes invalidate the manifest
- Manual re-commit of manifest required after data updates
- CI failures are intermittent (depend on what changed)

### Issue 2: CI Execution Order Mismatch

**Problem:** 
- Build job does NOT regenerate manifest
- test-a11y job regenerates manifest but doesn't update the committed version
- test-e2e job validates against the committed version

**Impact:**
- The regeneration in test-a11y is wasted effort
- Committed manifest is used for validation, making test-a11y regeneration irrelevant

### Issue 3: No Pre-commit Hook or Pre-build Step

**Problem:** There's no mechanism to ensure the committed manifest stays in sync with data files before CI runs.

**Impact:**
- Developers can commit data changes without updating the manifest
- CI discovers 

====================
FILE: ~/.claude/plans/portfolio/2026-03-06-portfolio-audit-and-implementation-strategy.md
====================

# Portfolio Audit & Implementation Strategy (2026-03-06)

## Executive Summary

Completed comprehensive audit of the [name redacted] portfolio project at `~/Workspace/4444J99/portfolio/`. The project is an Astro 5 static site deployed to GitHub Pages with sophisticated subsystems including persona-driven resume generation, AI-powered strike intelligence, generative art via p5.js, D3 data visualizations, and a quality ratchet governance framework. 

**Current Status:** PUBLIC_PROCESS promotion state, CANDIDATE tier, fully functional with 12 identified improvement opportunities across 3 priority levels.

**Git Status:** Main branch clean, 20 recent commits, last push 2026-02-28.

---

## Project Architecture Summary

### Technology Stack
- **Static Site Generator:** Astro 5 (Node >= 22)
- **Deployment:** GitHub Pages at https://4444j99.github.io/portfolio/ with `/portfolio` base path
- **Frontend:** TypeScript strict mode, Astro components with scoped CSS
- **Styling:** CSS custom properties (no framework), Fibonacci spacing, glassmorphism, dark theme (#0a0a0b), gold accent (#d4a853)
- **Generative Art:** p5.js with 30 named sketches (atoms, conductor, hero, spiral, swarm, etc.) bound to persona.sketchId
- **Data Visualization:** D3.js with dynamic imports and design-system tokens
- **Testing:** Vitest (80% stmt/75% branch/80% func/80% line), jsdom, coverage via V8
- **Linting:** Biome (tabs, single quotes, trailing commas, 100-char line width)
- **Build:** Manual chunk splitting (vendor-p5, vendor-mermaid, vendor-cytoscape, vendor-katex), 1800kB chunk limit
- **CI/CD:** GitHub Actions (quality.yml, deploy.yml, build-resume.yml)

### Core Systems

#### 1. Persona System
**File:** `src/data/personas.json`

Defines 5 career personas (e.g., `ai-systems-engineer`, `systems-architect`) with fields:
- `id` — unique identifier
- `title` — display name
- `thesis` — career positioning statement
- `stack` — technology areas
- `featured_projects` — array of project IDs
- `market_summary` — market context for persona
- `sketchId` — p5.js sketch name for visual binding

**Usage:** Resume pages (`/resume/[slug]`), strike targets (`/for/[target]`), AI content generation (scout/strike scripts).

#### 2. Strike Intelligence Engine
**Components:**
- `scripts/scout-agent.mjs` — discovers candidates per persona, writes to `src/data/scout-candidates.json`
- `scripts/strike-new.mjs` — creates strike target in `src/data/targets.json` + generates OG image at `public/og/strikes/`
- `scripts/operative-sweep.mjs` — batch-processes `intake/job-descriptions/*.txt` into strike targets

**Dependency:** Requires `gemini` CLI installed. Falls back to `[DRAFT]` templates on failure.

#### 3. Quality Ratchet System
**Files:** `.quality/ratchet-policy.json`, `.quality/security-policy.json`, `scripts/check-bundle-budgets.mjs`

**Phase Model:** W6 (local), W10 (CI) — no phase mismatch allowed.

**W10 Thresholds:** 45% stmt / 32% branch / 32% func / 45% line coverage.

**Governance:** `quality-governance.test.ts` ensures README.md ratchet values sync with JSON policy files. Any drift fails tests.

#### 4. Omega System
**File:** `src/data/omega.json`

Maturity scorecard tracking system progress across horizons and criteria (met/in_progress/not_started). Renders color-coded progress bars on `src/pages/omega.astro`.

#### 5. Consult Worker (Cloudflare)
**Location:** `workers/consult-api/`

- Endpoint: `POST /api/consult`
- Backend: Workers AI model inference + deterministic fallback
- Database: D1 SQLite `consult_logs` table
- Response contract: `{ok, mode: "ai|fallback", analysisHtml, analysisText, requestId, durationMs}`

#### 6. Workspace Packages
- `packages/github-pages-index-core` — GitHub Pages indexing + telemetry
- `packages/quality-ratchet-kit` — ratchet policy loading, phase resolution, governance validation
- `packages/sketches` — p5.js sketch registry with typed exports

### Data Pipeline
`src/data/` contains JSON generated by `npm run generate-data` from `../ingesting-organ-document-structure/`:
- `personas.json` — 5 career personas
- `targets.json` — strike targets with [DRAFT] placeholder content for some
- `omega.json` — maturity scorecard
- `scout-candidates.json` — discovered candidates
- `projects.json` — case study data
- `github-pages.json` — analytics metadata

---

## Identified Weaknesses (12 Total)

### Priority 0 (Blocking Career Path)
**W1: Resume PDFs Return 404s**
- **Impact:** Blocking career critical path for portfolio visitors
- **Root Cause:** PDF generation likely failing due to W3 (typo in orchestrate-resume-pdfs.mjs)
- **Fix:** Complete W3 (typo fix) first, then test PDF generation

**W2: [DRAFT] Placeholder Content in Strike Targets**
- **Impact:** Confuses portfolio visitors; appears unfinished
- **Files:** `src/data/targets.json` (Palantir, OpenAI targets)
- **Fix:** Write real, compelling content for at least these 2 targets
- **Effort:** ~30 min per target (research company culture, tailor mes

====================
FILE: ~/.local/share/gemini/tmp/portfolio/03f32a7a-3f12-4cde-b357-a06f20a4a97a/plans/evaluation-to-growth-review.md
====================

# Plan: Project-Wide Review & Critique (Evaluation-to-Growth)

## Objective
Perform a comprehensive project-wide review of the `portfolio` project using the `evaluation-to-growth` framework. Address identified weaknesses in the quality pipeline, particularly around PageSpeed Insights (PSI) quota issues and automation of quality artifacts.

## Key Files & Context
- `package.json`: Main entry point for scripts and dependencies.
- `README.md`, `GEMINI.md`, `CLAUDE.md`: Project documentation and mandates.
- `.quality/`: Directory containing all quality policies and metrics.
- `scripts/lighthouse-cloud.mjs`: Script for cloud-based Lighthouse audits.
- `scripts/generate-quality-summary.mjs`: Script that aggregates all metrics into a markdown report.
- `scripts/verify-quality-contracts.mjs`: Ensures metrics are fresh and valid.

## Implementation Steps

### 1. Phase 1: Evaluation (Critique & Analysis)
- [ ] **Critique**: Assess the current state of the project.
    - **Strengths**: Robust quality ratchet, clear organization, excellent documentation, high performance (100 LH).
    - **Weaknesses**: PSI API quota issues (429 errors), complexity of script ecosystem, some manual sync steps remaining.
- [ ] **Logic Check**: Verify consistency between policy JSONs and documentation.
- [ ] **Logos/Pathos/Ethos**: Evaluate the "professional rigor" signal and strategic impact of the "Operative Handbook".

### 2. Phase 2: Reinforcement (Synthesis & Refinement)
- [ ] **Refine Lighthouse Cloud**: Update `scripts/lighthouse-cloud.mjs` to handle 429 errors more gracefully, possibly by implementing a retry mechanism with backoff or a clearer "quota exceeded" status that doesn't necessarily fail the entire build if a local fallback is available.
- [ ] **Consolidate Quality Lifecycle**: Ensure all critical data syncs (`sync:vitals`, `sync:omega`, etc.) are correctly hooked into the build lifecycle to prevent stale data.

### 3. Phase 3: Risk Analysis (Blind Spots & Shatter Points)
- [ ] **Blind Spot**: Check if `green-run-history.json` is actually working. The quality summary shows it as "skipped".
- [ ] **Shatter Point**: The PSI API failure (`429`) is a shatter point for the "lighthouse:cloud" command.

### 4. Phase 4: Growth (Bloom & Evolve)
- [ ] **Bloom**: Propose a "Quality Scoreboard" or more detailed "Green Run" visualization on the `/dashboard` page.
- [ ] **Evolve**: Produce an updated `docs/evaluation-to-growth-report.md` reflecting the latest state and improvements.

## Verification & Testing
- [ ] Run `npm run verify:quality` to ensure all quality artifacts are fresh.
- [ ] Run `npm run typecheck:strict` to verify type-safe quality thresholds.
- [ ] Manually check `.quality/quality-summary.md` for completeness.
- [ ] Verify governance sync via `quality-governance.test.ts`.


====================
FILE: ~/.local/share/gemini/tmp/portfolio/plans/market-aligned-resume-system.md
====================

# Plan: Market-Aligned Resume System (MARS)

This plan implements a "Dual Narrative Layering" and "Signal Translation" system for the portfolio, addressing the gap between high-concept polymathic work and role-specific hiring requirements.

## 1. Core Objectives
- Create dedicated narrative pages for specific job roles (Software Engineer, Product Engineer, Full-Stack).
- Map existing projects to these roles using "Signal Engineering" (outcomes, impact metrics, tech keywords).
- Maintain the "Visionary Polymath" identity as a secondary layer for collaborators and deep-dives.
- Improve ATS and recruiter legibility by providing clear, tailored entry points.

## 2. Feature Identification
- **Role-Specific Pages:** Distinct URLs for each persona.
- **Persona Switcher:** UI component to toggle between "Engineering" and "Visionary" views.
- **Market Data Layer:** Role-specific project descriptions and impact statements.
- **Signal Translation:** Re-weighting project importance based on the active persona.

## 3. Implementation Steps

### Phase 1: Data Modeling
1. **Create `src/data/market-personas.json`**:
   - Define metadata for each role:
     - `slug`: (e.g., `software-engineer`)
     - `title`: (e.g., "Software Engineer — Backend Focus")
     - `summary`: Role-aligned career summary.
     - `core_keywords`: Primary tech stack tags.
2. **Update `src/data/projects.json`**:
   - Add `market_narratives` field to key projects.
   - Map project outcomes to specific roles.

### Phase 2: Component Development
1. **`src/components/resume/PersonaSwitcher.astro`**:
   - A sticky or header-based navigation to switch between resume views.
2. **`src/components/resume/MarketResumeItem.astro`**:
   - A specialized project display component that prioritizes impact and tech stack.
3. **`src/components/resume/MarketResumeTemplate.astro`**:
   - A reusable template for role-based pages, integrating the header, summary, and filtered projects.

### Phase 3: Page Implementation
1. **`src/pages/resume/software-engineer.astro`**:
   - Focus: Python, TS, Architecture, Testing.
   - Featured: `Agentic Titan`, `Recursive Engine`, `UCC Scraper`.
2. **`src/pages/resume/product-engineer.astro`**:
   - Focus: AI Systems, Product Strategy, Delivery.
   - Featured: `Agentic Titan`, `AI-Conductor`, `Aetheria RPG`.
3. **`src/pages/resume/full-stack-engineer.astro`**:
   - Focus: Next.js, FastAPI, Hexagonal Architecture.
   - Featured: `in-midst-my-life`, `UCC Scraper`, `Metasystem Master`.
4. **Update `src/pages/resume.astro`**:
   - Repurpose as the "Visionary Polymath" resume.
   - Add the `PersonaSwitcher` to link to tailored views.

### Phase 4: Content Authoring (Signal Translation)
- Draft impact statements for each project tailored to the role.
- *Example (Software Engineer)*: "Built a model-agnostic multi-agent swarm architecture in Python with 1,095+ tests (adversarial, chaos, e2e)."
- *Example (Product Engineer)*: "Designed a self-organizing system for autonomous task completion across 9 topologies, optimizing for LLM orchestration efficiency."

## 4. Verification & Quality Gates
- **Link Check:** Ensure all personas are inter-linked correctly.
- **SEO/Meta:** Verify page titles and descriptions are optimized for each role.
- **A11y:** Ensure the switcher is keyboard-accessible.
- **Mobile:** Check layout on small screens.

## 5. Prioritization
- **High:** Data layer, Basic role pages, Switcher.
- **Medium:** Detailed market narratives, SEO optimization.
- **Low:** Specialized PDF downloads for each persona.


====================
FILE: ~/Workspace/4444J99/portfolio/.gemini/plans/2026-02-28-evaluation-to-growth.md
====================

# Plan: Project-Wide Review & Critique (Evaluation-to-Growth)

## Objective
Perform a comprehensive project-wide review of the `portfolio` project using the `evaluation-to-growth` framework. Address identified weaknesses in the quality pipeline, particularly around PageSpeed Insights (PSI) quota issues and automation of quality artifacts.

## Key Files & Context
- `package.json`: Main entry point for scripts and dependencies.
- `README.md`, `GEMINI.md`, `CLAUDE.md`: Project documentation and mandates.
- `.quality/`: Directory containing all quality policies and metrics.
- `scripts/lighthouse-cloud.mjs`: Script for cloud-based Lighthouse audits.
- `scripts/generate-quality-summary.mjs`: Script that aggregates all metrics into a markdown report.
- `scripts/verify-quality-contracts.mjs`: Ensures metrics are fresh and valid.

## Implementation Steps

### 1. Phase 1: Evaluation (Critique & Analysis)
- [ ] **Critique**: Assess the current state of the project.
    - **Strengths**: Robust quality ratchet, clear organization, excellent documentation, high performance (100 LH).
    - **Weaknesses**: PSI API quota issues (429 errors), complexity of script ecosystem, some manual sync steps remaining.
- [ ] **Logic Check**: Verify consistency between policy JSONs and documentation.
- [ ] **Logos/Pathos/Ethos**: Evaluate the "professional rigor" signal and strategic impact of the "Operative Handbook".

### 2. Phase 2: Reinforcement (Synthesis & Refinement)
- [ ] **Refine Lighthouse Cloud**: Update `scripts/lighthouse-cloud.mjs` to handle 429 errors more gracefully, possibly by implementing a retry mechanism with backoff or a clearer "quota exceeded" status that doesn't necessarily fail the entire build if a local fallback is available.
- [ ] **Consolidate Quality Lifecycle**: Ensure all critical data syncs (`sync:vitals`, `sync:omega`, etc.) are correctly hooked into the build lifecycle to prevent stale data.

### 3. Phase 3: Risk Analysis (Blind Spots & Shatter Points)
- [ ] **Blind Spot**: Check if `green-run-history.json` is actually working. The quality summary shows it as "skipped".
- [ ] **Shatter Point**: The PSI API failure (`429`) is a shatter point for the "lighthouse:cloud" command.

### 4. Phase 4: Growth (Bloom & Evolve)
- [ ] **Bloom**: Propose a "Quality Scoreboard" or more detailed "Green Run" visualization on the `/dashboard` page.
- [ ] **Evolve**: Produce an updated `docs/evaluation-to-growth-report.md` reflecting the latest state and improvements.

## Verification & Testing
- [ ] Run `npm run verify:quality` to ensure all quality artifacts are fresh.
- [ ] Run `npm run typecheck:strict` to verify type-safe quality thresholds.
- [ ] Manually check `.quality/quality-summary.md` for completeness.
- [ ] Verify governance sync via `quality-governance.test.ts`.


====================
FILE: ~/Workspace/4444J99/portfolio/.gemini/plans/2026-03-05-evaluation-to-growth-plan.md
====================

# Implementation Plan - Evaluation to Growth: Test Suite & Skeletons

## 1. 🔍 Analysis & Context
*   **Objective:** Conduct a project-wide review using the evaluation-to-growth protocol and implement a plan to give incomplete skeletons/stubs "meat & full-breath" by closing critical test coverage gaps.
*   **Affected Files:**
    *   `src/components/sketches/__tests__/sketch-loader.test.ts`
    *   `src/components/charts/__tests__/chart-loader.test.ts`
    *   `src/components/academic/__tests__/mermaid-loader.test.ts`
    *   `src/pages/__tests__/feed.xml.test.ts`
    *   `src/pages/og/__tests__/slug.png.test.ts`
    *   `src/utils/__tests__/architecture-data.test.ts`
*   **Key Dependencies:** Vitest, jsdom, p5.js (mocked), D3.js (mocked).
*   **Risks/Unknowns:** Mocking dynamic imports (`import('p5')`) and async scheduling (`requestIdleCallback`, `IntersectionObserver`) in jsdom can be tricky. Careful global stubbing is required to avoid test flakiness.

---

## 2. 📋 Checklist
- [ ] Step 1: Implement Comprehensive Tests for `sketch-loader.ts` (Target: >80% coverage)
- [ ] Step 2: Implement Comprehensive Tests for `chart-loader.ts` (Target: >80% coverage)
- [ ] Step 3: Implement Comprehensive Tests for `mermaid-loader.ts` (Target: >80% coverage)
- [ ] Step 4: Patch Edge Case Coverage in `feed.xml.ts` and `[...slug].png.ts`
- [ ] Step 5: Verify the complete test suite execution and coverage metrics.

---

## 3. 📝 Step-by-Step Implementation Details

### Step 1: Implement Comprehensive Tests for `sketch-loader.ts`
*   **Goal:** Replace the current static "stub" tests with robust runtime behavior validation, covering the async import queue, intersection observation, and fallback error handling.
*   **Action:**
    *   Modify `src/components/sketches/__tests__/sketch-loader.test.ts`.
    *   Add mocks for `requestIdleCallback` (executing immediately) and `PerformanceObserver`.
    *   Write tests to validate `initSketches` triggering `IntersectionObserver` logic.
    *   Write tests to validate the `initQueue` concurrency limit (`MAX_CONCURRENT = 4`).
    *   Write tests to cover the `.catch()` block when a sketch module fails to load (validating `showFallback` DOM manipulation).
    *   Write tests for `pauseSketch` and `resumeSketch` modifying `data-paused` attributes.
*   **Verification:** `npm run test -- run src/components/sketches/__tests__/sketch-loader.test.ts --coverage` yields >80% statement coverage.

### Step 2: Implement Comprehensive Tests for `chart-loader.ts`
*   **Goal:** Ensure the dynamic import and chart rendering logic is fully tested.
*   **Action:**
    *   Modify `src/components/charts/__tests__/chart-loader.test.ts`.
    *   Simulate intersection events to trigger `loadChart`.
    *   Mock the dynamic import of chart renderers (e.g., `../bar-chart`, `../line-chart`).
    *   Test window resize debouncing logic.
*   **Verification:** `npm run test -- run src/components/charts/__tests__/chart-loader.test.ts --coverage` yields >80% coverage.

### Step 3: Implement Comprehensive Tests for `mermaid-loader.ts`
*   **Goal:** Validate lazy initialization of Mermaid diagrams.
*   **Action:**
    *   Modify `src/components/academic/__tests__/mermaid-loader.test.ts`.
    *   Provide a mock DOM element with `.mermaid` class.
    *   Simulate the intersection observer callback.
    *   Mock the dynamic `mermaid` module import and its `run()` function.
*   **Verification:** `npm run test -- run src/components/academic/__tests__/mermaid-loader.test.ts --coverage` yields >80% coverage.

### Step 4: Patch Edge Case Coverage in Utilities and Pages
*   **Goal:** Close small missing lines in highly tested files.
*   **Action:**
    *   Modify `src/pages/__tests__/feed.xml.test.ts` to include tests for edge cases (e.g. missing metadata or empty collections) triggering branches on lines 21-43.
    *   Modify `src/pages/og/__tests__/slug.png.test.ts` to cover the fallback branch on line 102.
    *   Modify `src/utils/__tests__/architecture-data.test.ts` to test lines 52-53 (likely error handling or missing values).
*   **Verification:** Respective test files achieve 100% statement and branch coverage.

---

## 4. 🧪 Testing Strategy
*   **Unit Tests:** Vitest will be used exclusively. Mock `IntersectionObserver`, `requestIdleCallback`, and dynamic `import()` thoroughly.
*   **Integration Tests:** The interaction between the loader utilities and DOM nodes will be verified within the jsdom environment.
*   **Manual Verification:** Run `npm run test:coverage` and verify that `All files` coverage exceeds 75% statement coverage and the previously flagged files are green.

## 5. ✅ Success Criteria
*   `sketch-loader.ts` coverage > 80%.
*   `chart-loader.ts` coverage > 80%.
*   `mermaid-loader.ts` coverage > 80%.
*   Project-wide coverage is demonstrably improved and passes the CI ratchet policy.
*   No "stubbed" tests remain for these core visual pipelines; they validate actual DOM/async behavior.


====================
FILE: ~/Workspace/4444J99/portfolio/.gemini/plans/2026-03-03-fix-consult-page.md
====================

# Plan: Fix Consult Page Interactivity

## Objective
Fix the "Consult" page which is reported as broken. The page uses Puter.js for AI-powered capability mapping.

## Identified Issues
1. **View Transitions Conflict**: The page's script ran at the top level of the component, which in an Astro View Transitions (ClientRouter) environment only runs once when the bundle is loaded. If the user navigates to `/consult` later, the DOM elements (like `#consult-form`) aren't bound because the script already executed (and likely crashed with a `null` reference if the user wasn't on the consult page initially).
2. **Brittle AI Interaction**: The `puter.ai.chat` call passed the system prompt in the options object, which is less robust than using a messages array.
3. **Simple Markdown Conversion**: The regex-based markdown-to-HTML conversion was very basic and could produce broken layout for common AI response patterns.

## Implementation Steps
- [x] **Wrap Initialization**: Use `astro:page-load` to ensure form binding and event listeners are re-attached on every navigation to the consult page.
- [x] **Harden AI Call**: Update `puter.ai.chat` to use an array of messages (`system` + `user`) for better instruction following.
- [x] **Improve Markdown Logic**: Refine the regex-based conversion to handle lists (both `*` and `-`) and paragraphs more reliably.
- [x] **Add Smoke Test**: Create `src/e2e/consult.smoke.spec.ts` to ensure the form remains interactive across navigations.

## Verification Results
- `npm run typecheck`: Passed.
- `npx playwright test src/e2e/consult.smoke.spec.ts`: Passed (verified form binding and loading state triggers after navigation).


====================
FILE: ~/Workspace/4444J99/portfolio/.gemini/plans/2026-03-04-portfolio-refinement.md
====================

# Portfolio UI/UX Refinement Plan (2026-03-04)

This plan details the process for systematically perfecting the styles and user experience of the [name redacted] portfolio, working one page at a time with live visual feedback.

## Objectives
- **Perfect Styles**: Ensure consistent application of the design system (Fibonacci spacing, glassmorphism, typography).
- **Optimize UX**: Improve interactions, transitions, and accessibility.
- **Visual Feedback Loop**: Maintain a side-by-side view of code and rendered output.

## Workflow

### 1. Environment Setup
- **Dev Server**: Running at `http://localhost:4322/portfolio` (Astro 5).
- **Feedback Mechanism**: Use `browser_subagent` to capture screenshots and videos for visual review in the chat.

### 2. Page-by-Page Refinement Cycle
For each page (e.g., Home, Work, About):
1.  **Status Audit**: Run `browser_subagent` to capture current desktop and mobile views.
2.  **Design Analysis**: Identify areas for improvement (spacing, color contrast, animation timing).
3.  **Iterative Development**:
    - Modify CSS (global or scoped).
    - Update Astro components.
    - Refine interactive layers (D3.js / p5.js).
4.  **Verification**: Re-run `browser_subagent` to confirm changes and show the result.
5.  **Quality Check**: Ensure no regressions in performance/a11y (using project's existing quality scripts).

## Refinement Backlog

| Priority | Page | Key Focus Areas |
| :--- | :--- | :--- |
| 1 | **Home** | Hero section typography, System Pulse interactivity, Persona toggle smoothness. |
| 2 | **Work (Gallery)** | Image loading states, filtering logic, project card hover effects. |
| 3 | **Case Studies** | Data visualizations (D3), reading rhythm, sticky navigation. |
| 4 | **About** | Integrated system metrics, timeline visuals. |
| 5 | **Connect** | Interactive forms/links, minimalist aesthetics. |

## Next Steps
1.  **Select Target**: Identify which page to start with (suggesting **Home**).
2.  **Deep Dive**: Analyze the `src/styles/global.css` and the specific page component.


====================
FILE: ~/Workspace/4444J99/portfolio/.gemini/plans/2026-02-20-market-resume-system.md
====================

# Plan: Market-Aligned Resume System (MARS)

This plan implements a "Dual Narrative Layering" and "Signal Translation" system for the portfolio, addressing the gap between high-concept polymathic work and role-specific hiring requirements.

## 1. Core Objectives
- Create dedicated narrative pages for specific job roles (Software Engineer, Product Engineer, Full-Stack).
- Map existing projects to these roles using "Signal Engineering" (outcomes, impact metrics, tech keywords).
- Maintain the "Visionary Polymath" identity as a secondary layer for collaborators and deep-dives.
- Improve ATS and recruiter legibility by providing clear, tailored entry points.

## 2. Feature Identification
- **Role-Specific Pages:** Distinct URLs for each persona.
- **Persona Switcher:** UI component to toggle between "Engineering" and "Visionary" views.
- **Market Data Layer:** Role-specific project descriptions and impact statements.
- **Signal Translation:** Re-weighting project importance based on the active persona.

## 3. Implementation Steps

### Phase 1: Data Modeling
1. **Create `src/data/market-personas.json`**:
   - Define metadata for each role:
     - `slug`: (e.g., `software-engineer`)
     - `title`: (e.g., "Software Engineer — Backend Focus")
     - `summary`: Role-aligned career summary.
     - `core_keywords`: Primary tech stack tags.
2. **Update `src/data/projects.json`**:
   - Add `market_narratives` field to key projects.
   - Map project outcomes to specific roles.

### Phase 2: Component Development
1. **`src/components/resume/PersonaSwitcher.astro`**:
   - A sticky or header-based navigation to switch between resume views.
2. **`src/components/resume/MarketResumeItem.astro`**:
   - A specialized project display component that prioritizes impact and tech stack.
3. **`src/components/resume/MarketResumeTemplate.astro`**:
   - A reusable template for role-based pages, integrating the header, summary, and filtered projects.

### Phase 3: Page Implementation
1. **`src/pages/resume/software-engineer.astro`**:
   - Focus: Python, TS, Architecture, Testing.
   - Featured: `Agentic Titan`, `Recursive Engine`, `UCC Scraper`.
2. **`src/pages/resume/product-engineer.astro`**:
   - Focus: AI Systems, Product Strategy, Delivery.
   - Featured: `Agentic Titan`, `AI-Conductor`, `Aetheria RPG`.
3. **`src/pages/resume/full-stack-engineer.astro`**:
   - Focus: Next.js, FastAPI, Hexagonal Architecture.
   - Featured: `in-midst-my-life`, `UCC Scraper`, `Metasystem Master`.
4. **Update `src/pages/resume.astro`**:
   - Repurpose as the "Visionary Polymath" resume.
   - Add the `PersonaSwitcher` to link to tailored views.

### Phase 4: Content Authoring (Signal Translation)
- Draft impact statements for each project tailored to the role.
- *Example (Software Engineer)*: "Built a model-agnostic multi-agent swarm architecture in Python with 1,095+ tests (adversarial, chaos, e2e)."
- *Example (Product Engineer)*: "Designed a self-organizing system for autonomous task completion across 9 topologies, optimizing for LLM orchestration efficiency."

## 4. Verification & Quality Gates
- **Link Check:** Ensure all personas are inter-linked correctly.
- **SEO/Meta:** Verify page titles and descriptions are optimized for each role.
- **A11y:** Ensure the switcher is keyboard-accessible.
- **Mobile:** Check layout on small screens.

## 5. Prioritization
- **High:** Data layer, Basic role pages, Switcher.
- **Medium:** Detailed market narratives, SEO optimization.
- **Low:** Specialized PDF downloads for each persona.


====================
FILE: ~/Workspace/4444J99/portfolio/.gemini/plans/2026-03-04-evaluation-to-growth-plan.md
====================

# Implementation Plan: Evaluation to Growth (2026-03-04)

## Goal Description
Implement the recommendations from the recent Evaluation-to-Growth assessment (`docs/evaluation-to-growth-report-v2.md`). The primary goals are to reduce local maintenance overhead by abstracting quality scripts and to make the narrative more accessible to non-technical audiences while retaining its core engineering rigor.

## Proposed Changes

### 1. Abstract Quality Scripts into `@4444j99/quality-ratchet-kit`
Many of the standalone Node scripts in the `scripts/` directory should be migrated into the local package `packages/quality-ratchet-kit`.
- **Identify mature scripts:** Audit files such as `scripts/check-quality-deltas.mjs`, `scripts/verify-quality-contracts.mjs`, and `scripts/check-bundle-budgets.mjs`.
- **Relocate logic:** Move the core logic of these scripts to `packages/quality-ratchet-kit/src/`.
- **Update package.json:** Update the portfolio's `package.json` to call the CLI binary provided by the `quality-ratchet-kit` package instead of raw Node scripts.

### 2. Safeguard External API Dependencies (Offline Mode)
The build and quality pipeline relies on external APIs (e.g., PageSpeed Insights for Lighthouse).
- **Implement fallback:** Add a degraded/fallback mechanism in `scripts/lighthouse-cloud.mjs` (or its equivalent in the ratchet kit) to bypass external API checks if a timeout or `429 Too Many Requests` occurs, preventing CI blockade.

### 3. Accessible Narrative Adjustments
The homepage and operative handbook use esoteric terminology ("Organ V", "Kerygma") that might confuse HR screens.
- **Update `src/pages/index.astro`:** Add brief, plain-English subtitles or tooltips (e.g., `<Tooltip text="The central portfolio repository">Organ V</Tooltip>`) to explain the system architecture immediately to new visitors.
- **Audit PDF Resumes:** Ensure the PDFs generated in `public/resume/` using `scripts/orchestrate-resume-pdfs.mjs` have proper plain-text extraction (no overlapping text blocks confusing ATS scanners).

## Verification Plan

### Automated Tests
- Run `npm run test:quality-ratchet-kit` to ensure migrated scripts still pass their core unit tests.
- Run `npm run quality:local` to verify the main portfolio pipeline remains completely green after abstracting the scripts and implementing the API backoff logic.
- Run `npm run test:a11y:runtime` (Playwright) to verify any UI changes made to `src/pages/index.astro` (like tooltips) don't violate accessibility standards.

### Manual Verification
- Render the `npm run dev` environment locally and visually inspect the new layout/text adjustments on the homepage.
- Extract text from a generated PDF resume (using a tool like `pdftotext` or simply copy-pasting from Preview) to manually verify that Applicant Tracking Systems (ATS) will read the correct, sequential plain text without weird line breaks.


====================
FILE: ~/Workspace/4444J99/portfolio/.codex/plans/2026-03-04-consult-cloudflare-worker-fix.md
====================

# Consult Flow Fix Plan (Implemented)

## Objective

Repair the consult page so public visitors on GitHub Pages can submit a challenge and always receive a useful analysis.

## Decided Architecture

- Frontend: `src/pages/consult.astro`
  - Remove browser-side Puter dependency.
  - Call configurable API endpoint via `PUBLIC_CONSULT_API_BASE`.
  - Enforce request timeout.
  - Render deterministic fallback analysis if API is unavailable.
- Backend: Cloudflare Worker at `workers/consult-api`
  - Endpoint: `POST /api/consult`.
  - Primary response path: Workers AI model inference.
  - Backup response path: deterministic capability mapping fallback.
  - Data logging: Cloudflare D1 `consult_logs` table.

## Response Contract

Success:

```json
{
  "ok": true,
  "mode": "ai|fallback",
  "analysisHtml": "<p>...</p>",
  "analysisText": "plain text",
  "requestId": "uuid",
  "durationMs": 100
}
```

Error:

```json
{
  "ok": false,
  "code": "BAD_INPUT|AI_TIMEOUT|AI_ERROR|INTERNAL",
  "message": "error details",
  "requestId": "uuid"
}
```

## D1 Logging Schema

- `id`, `created_at`, `industry`, `challenge`, `mode`, `status_code`, `error_code`, `model`,
  `latency_ms`, `ip_hash`, `user_agent`, `analysis_preview`, `page`.

## Validation

- Update Playwright consult smoke test to verify post-submit recovery and visible output/error state.
- Keep deterministic fallback active when API env var is not configured, so behavior is resilient in local and production edge cases.


====================
FILE: ~/Workspace/4444J99/portfolio/.claude/plans/2026-02-28-eval-to-growth-review.md
====================

# Evaluation-to-Growth: Portfolio Project Review

## Context

Full-project review of the Astro 5 portfolio at `~/Workspace/4444J99/portfolio/` using the Evaluation-to-Growth framework. The site is a deployed job-search portfolio for [name redacted] with 20 case studies, persona-driven resumes, a Strike Intelligence Engine for autonomous recruitment, and an Omega maturity scorecard. It's live at `https://4444j99.github.io/portfolio/`.

The codebase has strong engineering foundations (284 tests, zero vulnerabilities, quality ratchet system, deploy gating) but the review surfaced several issues where the live site undermines its own credibility thesis — broken PDF downloads, zero-value metrics displayed on the homepage, and draft placeholder content on public pages aimed at hiring managers.

---

## Phase 1: Evaluation

### Strengths

| Dimension | Evidence |
|-----------|----------|
| **Testing** | 284 tests / 84 suites, all passing. W10 coverage ratchet (45/32/32/45). |
| **Security** | Zero vulnerabilities. Date-ratcheted sprint targeting zero by 2026-03-18. |
| **Deploy Safety** | `workflow_run` gating — quality.yml must pass before deploy.yml fires. |
| **Accessibility** | Comprehensive ARIA: `role="toolbar"`, `aria-pressed`, `aria-expanded`, `aria-live`, `aria-controls`. AbortController cleanup. `prefers-reduced-motion`. |
| **Content System** | 20 case studies with academic citations (Cite, References, Figure, MermaidDiagram). 4 personas. Dynamic resume route with data enrichment. |
| **Architecture** | Clean data-driven design: JSON → Astro pages. 30 typed p5.js sketches. Three workspace packages. View transition persistence. |
| **Quality Governance** | Ratchet policy JSON + README sync enforcement. Regression guards. CODEOWNERS on policy files. |

### Weaknesses (verified)

| ID | Finding | Severity |
|----|---------|----------|
| W1 | Resume PDF download links 404 for 2 of 4 personas (slash in title creates directory path) | P0 |
| W2 | `[DRAFT]` placeholder content on live Palantir and OpenAI strike target pages | P0 |
| W3 | Typo in `orchestrate-resume-pdfs.mjs:24` — `res` instead of `r` crashes waitForServer | P0 |
| W4 | Homepage displays zeros: "0 Code Files", "0 Test Files", "0+ Automated Tests" from `vitals.json` | P1 |
| W5 | Hardcoded "32" generative sketches on homepage — actual count is 30 | P1 |
| W6 | CI uses `QUALITY_PHASE: W6` but `ratchet-policy.json` defaultPhase is `W10` — local/CI mismatch | P1 |
| W7 | Human impact metrics hardcoded in `sync-trust-metrics.mjs` with no provenance | P1 |
| W8 | `SECURITY.md` has placeholder email `[[email redacted]]` | P2 |
| W9 | Filter chip state not persisted across page reloads | P2 |
| W10 | No URL parameter for view selection (can't deep-link to creative view) | P2 |
| W11 | docs/ directory (4 files) not linked from site navigation | P3 |
| W12 | No linting configuration (eslint/biome/prettier) | P3 |

---

## Phase 2: Reinforcement

### R1. Fix Resume PDF Download Paths [P0]

**Problem:** `src/pages/resume/[slug].astro:77` constructs download href as:
```
Anthony_James_Padavano_${persona.pdfName || persona.title.replace(/\s+/g, '_')}.pdf
```
For "Systems Architect / Backend Lead" → `..._Systems_Architect_/_Backend_Lead.pdf` — the `/` becomes a path separator → 404.

**Files:**
- `src/data/personas.json` — Add `pdfName` to systems-architect and technical-pm:
  - systems-architect: `"pdfName": "Systems_Architect"`
  - technical-pm: `"pdfName": "Technical_Program_Manager"`
- `public/resume/` — Clean up broken directory entries (`Anthony_James_Padavano_Systems Architect `, `Anthony_James_Padavano_Technical Program Manager `)

**Complexity:** Small

### R2. Replace [DRAFT] Targets with Real Content [P0]

**Problem:** `src/data/targets.json` lines 14, 28 — Palantir and OpenAI have `[DRAFT]` placeholders on live public pages.

**Files:**
- `src/data/targets.json` — Write real intros for Palantir and OpenAI, matching the quality of existing Anthropic/Vercel entries. Or add build-time validation that fails on `[DRAFT]` content.

**Complexity:** Medium (requires content writing)

### R3. Fix orchestrate-resume-pdfs.mjs Typo [P0]

**Problem:** Line 24: `setTimeout(res, 500)` — `res` is from the outer `isServerRunning` scope (a fetch Response), should be `r` (the Promise resolver).

**File:** `scripts/orchestrate-resume-pdfs.mjs:24`
**Change:** `setTimeout(res, 500)` → `setTimeout(r, 500)`

**Complexity:** Trivial

### R4. Fix Zero-Value Vitals on Homepage [P1]

**Problem:** `src/data/vitals.json` has `code_files: 0`, `test_files: 0`, `automated_tests: 0`, `essays: 0`. These display prominently on the homepage stats section and hero subtitle.

**Files:**
- `src/data/vitals.json` — Populate with real values from the generate-data pipeline, or hardcode accurate values until pipeline is fixed
- `src/data/__tests__/data-integrity.test.ts` — Add assertions that critical vitals are non-zero

**Complexity:** Medium (root cause is in sibling rep

====================
FILE: ~/.codex/vendor_imports/skills/skills/.curated/notion-meeting-intelligence/examples/executive-review.md
====================

# Example: Executive Review Prep

**User Request**: "Prep for quarterly executive review on Friday"

## Workflow

### 1. Search for Context
```
Notion:notion-search
query: "Q4 objectives" + "KPIs" + "quarterly results"
```

Found:
- Q4 OKRs and progress
- Product metrics dashboard
- Engineering velocity reports
- Customer feedback summary

### 2. Fetch & Analyze
```
Notion:notion-fetch (5 pages)
```

**Key metrics**:
- **Revenue**: $2.4M ARR (96% of Q4 target)
- **Customer Growth**: 145 new customers (exceeds 120 target)
- **Churn**: 3.2% (below 5% target)
- **Product**: 3 major features shipped, 2 in beta
- **Engineering**: 94% uptime (above 95% SLA)

### 3. Add Codex Research Context
Added context on:
- Industry benchmarks for SaaS metrics
- Typical Q4 sales patterns
- Best practices for executive presentations

### 4. Create Pre-Read (Internal)
```
Notion:notion-create-pages
title: "Q4 Review - Pre-Read (Internal)"
```

**Pre-read sections**:
- **Executive Summary**: Strong quarter, missed revenue by 4% but exceeded customer growth
- **Detailed Metrics**: All KPIs with trend lines
- **Wins**: Product launches, key customer acquisitions
- **Challenges**: Sales pipeline conversion, engineering hiring
- **Q1 Preview**: Strategic priorities

### 5. Create Presentation Agenda
```
Notion:notion-create-pages
title: "Q4 Executive Review - Agenda"
```

**Agenda** (90 min):
- Q4 Results Overview (15 min)
- Revenue & Growth Deep Dive (20 min)
- Product & Engineering Update (20 min)
- Customer Success Highlights (15 min)
- Q1 Strategic Plan (15 min)
- Discussion & Questions (15 min)

### 6. Link Supporting Docs
Connected to OKRs, metrics dashboards, and Q1 planning docs.

## Outputs

**Internal Pre-Read**: Comprehensive context with honest assessment
**Executive Agenda**: Structured 90-min presentation
**Both in Notion** with links to supporting data

## Key Success Factors
- Synthesized data from multiple sources (OKRs, metrics, feedback)
- Added industry context and benchmarks
- Created honest internal assessment (not just wins)
- Structured agenda with time allocations
- Linked to source data for drill-down during Q&A


====================
FILE: ~/.codex/vendor_imports/skills/skills/.curated/notion-meeting-intelligence/examples/sprint-planning.md
====================

# Example: Sprint Planning Meeting Prep

**User Request**: "Prepare for tomorrow's sprint planning meeting"

## Workflow

### 1. Search for Context
```
Notion:notion-search
query: "sprint planning" + "product backlog"
teamspace_id: "engineering-team"
```

Found:
- Last sprint retrospective
- Product backlog (prioritized)
- Current sprint progress
- Team capacity notes

### 2. Fetch Details
```
Notion:notion-fetch (4 pages)
```

**Key context**:
- **Last Sprint**: Completed 32/35 story points (91%)
- **Velocity**: Consistent 30-35 points over last 3 sprints
- **Team**: 5 engineers, 1 on vacation next sprint (80% capacity)
- **Top Backlog Items**: User auth improvements, API performance, mobile responsive fixes

### 3. Query Current Sprint Tasks
```
Notion:notion-query-data-sources
query: "SELECT * FROM tasks WHERE Sprint = 'Sprint 24' AND Status != 'Done'"
```

3 tasks carrying over (technical debt items)

### 4. Create Pre-Read (Internal)
```
Notion:notion-create-pages
title: "Sprint 25 Planning - Pre-Read (Internal)"
```

**Pre-read included**:
- Sprint 24 summary (velocity, what carried over)
- Team capacity for Sprint 25
- Top backlog candidates with story points
- Technical dependencies
- Risk items (auth changes need QA time)

### 5. Create Agenda
```
Notion:notion-create-pages  
title: "Sprint 25 Planning - Agenda"
```

**Agenda**:
- Review Sprint 24 completion (5 min)
- Discuss carryover items (5 min)
- Review capacity (28 points available)
- Select backlog items (30 min)
- Identify dependencies & risks (10 min)
- Confirm commitments (10 min)

### 6. Link Documents
Cross-linked pre-read and agenda, referenced last retro and backlog.

## Output Summary

**Internal Pre-Read**: Team context, capacity, blockers
**External Agenda**: Meeting structure, discussion topics
**Both saved to Notion** and linked to project pages

## Key Success Factors
- Gathered sprint history for velocity trends
- Calculated realistic capacity (account for PTO)
- Identified carryover items upfront
- Pre-read gave team context before meeting
- Agenda kept meeting focused and timeboxed


====================
FILE: ~/.codex/vendor_imports/skills/skills/.curated/notion-meeting-intelligence/reference/sprint-planning-template.md
====================

# Sprint Planning Template

Use this template for agile sprint planning meetings.

```markdown
# Sprint [#] Planning - [Date]

## Meeting Details
**Date**: [Date]
**Team**: [Team name]
**Sprint Duration**: [Dates]

## Sprint Goal

[Clear statement of what this sprint aims to accomplish]

## Capacity

| Team Member | Availability | Capacity (points) |
|-------------|--------------|-------------------|
| [Name] | [%] | [#] |
| **Total** | | [#] |

## Backlog Review

### High Priority Items

[From product backlog, linked from task database]

- <mention-page url="...">Task 1</mention-page> - [Points]
- <mention-page url="...">Task 2</mention-page> - [Points]

## Sprint Backlog

### Committed Items

- [x] <mention-page url="...">Task</mention-page> - [Points] - @[Owner]
- [ ] <mention-page url="...">Task</mention-page> - [Points] - @[Owner]

**Total committed**: [Points]

### Stretch Goals

- [ ] <mention-page url="...">Task</mention-page> - [Points]

## Dependencies & Risks

**Dependencies**:
- [Dependency]

**Risks**:
- [Risk]

## Definition of Done

- [ ] Code complete and reviewed
- [ ] Tests written and passing
- [ ] Documentation updated
- [ ] Deployed to staging
- [ ] QA approved

## Next Steps

- Team begins sprint work
- Daily standups at [Time]
- Sprint review on [Date]
```



====================
FILE: ~/.codex/vendor_imports/skills/skills/.curated/winui-app/references/testing-debugging-and-review-checklists.md
====================

---
title: Testing, Debugging, and Review Checklists
priority: HIGH
tags: testing, debugging, review, hot-reload, live-visual-tree, checklists
sources:
  - https://learn.microsoft.com/windows/apps/get-started/start-here
  - https://learn.microsoft.com/windows/apps/get-started/developer-mode-features-and-debugging
  - https://learn.microsoft.com/windows/apps/performance/winui-perf
---

## What This Reference Is For

Use this file for final review passes, debugging sessions, and "what should I verify before I call this done?" prompts.

## Required Verification Loop

- Build after each meaningful edit, not only at the end.
- Run the app after changes when the user asked for it or when startup-sensitive files changed.
- Verify actual launch instead of assuming success from a spawned process.
- If the app fails before showing a window, debug the startup path before continuing feature work.

## Design Review Checklist

- Shell and navigation are simple and predictable.
- `NavigationView` still reads like standard WinUI shell chrome unless the product explicitly calls for branded pane content or custom shell composition.
- Layout stays usable when the window is narrow.
- Layout has been checked at more than one breakpoint, including a genuinely phone-like width when the app can be resized that far.
- Collection pages with mixed scroll regions have been checked at runtime so shelves still render in the intended direction and do not collapse into a single vertical column.
- Theme, contrast, hierarchy, and interactive state visibility hold up in both light and dark mode, and typography and iconography still feel native to Windows.
- Command placement and hierarchy are clear.
- Default WinUI surfaces and control templates carry most of the layout instead of a custom border/card system.
- Search and filter workflows avoid redundant controls when live local filtering would be clearer.
- At narrow and phone widths, nonessential controls are simplified, hidden, or moved behind shell affordances instead of merely compressed.

## Code Review Checklist

- App structure is coherent and scalable.
- Resource dictionaries and styles are centralized where they should be.
- Platform controls are preferred over unnecessary custom control work.
- New dependencies are justified.
- The packaging model matches the startup, storage, and launch code.
- The app builds cleanly from the workflow the user will actually use.

## Accessibility Checklist

- Keyboard-only flow works end to end.
- Focus states are visible and sensible.
- Automation properties are present where needed.
- High contrast and text scaling do not break the UI.

## Performance Checklist

- No obvious UI-thread blocking work in interactive paths.
- Large collections use an appropriate control and layout.
- Scroll ownership is intentional for collection-heavy pages; nested `GridView` plus outer `ScrollViewer` combinations have been justified or replaced.
- Expensive styling or template choices are justified.
- Profiling data exists for non-obvious performance claims.

## Debugging Tools

- Use Hot Reload for fast visual iteration.
- Use Live Visual Tree and Live Property Explorer for layout and property debugging.
- Use WPR and WPA when diagnosing frame or responsiveness issues.
- Reproduce resize, theme, and input-mode changes before concluding the issue is fixed.
- When resize behavior is part of the task, verify wide, medium, and phone-width states against the running app rather than trusting the XAML structure alone.
- When a collection page looks wrong, inspect the live tree for nested `ScrollViewer` ownership before rewriting the item template; the bug may be layout ownership rather than card markup.
- Use startup exception details, debugger output, or Event Viewer when the process dies before any window appears.

## Exit Criteria

- The build succeeds from the intended local workflow.
- The feature works on the intended machine configuration.
- The app launches and shows the expected shell or window.
- The app remains usable in light, dark, and high contrast.
- Primary flows are keyboard-accessible.
- Resize behavior, startup, and interactive responsiveness have been checked.
- If the window can become phone-width, the shell and content have been verified there too.


====================
FILE: ~/.codex/vendor_imports/skills/skills/.curated/notion-research-documentation/examples/trip-planning.md
====================

# Example: Group Trip Research & Planning

**User Request**: "Research and plan our friends' trip to Japan in March - we're 6 people looking for 10 days"

## Workflow

### 1. Search Existing Notes
```
Notion:notion-search
query: "Japan travel"
```
Found: Japan Travel Guide (from friend), Tokyo Restaurants, Kyoto Temple Guide

### 2. Fetch & Extract Tips
```
Notion:notion-fetch (3x)
```
**Key info from previous travelers:**
- Best time: March-April (cherry blossoms)
- Must-see: Tokyo, Kyoto, Osaka
- Budget: $200-300/day (mid-range)
- Book accommodations 3 months ahead
- Get JR Pass before arrival
- Top restaurants: Sushi Dai, Ichiran Ramen, Tsunahachi Tempura

### 3. Research & Synthesize
Combined previous traveler insights with:
- Flight options and prices
- Accommodation types (hotels/ryokans/Airbnb)
- Transportation (JR Pass essential)
- 10-day itinerary structure
- Budget breakdown

### 4. Create Comprehensive Plan
```
Notion:notion-create-pages
parent: { page_id: "travel-plans-parent-id" }
pages: [{
  properties: {
    title: "Japan Trip 2026 - March 15-25 (10 Days)"
  },
  content: "[Full trip plan with itinerary, budget, tips...]"
}]
```

## Output Sample

```markdown
# Japan Trip 2026 - March 15-25 (10 Days)

## Trip Overview
**Dates**: March 15-25, 2026 (Cherry Blossom Season 🌸)
**Group**: 6 people | **Budget**: $3,000-4,000/person

## Itinerary Summary

**Days 1-3: Tokyo**
- Arrive, explore Shibuya, Harajuku, Shinjuku
- Visit Tsukiji Market, Imperial Palace, Sensoji Temple
- Experience Tokyo nightlife, teamLab Borderless

**Days 4-5: Hakone**  
- Day trip from Tokyo
- Hot springs, Mt. Fuji views, Lake Ashi cruise

**Days 6-8: Kyoto**
- Bullet train from Tokyo
- Fushimi Inari, Kinkaku-ji, Arashiyama Bamboo Grove
- Geisha district (Gion), traditional tea ceremony

**Days 9-10: Osaka + Depart**
- Osaka Castle, Dotonbori food district
- Nara day trip (deer park, Todai-ji Temple)
- Return flight from Osaka (KIX)

## Budget Breakdown (per person)
- **Flights**: $900-1,200 (round-trip)
- **Accommodations**: $700-1,000 (9 nights)
- **JR Pass**: $280 (7-day pass)
- **Food**: $500-700 ($50-70/day)
- **Activities**: $300-400
- **Local transport**: $100
**Total**: $2,780-3,680

## Key Bookings
- **Flights**: Book 3-4 months ahead
- **Hotels**: Book now (cherry blossom season)
  - Tokyo: Shinjuku area (2 nights) + Asakusa (1 night)
  - Kyoto: Gion area (3 nights)
  - Osaka: Namba area (2 nights)
- **JR Pass**: Order 2-3 weeks before travel
- **Restaurants**: Reserve 1 week ahead (Sushi Dai, high-end spots)

## Essential Tips
Source: <mention-page url="...">Japan Travel Guide</mention-page>
- Get pocket WiFi or eSIM on arrival
- Download: Google Translate, Hyperdia (train routes), Tabelog (restaurants)
- Cash-heavy country - withdraw at 7-Eleven ATMs
- Shoes off in temples, ryokans, some restaurants
- Trains extremely punctual - don't be late
- Learn basic phrases: arigatou, sumimasen, itadakimasu

## Packing List
- Comfortable walking shoes (10k+ steps/day)
- Light jacket (March 55-65°F)
- Backpack for day trips
- Cash pouch
- Portable charger

## Next Steps
- [ ] Book flights (target: <$1,100/person)
- [ ] Order JR Passes
- [ ] Book hotels (Tokyo → Kyoto → Osaka)
- [ ] Create shared expense tracker
- [ ] Schedule group planning call

## Sources
- <mention-page url="...">Japan Travel Guide</mention-page> (Sarah's 2024 trip)
- <mention-page url="...">Tokyo Restaurant Recommendations</mention-page>
- <mention-page url="...">Kyoto Temple Guide</mention-page>
```

## Key Takeaways
- Leveraged previous traveler notes from Notion
- Combined personal insights with research
- Created actionable itinerary with budget breakdown
- Included practical tips from experienced travelers
- Set clear next steps for group coordination


====================
FILE: ~/.codex/vendor_imports/skills/skills/.curated/notion-spec-to-implementation/reference/quick-implementation-plan.md
====================

# Quick Implementation Plan Template

For simpler features or small changes.

```markdown
# Implementation: [Feature Name]

## Spec
<mention-page url="...">Specification</mention-page>

## Summary
[Quick description]

## Tasks
- [ ] <mention-page url="...">Task 1</mention-page>
- [ ] <mention-page url="...">Task 2</mention-page>
- [ ] <mention-page url="...">Task 3</mention-page>

## Timeline
Start: [Date]
Target completion: [Date]

## Status
[Update as work progresses]
```



====================
FILE: ~/.codex/vendor_imports/skills/skills/.curated/notion-spec-to-implementation/reference/standard-implementation-plan.md
====================

# Standard Implementation Plan Template

Use this template for most feature implementations.

```markdown
# Implementation Plan: [Feature Name]

## Overview
[1-2 sentence feature description and business value]

## Linked Specification
<mention-page url="...">Original Specification</mention-page>

## Requirements Summary

### Functional Requirements
- [Requirement 1]
- [Requirement 2]
- [Requirement 3]

### Non-Functional Requirements
- **Performance**: [Targets]
- **Security**: [Requirements]
- **Scalability**: [Needs]

### Acceptance Criteria
- [ ] [Criterion 1]
- [ ] [Criterion 2]
- [ ] [Criterion 3]

## Technical Approach

### Architecture
[High-level architectural decisions]

### Technology Stack
- Backend: [Technologies]
- Frontend: [Technologies]
- Infrastructure: [Technologies]

### Key Design Decisions
1. **[Decision]**: [Rationale]
2. **[Decision]**: [Rationale]

## Implementation Phases

### Phase 1: Foundation (Week 1)
**Goal**: Set up core infrastructure

**Tasks**:
- [ ] <mention-page url="...">Database schema design</mention-page>
- [ ] <mention-page url="...">API scaffolding</mention-page>
- [ ] <mention-page url="...">Authentication setup</mention-page>

**Deliverables**: Working API skeleton
**Estimated effort**: 3 days

### Phase 2: Core Features (Week 2-3)
**Goal**: Implement main functionality

**Tasks**:
- [ ] <mention-page url="...">Feature A implementation</mention-page>
- [ ] <mention-page url="...">Feature B implementation</mention-page>

**Deliverables**: Core features working
**Estimated effort**: 1 week

### Phase 3: Integration & Polish (Week 4)
**Goal**: Complete integration and refinement

**Tasks**:
- [ ] <mention-page url="...">Frontend integration</mention-page>
- [ ] <mention-page url="...">Testing & QA</mention-page>

**Deliverables**: Production-ready feature
**Estimated effort**: 1 week

## Dependencies

### External Dependencies
- [Dependency 1]: [Status]
- [Dependency 2]: [Status]

### Internal Dependencies
- [Team/component dependency]

### Blockers
- [Known blocker] or None currently

## Risks & Mitigation

### Risk 1: [Description]
- **Probability**: High/Medium/Low
- **Impact**: High/Medium/Low
- **Mitigation**: [Strategy]

### Risk 2: [Description]
- **Probability**: High/Medium/Low
- **Impact**: High/Medium/Low
- **Mitigation**: [Strategy]

## Timeline

| Milestone | Target Date | Status |
|-----------|-------------|--------|
| Phase 1 Complete | [Date] | ⏳ Planned |
| Phase 2 Complete | [Date] | ⏳ Planned |
| Phase 3 Complete | [Date] | ⏳ Planned |
| Launch | [Date] | ⏳ Planned |

## Success Criteria

### Technical Success
- [ ] All acceptance criteria met
- [ ] Performance targets achieved
- [ ] Security requirements satisfied
- [ ] Test coverage > 80%

### Business Success
- [ ] [Business metric 1]
- [ ] [Business metric 2]

## Resources

### Documentation
- <mention-page url="...">Design Doc</mention-page>
- <mention-page url="...">API Spec</mention-page>

### Related Work
- <mention-page url="...">Related Feature</mention-page>

## Progress Tracking

[This section updated regularly]

### Phase Status
- Phase 1: ⏳ Not Started
- Phase 2: ⏳ Not Started
- Phase 3: ⏳ Not Started

**Overall Progress**: 0% complete

### Latest Update: [Date]
[Brief status update]
```



====================
FILE: ~/.codex/skills/.system/spreadsheets/references/ranges.md
====================

# Ranges

Ranges use A1 notation and are the main surface for reading and writing cells.

```js
const sheet = workbook.worksheets.add("Sheet1");

sheet.getRange("A1:C1").values = [["Month", "Bookings", "ARR"]];
sheet.getRange("A2:C4").values = [
  ["Jan", 120000, 1440000],
  ["Feb", 135000, 1620000],
  ["Mar", 142000, 1704000],
];

sheet.getRange("E2").formulas = [["=SUM(C2:C4)"]];
workbook.recalculate();
```

## Notes

- Use `range.values` for literal values.
- Use `range.formulas` for Excel-style formulas.
- Call `workbook.recalculate()` before reading formula-driven `range.values`.
- Apply formatting through `range.format` when the sheet needs borders, fills, fonts, or number formats.

## Addressing

- Single cell: `"B3"`
- Rectangle: `"A1:C10"`
- Entire row or column ranges are best used sparingly unless the user explicitly wants them.


====================
FILE: ~/.codex/skills/.system/spreadsheets/references/workbook.md
====================

# Workbook API

Use `Workbook` to create, edit, recalculate, and export spreadsheet artifacts.

## Lifecycle

```js
const workbook = Workbook.create();
const sheet = workbook.worksheets.add("Sheet1");
```

- `Workbook.create()` starts a new workbook.
- `await SpreadsheetFile.importXlsx(await FileBlob.load("book.xlsx"))` imports an existing workbook.
- `workbook.recalculate()` evaluates formulas.
- `await SpreadsheetFile.exportXlsx(workbook)` exports a saveable `.xlsx` blob.

## Worksheets

- `workbook.worksheets.add(name)` adds or returns a worksheet.
- `workbook.worksheets.getItem(nameOrIndex)` fetches an existing sheet.
- `workbook.worksheets.getActiveWorksheet()` returns the active sheet when relevant.

## Charts And Images

For charts that must survive `.xlsx` export reliably, prefer mutating the returned chart object directly:

```js
const chart = sheet.charts.add("line");
chart.setPosition("A10", "H24");
chart.title = "Cash runway";
chart.categories = ["Month 0", "Month 1", "Month 2"];

const series = chart.series.add("Savings");
series.values = [6000, 6850, 7700];
```

This authoring path is more reliable than some one-shot chart construction styles, which can produce workbook objects that appear fine in memory but export to empty or misplaced charts.

For worksheet images, prefer a `blob` payload:

```js
const fs = await import("node:fs/promises");
const bytes = await fs.readFile("artifacts/chart-preview.png");
const blob = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);

sheet.images.add({
  blob,
  contentType: "image/png",
  anchor: {
    from: { row: 10, col: 0 },
    to: { row: 24, col: 8 },
  },
});
```

## QA

If the workbook includes charts or images, verify the final sheet layout after export, not just before export:

```js
const png = await workbook.render({ sheet: 0, format: "png" });
```

Use rendered previews to confirm both of these points:

- The chart or image actually appears in the exported workbook.
- It lands where a user will see it without scrolling far past the main table.

Merged cells and tall autofit rows can push drawings far below the fold even when the drawing exists and is correctly attached to the sheet.

## Output

Prefer saving generated files into `artifacts/` so the user can inspect the workbook directly.


====================
FILE: ~/.codex/skills/.system/spreadsheets/SKILL.md
====================

---
name: spreadsheets
description: Build, edit, recalculate, import, and export spreadsheet workbooks with the preloaded @oai/artifact-tool JavaScript surface through the artifacts tool.
metadata:
  short-description: Use the artifacts tool to create and edit spreadsheets in JavaScript
---

# Spreadsheets

Use this skill when the user wants to create or modify workbooks with the `artifacts` tool.

## Tool Contract

- Use the `artifacts` tool.
- Send raw JavaScript only. Do not send JSON objects, quoted code, or markdown fences.
- This tool runs plain JavaScript in Node, not TypeScript. Do not use type annotations, `type`, `interface`, or `import type`.
- Do not write `import { ... } from "@oai/artifact-tool"`. The package surface is already preloaded.
- Named exports such as `Workbook`, `SpreadsheetFile`, and `FileBlob` are available directly.
- The full module is also available as `artifactTool`, `artifacts`, and `codexArtifacts`.
- Save outputs under a user-visible path such as `artifacts/revenue-model.xlsx`.

## Quick Start

```js
const workbook = Workbook.create();
const sheet = workbook.worksheets.add("Revenue");

sheet.getRange("A1:C1").values = [["Month", "Bookings", "ARR"]];
sheet.getRange("A2:C4").values = [
  ["Jan", 120000, 1440000],
  ["Feb", 135000, 1620000],
  ["Mar", 142000, 1704000],
];

sheet.getRange("E1").values = [["Quarter ARR"]];
sheet.getRange("E2").formulas = [["=SUM(C2:C4)"]];

workbook.recalculate();

const xlsxBlob = await SpreadsheetFile.exportXlsx(workbook);
await xlsxBlob.save("artifacts/revenue-model.xlsx");
```

## Common Patterns

- Create a workbook with `Workbook.create()`.
- Import an existing workbook with `await SpreadsheetFile.importXlsx(await FileBlob.load("book.xlsx"))`.
- Add sheets with `workbook.worksheets.add(name)`.
- Address cells and ranges with A1 notation via `sheet.getRange("A1:C10")`.
- Set `range.values` and `range.formulas`, then call `workbook.recalculate()` before reading computed values.
- For charts, prefer creating the chart first, then populating it directly on the returned object. In practice, the reliable pattern is `const chart = sheet.charts.add("line"); chart.setPosition("A10", "H24"); chart.title = "..."; chart.categories = [...]; const series = chart.series.add("Name"); series.values = [...];`. Some other chart-construction styles can produce workbook objects that look valid in memory but export to empty or hidden charts in the final `.xlsx`.
- For worksheet images, prefer `sheet.images.add({ blob, contentType, anchor: { from: ..., to: ... } })`. The `blob` payload shape is the reliable path.
- Export an `.xlsx` with `await SpreadsheetFile.exportXlsx(workbook)`.

## Workflow

- Model the workbook structure first: sheets, headers, and key formulas.
- Use formulas instead of copying computed values when the sheet should remain editable.
- Recalculate before exporting or reading formula results.
- If the workbook includes charts or images, verify layout after export, not just in memory. A sheet-level render pass such as `await workbook.render({ sheet: index, format: "png" })` is a good QA step before handoff.
- Check where drawings land on the actual sheet. Merged cells and very tall autofit rows can push visible content far below the fold, so QA should confirm not only that a chart exists, but that it appears in an obvious on-sheet location.
- When editing an existing workbook, load it first and preserve unaffected sheets.

## Reference Map

- [`references/workbook.md`](./references/workbook.md) for workbook lifecycle and worksheet basics.
- [`references/ranges.md`](./references/ranges.md) for A1 addressing, values, formulas, and formatting.


====================
FILE: ~/.codex/skills/.system/slides/references/presentation.md
====================

# Presentation API

Use `Presentation` as the main facade for authoring and editing decks.

## Lifecycle

```js
const presentation = Presentation.create({
  slideSize: { width: 960, height: 540 },
});
```

- `Presentation.create()` creates a new empty deck.
- `await PresentationFile.importPptx(await FileBlob.load("deck.pptx"))` imports an existing deck.
- `await PresentationFile.exportPptx(presentation)` exports the deck as a saveable blob.
- When using this skill operationally, start by authoring with these APIs rather than checking local runtime package directories first. Runtime or package-cache inspection is a fallback for cases where the `artifacts` tool itself fails before deck code executes.

## Slides

- `presentation.slides.add()` appends a slide.
- `presentation.slides.insert({ after, layout, layoutId })` inserts relative to another slide.
- `presentation.slides.getItem(index)` returns a slide by zero-based index.
- `presentation.slides.items` exposes the backing collection when you need to iterate. Do not assume the collection is a normal array or that `.get(...)` exists.
- `presentation.setActiveSlide(slide)` and `presentation.getActiveSlide()` manage the active pointer.

## Content

- `slide.shapes.add({ geometry, position, fill, line })`
- `slide.elements.images.add(...)`
- `slide.tables.add(...)`
- `slide.elements.charts.add("line", { position })`

For the current runtime, charts are most reliable when created as slide elements:

```js
const chart = slide.elements.charts.add("line", {
  position: { left: 80, top: 180, width: 640, height: 320 },
});
chart.title = "Representative factory horsepower";
chart.categories = ["1964", "1973", "1989", "2024"];
const series = chart.series.add("911");
series.values = [130, 210, 247, 518];
chart.hasLegend = false;
```

For preview-safe images, prefer embedded bytes over a bare path or URL:

```js
const fs = await import("node:fs/promises");
const source = await fs.readFile("artifacts/porsche.jpg");
const imageBuffer = source.buffer.slice(
  source.byteOffset,
  source.byteOffset + source.byteLength,
);

slide.elements.images.add({
  blob: imageBuffer,
  contentType: "image/jpeg",
  position: { left: 500, top: 0, width: 460, height: 540 },
  fit: "cover",
});
```

Passing only `path`, `url`, `src`, or a Node `Buffer` may appear to work for export setup but fail during PNG preview rendering. Use an `ArrayBuffer` when the image must render in previews reliably.

When exporting a fully custom deck, also watch for inherited layout placeholders in the PPTX output. These often show up as empty shapes named `Title 1`, `Subtitle 2`, `Date Placeholder 3`, `Footer Placeholder 4`, or `Slide Number Placeholder 5`, and PowerPoint may render them as `Click to add ...` boxes even if preview PNGs look fine.

Use a cleanup pass before final export when placeholders are not wanted:

```js
const placeholderNames = new Set([
  "Title 1",
  "Subtitle 2",
  "Date Placeholder 3",
  "Footer Placeholder 4",
  "Slide Number Placeholder 5",
]);

for (const slide of presentation.slides.items) {
  const toDelete = slide.shapes.items.filter((shape) => {
    const name = shape.name ?? "";
    return placeholderNames.has(name) || Boolean(shape.placeholderType);
  });
  for (const shape of toDelete) {
    shape.delete();
  }
}
```

Collection access is not fully array-like:

- Use `slide.shapes.getItem(index)` or `slide.shapes.items[index]` for reads.
- Prefer probing with `Object.getOwnPropertyNames(Object.getPrototypeOf(...))` if you are unsure what a collection or element exposes.

## Text

Basic text works through the `text` property:

```js
const title = slide.shapes.add({
  geometry: "rect",
  position: { left: 80, top: 72, width: 800, height: 96 },
});
title.text = "Q2 Product Update";
```

Simple styling works through `textStyle`:

```js
title.textStyle = {
  fontSize: 28,
  color: "#101820",
  bold: true,
  italic: false,
};
```

Text boxes do not auto-resize to fit content. If the text might wrap, increase the shape height before you add more copy, and leave visible padding on all sides rather than sizing the box flush to the current line count.

Treat text placement as a layout quality check, not a best-effort outcome:

- Make sure the text color has strong contrast against the fill, image, or slide background behind it.
- Keep text fully inside the intended geometry with visible padding on each side.
- Do not allow text boxes to overlap each other or hide beneath charts, images, or decorative shapes.
- When text is inside a box or card, choose alignment intentionally. Center only when the design calls for centered copy; otherwise use the alignment that best matches the surrounding layout.

When you are authoring a new deck, confirm typography and clipping by rendering a PNG preview rather than assuming the slide will look right after export.

All geometry uses CSS pixels at 96 DPI.

## Preview

```js
const fs = await import("node:fs/promises");
const preview = await presentati

====================
FILE: ~/.codex/skills/.system/slides/references/auto-layout.md
====================

# Auto Layout

Use auto-layout helpers when several shapes should align or distribute predictably.

```js
const title = slide.shapes.add({ geometry: "rect" });
const subtitle = slide.shapes.add({ geometry: "rect" });

title.position = { width: 720, height: 72 };
subtitle.position = { width: 720, height: 40 };

slide.autoLayout([title, subtitle], {
  direction: AutoLayoutDirection.vertical,
  frame: "slide",
  align: AutoLayoutAlign.topLeft,
  horizontalPadding: 72,
  verticalPadding: 64,
  verticalGap: 12,
});
```

Useful enums:

- `AutoLayoutDirection.vertical`
- `AutoLayoutDirection.horizontal`
- `AutoLayoutAlign.topLeft`
- `AutoLayoutAlign.center`
- `AutoLayoutAlign.bottomLeft`

Prefer auto-layout for title stacks, card grids, and footer or header placement instead of hand-adjusting every `left` and `top`.


====================
FILE: ~/.codex/skills/.system/slides/SKILL.md
====================

---
name: slides
description: Build, edit, render, import, and export presentation decks with the preloaded @oai/artifact-tool JavaScript surface through the artifacts tool.
metadata:
  short-description: Use the artifacts tool to create and edit slide decks in JavaScript
---

# Slides

Use this skill when the user wants to create or modify presentation decks with the `artifacts` tool.

## Tool Contract

- Use the `artifacts` tool.
- Send raw JavaScript only. Do not send JSON objects, quoted code, or markdown fences.
- This tool runs plain JavaScript in Node, not TypeScript. Do not use type annotations, `type`, `interface`, or `import type`.
- Do not write `import { ... } from "@oai/artifact-tool"`. The `@oai/artifact-tool` module surface is already preloaded on `globalThis`.
- Named exports such as `Presentation`, `PresentationFile`, `FileBlob`, `AutoLayoutAlign`, and `AutoLayoutDirection` are available directly.
- The full module is also available as `artifactTool`, `artifacts`, and `codexArtifacts`.
- You may still import Node built-ins such as `node:fs/promises` when you need to write preview bytes to disk.
- Save outputs under a user-visible path such as `artifacts/quarterly-update.pptx` or `artifacts/slide-1.png`.

## Quick Start

```js
const presentation = Presentation.create({
  slideSize: { width: 960, height: 540 },
});

const slide = presentation.slides.add();
slide.background.fill = "background1";

const title = slide.shapes.add({
  geometry: "roundRect",
  position: { left: 80, top: 72, width: 800, height: 96 },
  fill: "accent1",
});
title.text = "Q2 Product Update";

const subtitle = slide.shapes.add({
  geometry: "rect",
  position: { left: 80, top: 196, width: 800, height: 48 },
});
subtitle.text = "Launch status, reliability, and next milestones";

const pptxBlob = await PresentationFile.exportPptx(presentation);
await pptxBlob.save("artifacts/q2-product-update.pptx");
```

## Runtime Guardrails

- Prefer `slide.elements.charts.add("line", { position: ... })` for charts. The runtime chart surface is element-based; `slide.charts.add(...)` is not the reliable entry point for authoring new charts in this skill.
- After creating a chart element, set properties on the returned chart object:

```js
const chart = slide.elements.charts.add("line", {
  position: { left: 80, top: 180, width: 640, height: 320 },
});
chart.title = "Horsepower";
chart.categories = ["1964", "1973", "1989", "2024"];
const series = chart.series.add("911");
series.values = [130, 210, 247, 518];
chart.hasLegend = false;
```

- For local or fetched images that must survive preview rendering, embed bytes rather than passing only a file path or URL. The most reliable pattern is an `ArrayBuffer` plus `contentType`:

```js
const fs = await import("node:fs/promises");
const source = await fs.readFile("artifacts/porsche.jpg");
const imageBuffer = source.buffer.slice(
  source.byteOffset,
  source.byteOffset + source.byteLength,
);

slide.elements.images.add({
  blob: imageBuffer,
  contentType: "image/jpeg",
  position: { left: 500, top: 0, width: 460, height: 540 },
  fit: "cover",
});
```

- If you fetch an image in-script, save or convert it to bytes first, then pass the `ArrayBuffer` into `slide.elements.images.add(...)`. Do not assume `path`, `url`, `src`, or a Node `Buffer` will preview correctly.
- PPTX export can still inherit layout placeholders such as `Title 1`, `Subtitle 2`, date/footer placeholders, or PowerPoint's `Click to add title` boxes. If the deck is meant to be fully custom, strip placeholder shapes before final export:

```js
const placeholderNames = new Set([
  "Title 1",
  "Subtitle 2",
  "Date Placeholder 3",
  "Footer Placeholder 4",
  "Slide Number Placeholder 5",
]);

for (const slide of presentation.slides.items) {
  const toDelete = slide.shapes.items.filter((shape) => {
    const name = shape.name ?? "";
    return placeholderNames.has(name) || Boolean(shape.placeholderType);
  });
  for (const shape of toDelete) {
    shape.delete();
  }
}
```

## Common Patterns

- Create a new deck with `Presentation.create({ slideSize })`.
- Import an existing deck with `await PresentationFile.importPptx(await FileBlob.load("deck.pptx"))`.
- Add slides with `presentation.slides.add()` or `presentation.slides.insert({ after, layout })`.
- Add content with `slide.shapes.add(...)`, `slide.tables.add(...)`, `slide.elements.charts.add(...)`, and `slide.elements.images.add(...)` when you need preview-safe embedded images.
- Render a preview with `await presentation.export({ slide, format: "png", scale: 2 })`, then write `new Uint8Array(await blob.arrayBuffer())` with `node:fs/promises`.
- Export a `.pptx` with `await PresentationFile.exportPptx(presentation)`.

## Workflow

- Start with the smallest script that creates or imports the deck.
- Do not begin by checking whether the local artifacts runtime package or cache exists. Assume the `artifacts` tool is ready and start authoring immediately; only investigate runtime

====================
FILE: ~/.codex/skills/.system/skill-creator/references/openai_yaml.md
====================

# openai.yaml fields (full example + descriptions)

`agents/openai.yaml` is an extended, product-specific config intended for the machine/harness to read, not the agent. Other product-specific config can also live in the `agents/` folder.

## Full example

```yaml
interface:
  display_name: "Optional user-facing name"
  short_description: "Optional user-facing description"
  icon_small: "./assets/small-400px.png"
  icon_large: "./assets/large-logo.svg"
  brand_color: "#3B82F6"
  default_prompt: "Optional surrounding prompt to use the skill with"

dependencies:
  tools:
    - type: "mcp"
      value: "github"
      description: "GitHub MCP server"
      transport: "streamable_http"
      url: "https://api.githubcopilot.com/mcp/"

policy:
  allow_implicit_invocation: true
```

## Field descriptions and constraints

Top-level constraints:

- Quote all string values.
- Keep keys unquoted.
- For `interface.default_prompt`: generate a helpful, short (typically 1 sentence) example starting prompt based on the skill. It must explicitly mention the skill as `$skill-name` (e.g., "Use $skill-name-here to draft a concise weekly status update.").

- `interface.display_name`: Human-facing title shown in UI skill lists and chips.
- `interface.short_description`: Human-facing short UI blurb (25–64 chars) for quick scanning.
- `interface.icon_small`: Path to a small icon asset (relative to skill dir). Default to `./assets/` and place icons in the skill's `assets/` folder.
- `interface.icon_large`: Path to a larger logo asset (relative to skill dir). Default to `./assets/` and place icons in the skill's `assets/` folder.
- `interface.brand_color`: Hex color used for UI accents (e.g., badges).
- `interface.default_prompt`: Default prompt snippet inserted when invoking the skill.
- `dependencies.tools[].type`: Dependency category. Only `mcp` is supported for now.
- `dependencies.tools[].value`: Identifier of the tool or dependency.
- `dependencies.tools[].description`: Human-readable explanation of the dependency.
- `dependencies.tools[].transport`: Connection type when `type` is `mcp`.
- `dependencies.tools[].url`: MCP server URL when `type` is `mcp`.
- `policy.allow_implicit_invocation`: When false, the skill is not injected into
  the model context by default, but can still be invoked explicitly via `$skill`.
  Defaults to true.


====================
FILE: ~/.codex/skills/.system/skill-creator/SKILL.md
====================

---
name: skill-creator
description: Guide for creating effective skills. This skill should be used when users want to create a new skill (or update an existing skill) that extends Codex's capabilities with specialized knowledge, workflows, or tool integrations.
metadata:
  short-description: Create or update a skill
---

# Skill Creator

This skill provides guidance for creating effective skills.

## About Skills

Skills are modular, self-contained folders that extend Codex's capabilities by providing
specialized knowledge, workflows, and tools. Think of them as "onboarding guides" for specific
domains or tasks—they transform Codex from a general-purpose agent into a specialized agent
equipped with procedural knowledge that no model can fully possess.

### What Skills Provide

1. Specialized workflows - Multi-step procedures for specific domains
2. Tool integrations - Instructions for working with specific file formats or APIs
3. Domain expertise - Company-specific knowledge, schemas, business logic
4. Bundled resources - Scripts, references, and assets for complex and repetitive tasks

## Core Principles

### Concise is Key

The context window is a public good. Skills share the context window with everything else Codex needs: system prompt, conversation history, other Skills' metadata, and the actual user request.

**Default assumption: Codex is already very smart.** Only add context Codex doesn't already have. Challenge each piece of information: "Does Codex really need this explanation?" and "Does this paragraph justify its token cost?"

Prefer concise examples over verbose explanations.

### Set Appropriate Degrees of Freedom

Match the level of specificity to the task's fragility and variability:

**High freedom (text-based instructions)**: Use when multiple approaches are valid, decisions depend on context, or heuristics guide the approach.

**Medium freedom (pseudocode or scripts with parameters)**: Use when a preferred pattern exists, some variation is acceptable, or configuration affects behavior.

**Low freedom (specific scripts, few parameters)**: Use when operations are fragile and error-prone, consistency is critical, or a specific sequence must be followed.

Think of Codex as exploring a path: a narrow bridge with cliffs needs specific guardrails (low freedom), while an open field allows many routes (high freedom).

### Anatomy of a Skill

Every skill consists of a required SKILL.md file and optional bundled resources:

```
skill-name/
├── SKILL.md (required)
│   ├── YAML frontmatter metadata (required)
│   │   ├── name: (required)
│   │   └── description: (required)
│   └── Markdown instructions (required)
├── agents/ (recommended)
│   └── openai.yaml - UI metadata for skill lists and chips
└── Bundled Resources (optional)
    ├── scripts/          - Executable code (Python/Bash/etc.)
    ├── references/       - Documentation intended to be loaded into context as needed
    └── assets/           - Files used in output (templates, icons, fonts, etc.)
```

#### SKILL.md (required)

Every SKILL.md consists of:

- **Frontmatter** (YAML): Contains `name` and `description` fields. These are the only fields that Codex reads to determine when the skill gets used, thus it is very important to be clear and comprehensive in describing what the skill is, and when it should be used.
- **Body** (Markdown): Instructions and guidance for using the skill. Only loaded AFTER the skill triggers (if at all).

#### Agents metadata (recommended)

- UI-facing metadata for skill lists and chips
- Read references/openai_yaml.md before generating values and follow its descriptions and constraints
- Create: human-facing `display_name`, `short_description`, and `default_prompt` by reading the skill
- Generate deterministically by passing the values as `--interface key=value` to `scripts/generate_openai_yaml.py` or `scripts/init_skill.py`
- On updates: validate `agents/openai.yaml` still matches SKILL.md; regenerate if stale
- Only include other optional interface fields (icons, brand color) if explicitly provided
- See references/openai_yaml.md for field definitions and examples

#### Bundled Resources (optional)

##### Scripts (`scripts/`)

Executable code (Python/Bash/etc.) for tasks that require deterministic reliability or are repeatedly rewritten.

- **When to include**: When the same code is being rewritten repeatedly or deterministic reliability is needed
- **Example**: `scripts/rotate_pdf.py` for PDF rotation tasks
- **Benefits**: Token efficient, deterministic, may be executed without loading into context
- **Note**: Scripts may still need to be read by Codex for patching or environment-specific adjustments

##### References (`references/`)

Documentation and reference material intended to be loaded as needed into context to inform Codex's process and thinking.

- **When to include**: For documentation that Codex should reference while working
- **Examples**: `references/finance.md` for financial schemas, `refe

====================
FILE: ~/.codex/skills/.system/skill-installer/SKILL.md
====================

---
name: skill-installer
description: Install Codex skills into $CODEX_HOME/skills from a curated list or a GitHub repo path. Use when a user asks to list installable skills, install a curated skill, or install a skill from another repo (including private repos).
metadata:
  short-description: Install curated skills from openai/skills or other repos
---

# Skill Installer

Helps install skills. By default these are from https://github.com/openai/skills/tree/main/skills/.curated, but users can also provide other locations. Experimental skills live in https://github.com/openai/skills/tree/main/skills/.experimental and can be installed the same way.

Use the helper scripts based on the task:
- List skills when the user asks what is available, or if the user uses this skill without specifying what to do. Default listing is `.curated`, but you can pass `--path skills/.experimental` when they ask about experimental skills.
- Install from the curated list when the user provides a skill name.
- Install from another repo when the user provides a GitHub repo/path (including private repos).

Install skills with the helper scripts.

## Communication

When listing skills, output approximately as follows, depending on the context of the user's request. If they ask about experimental skills, list from `.experimental` instead of `.curated` and label the source accordingly:
"""
Skills from {repo}:
1. skill-1
2. skill-2 (already installed)
3. ...
Which ones would you like installed?
"""

After installing a skill, tell the user: "Restart Codex to pick up new skills."

## Scripts

All of these scripts use network, so when running in the sandbox, request escalation when running them.

- `scripts/list-skills.py` (prints skills list with installed annotations)
- `scripts/list-skills.py --format json`
- Example (experimental list): `scripts/list-skills.py --path skills/.experimental`
- `scripts/install-skill-from-github.py --repo <owner>/<repo> --path <path/to/skill> [<path/to/skill> ...]`
- `scripts/install-skill-from-github.py --url https://github.com/<owner>/<repo>/tree/<ref>/<path>`
- Example (experimental skill): `scripts/install-skill-from-github.py --repo openai/skills --path skills/.experimental/<skill-name>`

## Behavior and Options

- Defaults to direct download for public GitHub repos.
- If download fails with auth/permission errors, falls back to git sparse checkout.
- Aborts if the destination skill directory already exists.
- Installs into `$CODEX_HOME/skills/<skill-name>` (defaults to `~/.codex/skills`).
- Multiple `--path` values install multiple skills in one run, each named from the path basename unless `--name` is supplied.
- Options: `--ref <ref>` (default `main`), `--dest <path>`, `--method auto|download|git`.

## Notes

- Curated listing is fetched from `https://github.com/openai/skills/tree/main/skills/.curated` via the GitHub API. If it is unavailable, explain the error and exit.
- Private GitHub repos can be accessed via existing git credentials or optional `GITHUB_TOKEN`/`GH_TOKEN` for download.
- Git fallback tries HTTPS first, then SSH.
- The skills at https://github.com/openai/skills/tree/main/skills/.system are preinstalled, so no need to help users install those. If they ask, just explain this. If they insist, you can download and overwrite.
- Installed annotations come from `$CODEX_HOME/skills`.
