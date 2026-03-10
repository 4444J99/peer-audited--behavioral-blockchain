# Ask Styx — Static GH Pages Chat + Cloudflare Worker Proxy

**Date**: 2026-03-04
**Context**: The `/ask` stakeholder chat in the Styx monorepo requires a Next.js server route to proxy LLM calls. We're extracting it into a standalone Vite+React SPA deployable to GitHub Pages, with a Cloudflare Worker holding the API key.

## Architecture

```
┌──────────────────────┐      ┌───────────────────────────┐      ┌──────────────┐
│  GitHub Pages (static)│ ──→  │ CF Worker (ask-styx-proxy)│ ──→  │ Groq API     │
│  ask-styx SPA        │ SSE  │ rate limit + CORS + key   │      │ Llama 3.3 70B│
│  Vite + React + TW   │ ←──  │ ~50 lines                 │      │              │
└──────────────────────┘      └───────────────────────────┘      └──────────────┘
```

## Deliverables

### 1. New repo: `ask-styx` under `organvm-iii-ergon`

```
ask-styx/
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.ts
├── postcss.config.js
├── seed.yaml
├── CLAUDE.md
├── .github/
│   └── workflows/
│       └── deploy.yml          # Build + deploy to GH Pages on push to main
├── worker/
│   ├── index.ts                # Cloudflare Worker (~50 lines)
│   ├── wrangler.toml           # Worker config
│   └── package.json            # Worker deps (wrangler)
├── public/
│   └── favicon.svg
├── src/
│   ├── main.tsx                # React mount
│   ├── index.css               # Tailwind imports
│   ├── App.tsx                 # Full-page chat layout
│   ├── components/
│   │   ├── ChatInterface.tsx   # Extracted + adapted (calls worker URL instead of /api/chat)
│   │   └── ChatMessage.tsx     # Extracted as-is (zero-dep markdown renderer)
│   └── lib/
│       └── styx-knowledge.ts   # Copied from monorepo (injected into worker system prompt)
└── tests/
    ├── ChatMessage.test.tsx
    └── ChatInterface.test.tsx
```

### 2. Cloudflare Worker: `ask-styx-proxy`

**What it does** (~50 lines):
- Accepts POST from the static site (CORS: allow the GH Pages origin)
- Holds `GROQ_API_KEY` as a Worker secret (never exposed to browser)
- Injects `STYX_KNOWLEDGE` system prompt
- Streams SSE response back to the browser (same format as current `/api/chat`)
- Rate limits: 30 req/min per IP via CF's built-in rate limiting or simple in-memory map
- Returns proper CORS headers for the GH Pages domain

**Config** (`wrangler.toml`):
```toml
name = "ask-styx-proxy"
main = "worker/index.ts"
compatibility_date = "2026-03-04"

[vars]
ALLOWED_ORIGIN = "https://organvm-iii-ergon.github.io"
LLM_MODEL = "llama-3.3-70b-versatile"
LLM_BASE_URL = "https://api.groq.com/openai/v1"
```

Secret (set via `wrangler secret put GROQ_API_KEY`):
- `GROQ_API_KEY` — never in source

### 3. Static SPA adaptations

**ChatInterface.tsx changes from monorepo version:**
- `fetch('/api/chat', ...)` → `fetch(WORKER_URL, ...)` where `WORKER_URL` is build-time env var
- System prompt + knowledge base moves to the worker (not shipped in the SPA bundle — saves ~50KB)
- Remove Next.js-specific imports
- Keep: localStorage persistence, streaming SSE parsing, export-as-md, suggested questions, markdown rendering

**ChatMessage.tsx:**
- Copy as-is — zero external deps, pure React

### 4. GitHub Pages deploy workflow

```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages
on:
  push:
    branches: [main]
jobs:
  build-deploy:
    runs-on: ubuntu-latest
    permissions:
      pages: write
      id-token: write
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22 }
      - run: npm ci
      - run: npm run build
        env:
          VITE_WORKER_URL: ${{ vars.WORKER_URL }}
      - uses: actions/upload-pages-artifact@v3
        with: { path: dist }
      - uses: actions/deploy-pages@v4
```

## Key decisions

| Decision | Choice | Reason |
|----------|--------|--------|
| Knowledge base location | Worker (not SPA bundle) | Saves ~50KB from client, keeps system prompt private |
| Framework | Vite + React 18 + Tailwind | Matches ORGAN-III SPA pattern (fetch-familiar-friends) |
| Test runner | Vitest | Matches ORGAN-III SPA pattern |
| Worker runtime | Cloudflare Workers | Free 100k req/day, already used in org |
| Styling | Dark theme (neutral-950 bg, red-600 accent) | Matches existing Styx brand |
| Base path | `/ask-styx/` | GH Pages project site under org |

## Files to extract from monorepo

| Source (monorepo) | Destination (ask-styx) | Changes |
|-------------------|------------------------|---------|
| `src/web/components/chat/ChatMessage.tsx` | `src/components/ChatMessage.tsx` | Remove Next.js/React import compat if needed |
| `src/web/components/chat/ChatInterface.tsx` | `src/components/ChatInterface.tsx` | Replace `/api/chat` → `VITE_WORKER_URL`, remove `next/` imports |
| `src/web/lib/styx-knowledge.ts` | `worker/styx-knowledge.ts` | Goes into worker, not SPA |
| `src/web/app/api/chat/route.ts` | `worker/index.ts` | Rewrite as CF Worker (no Next.js, use `fetch` to Groq) |

## Implementation order

1. Create repo directory + scaffold (package.json, vite config, tailwind, tsconfig)
2. Extract + adapt ChatMessage.tsx and ChatInterface.tsx
3. Build the Cloudflare Worker
4. Add GH Pages deploy workflow
5. Add seed.yaml + CLAUDE.md
6. Tests (Vitest)
7. Build verify: `npm run build` succeeds, `npm test` passes
8. Init git, commit, create remote repo, push

## Verification

1. `npm run build` — produces `dist/` with static assets
2. `npm test` — all component tests pass
3. `npx vite preview` — loads at localhost, suggested questions visible
4. Worker: `npx wrangler dev` — responds to POST with SSE stream
5. Integration: SPA → Worker → Groq → streamed response renders with markdown
6. GH Pages: push to main triggers deploy, site live at `https://organvm-iii-ergon.github.io/ask-styx/`

## Also: Fix ORGAN-III org name reference

The user noted the GitHub org is `organvm-iii-ergon` — fix any references in CLAUDE.md that incorrectly name it `labores-profani-crux`.
