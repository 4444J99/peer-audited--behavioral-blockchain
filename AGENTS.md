<!-- ORGANVM:AUTO:START -->
## System Context (auto-generated — do not edit)

**Organ:** ORGAN-III (Commerce) | **Tier:** flagship | **Status:** GRADUATED
**Org:** `organvm-iii-ergon` | **Repo:** `peer-audited--behavioral-blockchain`

### Edges
- **Produces** → `unspecified`: product
- **Produces** → `organvm-vi-koinonia/community-hub`: community_signal
- **Produces** → `organvm-vii-kerygma/kerygma-pipeline`: distribution_signal
- **Produces** → `organvm-v-logos/essay-pipeline`: essay_material
- **Consumes** ← `organvm-i-theoria/styx-behavioral-economics-theory`: theory
- **Consumes** ← `organvm-ii-poiesis/styx-behavioral-art`: creative-artifact
- **Consumes** ← `organvm-iv-taxis/orchestration-start-here`: governance-rules

### Siblings in Commerce
`classroom-rpg-aetheria`, `gamified-coach-interface`, `trade-perpetual-future`, `fetch-familiar-friends`, `sovereign-ecosystem--real-estate-luxury`, `public-record-data-scrapper`, `search-local--happy-hour`, `multi-camera--livestream--framework`, `universal-mail--automation`, `mirror-mirror`, `the-invisible-ledger`, `enterprise-plugin`, `virgil-training-overlay`, `tab-bookmark-manager`, `a-i-chat--exporter` ... and 16 more

### Governance
- Strictly unidirectional flow: I→II→III. No dependencies on Theory (I).

*Last synced: 2026-05-16T19:48:11Z*

<!-- ORGANVM:AUTO:END -->

## Active Handoff Protocol

If `.conductor/active-handoff.md` exists, **READ IT FIRST** before doing any work.
It contains constraints, locked files, conventions, and completed work from the
originating agent. You MUST honor all constraints listed there.

If the handoff says "CROSS-VERIFICATION REQUIRED", your self-assessment will
NOT be trusted. A different agent will verify your output against these constraints.

## Session Review Protocol

At the end of each session that produces or modifies files:
1. Run `organvm session review --latest` to get a session summary
2. Check for unimplemented plans: `organvm session plans --project .`
3. Export significant sessions: `organvm session export <id> --slug <slug>`
4. Run `organvm prompts distill --dry-run` to detect uncovered operational patterns

Transcripts are on-demand (never committed):
- `organvm session transcript <id>` — conversation summary
- `organvm session transcript <id> --unabridged` — full audit trail
- `organvm session prompts <id>` — human prompts only

## Repo Facts

### Monorepo Structure

Turborepo + npm workspaces. Package scope: `@styx/*`. Root `tsconfig.json` maps `@styx/shared/*` → `src/shared/*`.

| Workspace | Stack | Entry | Notes |
|-----------|-------|-------|-------|
| `src/api` | NestJS 11, BullMQ, Stripe, pg | `nest-cli.json` entryFile: `api/src/main` | Double-entry ledger, Fury router, escrow |
| `src/web` | Next.js 16, React 18, Tailwind | dev on port **3001** | Dashboard, Fury workbench |
| `src/mobile` | React Native 0.81, Expo 54 | `expo run:ios` / `expo run:android` | Sensor bridge, camera, biometrics |
| `src/desktop` | Tauri 2, Vite, React | `src-tauri/tauri.conf.json` | "The Judge" admin dashboard |
| `src/shared` | TypeScript | `dist/index.js` | Constants, types, algorithms — **must build before others** |
| `src/pitch` | Vite, React, p5.js | interactive pitch deck | build outputs to `docs/` |
| `src/ask-styx` | Cloudflare Worker (wrangler) | `worker/index.ts` | LLM proxy for Ask Styx UI |
| `src/test-harness` | Vitest, Commander CLI | `bin/ergon-test` | Validation & simulation suite |

### Setup & Dev Commands

```bash
# Prerequisites: Node.js >= 20, Docker, npm 10+
docker-compose up -d                    # PostgreSQL (5432) + Redis (6379)
make install                            # npm install (all workspaces)
cd src/api && npm run migrate && cd ../..  # DB migrations (required before API works)
make dev                                # npx turbo run dev (API + Web + Mobile)
```

### Verification Commands

```bash
make test                               # All unit/integration tests via turbo
cd src/api && npx jest                  # API tests only (640)
cd src/web && npx jest                  # Web tests only (166)
cd src/mobile && npx jest               # Mobile tests only (273)
cd src/desktop && npx jest              # Desktop tests only (128)
cd src/test-harness && npx vitest       # Test-harness uses Vitest, not Jest
npx jest --testNamePattern="pattern"    # Single test by name pattern

make test-e2e                           # Playwright (chromium + firefox)
make test-e2e-ui                        # Playwright interactive UI

npx turbo run lint                      # TypeScript strict check (tsc --noEmit per workspace)
npm run format                          # Prettier: **/*.{ts,tsx,md}
```

### CI Pipeline Order (`.github/workflows/ci.yml`)

1. `npm ci` + `npm audit --audit-level=high`
2. `turbo run test` — **no** `--coverage --ci`: those are jest-only flags that make the Vitest workspaces (`ask-styx`, `test-harness`) throw `CACError: Unknown option --ci` and break API suite-loading (ci.yml carries an explicit NOTE; coverage gating is a tracked follow-up)
3. `turbo run build`
4. `turbo run lint`
5. Gate 04: redacted build check (no gambling vocabulary in production build)
6. Gate 05: behavioral physics check (skipped if `CI_GATE05_API_URL` not set)
7. Gate 06: security invariant check
8. Gate 07: claim drift check (`npm run validate:claims`)
9. Beta readiness (uploads `artifacts/beta-readiness-summary.json`)
10. Terraform validate (`infra/terraform/`)
11. E2E Playwright (chromium + firefox matrix)
12. CodeQL

### Deployment

- **Production**: triggered by `v*` tag or `workflow_dispatch` on `main`
- Deploys API + Web to **Render** (Oregon region) via `render.yaml` blueprint
- Migrations run **after** API deploy, **before** smoke tests
- Smoke test includes best-effort redeploy fallback on API readiness failure (not true rollback)
- **Ask Styx**: deploys to GitHub Pages on push to `src/ask-styx/**`; worker uses Cloudflare Wrangler
- Staging/beta promotion workflows gate production deploy

### Key Conventions & Gotchas

- **Lint = `tsc --noEmit`** — no ESLint config at workspace level. TypeScript strict mode is the lint.
- **`turbo.json`**: `test` dependsOn `build` — you cannot run tests without building first via turbo.
- **Linguistic Cloaker**: production builds swap gambling terms (stake→commitment, bet→vault). Gate 04 validates this. Run `bash scripts/validation/04-redacted-build-check.sh` locally to check.
- **`@styx/shared`** must be built before any workspace that imports from it can build or test.
- **Playwright** auto-starts the web server (`cd src/web && npm run dev`) unless `CI=true`, then uses `npm run start`. Base URL: `http://localhost:3001`.
- **EditorConfig**: 2-space indent for TS/TSX, LF line endings, final newline required.
- **Mobile `build` and `lint` are both `tsc --noEmit`** — no actual bundle build. Native builds use `expo run:*`.
- **Pitch build outputs to `docs/`** (see `turbo.json` `@styx/pitch#build` outputs) — not `dist/`.
- **Environment**: copy `.env.example` → `.env`. `GEOFENCE_FAIL_OPEN_ON_MISSING_HEADERS` defaults to `false` (fail-closed in beta); set to `true` for local dev without geo headers.

### Validation Gates (local)

```bash
npx tsx scripts/validation/01-phantom-money-check.ts      # Ledger balance integrity
npx tsx scripts/validation/02-simulator-spoof-check.ts     # Oracle spoof detection
npx tsx scripts/validation/03-the-full-loop.ts             # End-to-end contract lifecycle
bash scripts/validation/04-redacted-build-check.sh         # Production vocabulary sweep
npx tsx scripts/validation/05-behavioral-physics-check.ts   # Algorithm constants
node scripts/validation/07-claim-drift-check.js            # Claim drift
```

### Beta Readiness

```bash
BETA_API_URL=https://api-beta.example.com npm run beta:readiness
```
Writes `artifacts/beta-readiness-summary.json`. Full policy: `docs/planning/beta-readiness-contract.md`.
