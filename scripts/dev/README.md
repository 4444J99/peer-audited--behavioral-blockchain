# `scripts/dev/` — Surface Index

Local **dev-stack launchers**. Each `run-*.mjs` builds a validated env (via `env.mjs`) and
spawns one service; `app-stack.mjs` runs API+web together with fail-fast env validation.
Wired to `package.json` scripts. **User/buyer:** a developer running Styx locally.
Template: [`../SURFACE-PACKET.template.md`](../SURFACE-PACKET.template.md).

| Name | Problem solved | Run | Verify | Safety | Level |
|------|----------------|-----|--------|--------|-------|
| `app-stack.mjs` | Boot the full stack (API+web), failing fast on bad config | `npm run dev` | Both API and web come up; a bad env aborts with one clear error before spawn | Local processes; reads `.env*` | L1 |
| `run-api.mjs` | Run just the API (ts-node) | `npm run dev:api` | API process starts in `src/api` | Local process | L1 |
| `run-web.mjs` | Run just the web app (Next dev) | `npm run dev:web` | Next dev server starts in `src/web` on `env.PORT` | Local process | L1 |
| `run-migrate.mjs` | Run DB migrations | `npm run dev:migrate` | Migrations apply via `tsx database/migrations/migrate.ts` | **Mutates the DB** — point at a local/dev DB | L1 |
| `env.mjs` | Shared, validated env builder for the above | imported by `app-stack`/`run-*` (not run directly) | Other dev scripts get a populated `repoRoot` + env; missing files handled | Parses `.env*`; no network | L0 |

> **Disable/uninstall (all):** stateless launchers — stop the spawned process (Ctrl-C).
> **Proof:** `app-stack.mjs` pre-validates both envs before spawning to avoid half-running
> stacks; `env.mjs` resolves `repoRoot` from its own module URL. Capture a `npm run dev` log.
