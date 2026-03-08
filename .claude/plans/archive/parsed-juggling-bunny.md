# Plan: Resolve All 6 Deferred Seed Alignment Gaps

## Context

The first 8 sprints resolved 20 of 25 gaps (G1-G9, G12, G17, G19-G25) across 8 commits now pushed to origin. The remaining 6 gaps were deferred as "too large or requires external services":

| Gap | Feature | Original Deferral Reason |
|-----|---------|--------------------------|
| G10 | Blockchain/SBT integration | Significant external dependency |
| G11 | WebSocket live interview scoring | 6-8 hours, requires real LLM |
| G13 | Custom mask creation UI | 6-8 hours, new feature |
| G15 | LLM agent executor | 8-12 hours, requires LLM infra |
| G16 | Community marketplace | 40+ hours, Phase 9 aspiration |
| G18 | Full WCAG 2.1 AA | 20-40 hours |

**Exploration revealed that several gaps are more tractable than originally estimated:**
- **G13**: `MaskEditor.tsx` (589 lines) and API routes already fully exist — only needs UI wiring (~4 hours)
- **G11**: WebSocket + GraphQL-WS transport already wired, `CompatibilityAnalyzer` works — needs incremental scoring + PubSub events
- **G15**: Full agent framework (10 roles, config, RoutedAgentExecutor) exists — only StubExecutor needs replacement
- **G16**: Descoped to Minimum Viable Marketplace (template sharing + ratings) to close the Phase 9 drift claim honestly

---

## Design Decisions

1. **Order**: G13 → G18 → G11 → G15 → G10 → G16 (risk gradient: known → unknown, a11y early so downstream UI inherits good patterns)
2. **G16 scope**: Minimum Viable Marketplace — template sharing, ratings, search. NO payment/transactions.
3. **G10 chain library**: `viem` over ethers.js (TypeScript-first, tree-shakeable, MIT license, lighter for 16GB RAM). Target Sepolia testnet.
4. **G15 LLM target**: Ollama-first per existing `oss` LLM policy. OpenAI-compatible path comes free via existing `callOpenAICompatible`.
5. **G18 scope**: Critical-path pass — skip links, focus indicators, contrast fixes, design-system ARIA, jest-axe tests. Enough to validate the WCAG claim.
6. **Commits**: Each gap gets atomic commits following schema → backend → frontend → tests → docs.

---

## Sprint 1: G13 Custom Masks (4-6 hours, 2 commits)

**What exists**: `MaskEditor.tsx` (full CRUD form, undo/redo, API integration), `POST/PATCH/DELETE /masks` routes with admin middleware, `MaskCreateSchema`/`MaskUpdateSchema` validation.

### Commit 1: Wire MaskEditor into admin + MaskSelector integration

- Create `apps/web/src/app/admin/masks/page.tsx` — admin page rendering `MaskEditor`
- Add nav link to existing admin pages (settings, beta, monitoring)
- Modify `apps/web/src/components/MaskSelector.tsx` to fetch from `GET /taxonomy/masks` API alongside `MASK_TAXONOMY` predefined masks
- Add "Custom" section below the 3 ontology groups + "Create New" link

Files:
- **Create**: `apps/web/src/app/admin/masks/page.tsx`
- **Modify**: `apps/web/src/components/MaskSelector.tsx`, admin nav pages

### Commit 2: Update audit docs

- Mark G13 resolved in `docs/SEED-ALIGNMENT-AUDIT.md`
- Update `docs/FEATURE-AUDIT.md`

---

## Sprint 2: G18 Accessibility Critical Path (12-16 hours, 4 commits)

### Commit 1: Design system a11y overhaul

- Add `--ds-focus-ring` token to `packages/design-system/src/tokens.css`
- Add `focus-visible` styles to Button, Input, Textarea, Select, Checkbox
- Add `aria-labelledby` to Modal, keyboard nav (arrow keys) to Tabs, `role="progressbar"` attrs to Progress
- Files: `packages/design-system/src/tokens.css`, `packages/design-system/src/components/{Button,Modal,Tabs,Input,Select,Checkbox,Progress}.tsx`

### Commit 2: Skip navigation + landmark structure

- Add skip-to-main link in `apps/web/src/app/layout.tsx`
- Wrap content in `<main id="main-content">`
- Add `<nav>` landmarks to dashboard navigation
- Ensure every page has one `<h1>`

### Commit 3: Contrast audit + token fixes

- Darken `--ds-stone` (#8f8376 → ~#6b6057) for 4.5:1 AA ratio on white
- Add `--ds-text-secondary` token that passes AA
- Audit `--ds-accent` usage for text (use `--ds-accent-strong` #b75128 for text)
- Files: `packages/design-system/src/tokens.css`, components using `--ds-stone` for text

### Commit 4: jest-axe tests + docs

- Add `vitest-axe` to `packages/design-system`
- Write axe tests for each component (render + `toHaveNoViolations()`)
- Update `ACCESSIBILITY.md` — remove "aspirational" banner, document what's now implemented
- **Create**: `packages/design-system/src/components/__tests__/a11y.test.tsx`

---

## Sprint 3: G11 WebSocket Live Interview Scoring (16-20 hours, 4 commits)

### Commit 1: Interview PubSub + GraphQL subscriptions

- Add interview topics to `apps/api/src/services/pubsub.ts`
- Add `InterviewScoreEvent` type and `interviewScoreUpdated(sessionId)` subscription to GraphQL schema
- Add subscription resolvers
- Files: `apps/api/src/services/{pubsub,graphql-schema,graphql-resolvers}.ts`

### Commit 2: Incremental scoring + DB persistence

- Refactor `POST /sessions/:id/answer` to run incremental `CompatibilityAnalyzer` scoring and publish PubSub events
- Move sessions from in-memory `Map` to Postgres (new migration `018_interview_sessions.sql`)
- Create `apps/api/src/repositories/interview-sessions.ts`
- Files: `apps/api/src/routes/interviews.ts`, new migration + repo

### Commit 3: Keyword-based tone analysis

- Create `packages/content-model/src/tone.ts` — `ToneAnalyzer` class with keyword-based detection (Strategy pattern for future LLM replacement)
- Wire into answer handler to populate the `tone` field
- Files: **Create** `packages/content-model/src/tone.ts`, modify `apps/api/src/routes/interviews.ts`

### Commit 4: Live dashboard UI + tests

- Create `apps/web/src/app/interview/[profileId]/live/page.tsx` — real-time score gauge, category breakdown, answer feed with tone indicators
- Create `apps/web/src/hooks/useInterviewSubscription.ts` — WebSocket subscription hook
- Unit tests for `ToneAnalyzer` and incremental scoring
- Files: new page + hook, tests in `packages/content-model/test/`

---

## Sprint 4: G15 LLM Agent Executor (20-28 hours, 5 commits)

### Commit 1: Tool calling protocol

- Extend `apps/orchestrator/src/llm.ts` to support Ollama native tool calling format
- Add schema converters (`toOllamaSchema`, `toOpenAISchema`) in `apps/orchestrator/src/tools.ts`

### Commit 2: ReAct loop

- Create `apps/orchestrator/src/react-loop.ts` — Reason-Act-Observe loop with configurable `maxIterations` (default 5)
- Thought/reasoning extraction, tool result feedback, structured final answer detection

### Commit 3: Wire RoutedAgentExecutor

- Replace `StubExecutor` with role-specific `LocalLLMExecutor` instances in `apps/orchestrator/src/agents.ts`
- Full tool-calling: implementer, architect, reviewer, tester. Text-only: narrator. HTTP-tool: hunter. Stub fallback for others.
- Graceful degradation: if Ollama unavailable → StubExecutor

### Commit 4: Per-role tool definitions

- Create `apps/orchestrator/src/tool-definitions.ts` — restricted shell commands per role (tsc, eslint, vitest), file read/write, HTTP
- Security: allowlisted commands only, no arbitrary shell execution

### Commit 5: Tests + ADR

- Mock LLM tests for ReAct loop, executor routing, tool schema conversion
- ADR-013: LLM Agent Execution Strategy
- Files: `apps/orchestrator/test/{react-loop,llm-executor,tool-definitions}.test.ts`

---

## Sprint 5: G10 Blockchain/SBT (20-26 hours, 5 commits)

### Commit 1: SBT schema

- Add `SoulboundTokenSchema`, `WalletConnectionSchema` to `packages/schema/src/verification.ts`
- Fields: profileId, attestationId, contractAddress, tokenId, chainId, txHash, mintedAt, burnedAt

### Commit 2: EVM interaction layer

- Add `viem` to `packages/core`
- Create `packages/core/src/evm/{client,sbt,abi}.ts` — chain client factory (Sepolia), SBT mint/verify/revoke, minimal ERC-5192 ABI
- Wire `did:pkh` CAIP-10 output to wallet address validation
- Dry-run mode for testing without live testnet

### Commit 3: API routes + migration

- Create `apps/api/src/routes/sbt.ts` — `POST /attestations/:id/mint-sbt`, `GET /sbt/:addr/:tokenId`, `POST /sbt/:tokenId/revoke`, `POST /wallet/connect`
- Migration `019_sbt_tokens.sql`
- Register in `apps/api/src/index.ts`

### Commit 4: Wallet connection UI

- Create `apps/web/src/components/WalletConnect.tsx` — MetaMask via `window.ethereum` (no heavy SDK)
- Create `apps/web/src/app/profile/[profileId]/verification/page.tsx` — attestation list with "Mint SBT" buttons, existing SBTs with explorer links

### Commit 5: Tests + ADR

- Mock viem public client unit tests, SBT schema validation tests
- ADR-014: Blockchain SBT Strategy

---

## Sprint 6: G16 Minimum Viable Marketplace (18-24 hours, 5 commits)

### Commit 1: Marketplace schema + migration

- Create `packages/schema/src/marketplace.ts` — `TemplateListingSchema` (title, description, maskConfig, tags, rating, downloads), `TemplateReviewSchema`, `TemplateImportSchema`
- Migration `020_marketplace.sql` — `marketplace_listings`, `marketplace_reviews`, `marketplace_imports` tables

### Commit 2: Marketplace API routes

- Create `apps/api/src/routes/marketplace.ts` — CRUD for listings, reviews, import-to-masks
- Create `apps/api/src/repositories/marketplace.ts` — Postgres repository
- Register in `apps/api/src/index.ts`

### Commit 3: Marketplace UI — browse + detail

- Create `apps/web/src/app/marketplace/page.tsx` — grid view, search, tag filters, sort by rating/downloads/newest
- Create `apps/web/src/app/marketplace/[listingId]/page.tsx` — detail view, reviews, "Import" button

### Commit 4: Publish flow from MaskEditor

- Add "Publish to Marketplace" button to `apps/web/src/components/MaskEditor.tsx`
- Create publish modal: title, description, tags, visibility

### Commit 5: Tests + Phase 9 doc fix

- API route tests, repository tests
- Update `docs/phases/PHASE-9-PLAN.md` to reflect actual marketplace scope
- Mark G16 resolved in `docs/SEED-ALIGNMENT-AUDIT.md`

---

## Effort Summary

| Sprint | Gap | Hours | Commits | New Deps |
|--------|-----|-------|---------|----------|
| 1 | G13 Custom Masks | 4-6 | 2 | — |
| 2 | G18 Accessibility | 12-16 | 4 | vitest-axe |
| 3 | G11 Interview WS | 16-20 | 4 | — |
| 4 | G15 LLM Agent | 20-28 | 5 | — |
| 5 | G10 Blockchain/SBT | 20-26 | 5 | viem |
| 6 | G16 Marketplace | 18-24 | 5 | — |
| **Total** | | **90-120** | **25** | **2** |

---

## Verification

After all sprints:
1. `pnpm typecheck` — all packages build without errors
2. `pnpm lint` — no new violations
3. `pnpm test` — unit tests pass (including new jest-axe tests)
4. Grep `docs/SEED-ALIGNMENT-AUDIT.md` for open gaps — should show 0
5. `git log --oneline -25` — 25 clean conventional commits
6. Ollama test: start Ollama locally, run orchestrator agent task, verify non-stub output
7. Wallet test: connect MetaMask to Sepolia, verify wallet binding flow
8. Marketplace test: create listing, browse, import, review
9. Interview test: start session, submit answers, verify WebSocket score updates
10. a11y test: run axe on design system components, verify 0 violations
