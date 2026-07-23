---
generated: false
department: OPS
product: styx
title: One-Command Deploy
---

# One-Command Deploy — Styx

Styx ships with a single deploy entrypoint, `scripts/deploy.sh`, so you can stand
up the whole stack locally or trigger a production deploy without memorising a
sequence of commands.

> For the full release lifecycle (tags, gates, rollback, env vars), see
> [`deployment-procedure.md`](./deployment-procedure.md). This page is the
> fast-path "just deploy it" guide.

## TL;DR

```bash
# Run the entire stack locally (API + Web + PostgreSQL + Redis). Zero config.
make deploy            # ≡ bash scripts/deploy.sh local

# → API  http://localhost:3000   (health: /health, docs: /api/docs)
# → Web  http://localhost:3001

# Tear it down
make deploy-down       # ≡ bash scripts/deploy.sh down
```

The only prerequisite is **Docker** with Compose v2 (`docker compose version`).

## Targets

| Command | What it does |
|---------|--------------|
| `bash scripts/deploy.sh local`  | Builds images and starts the full stack via Docker Compose, then waits for health checks. |
| `bash scripts/deploy.sh render` | Triggers a production deploy on Render (mirrors `.github/workflows/deploy.yml`). |
| `bash scripts/deploy.sh build`  | Builds the API + Web Docker images only (no run). |
| `bash scripts/deploy.sh down`   | Stops and removes the local stack. |
| `bash scripts/deploy.sh logs`   | Tails logs from the running local stack. |
| `bash scripts/deploy.sh help`   | Prints usage. |

## How local config works

The local target needs ~25 environment variables (ports, image tags, datastore
URLs, app secrets). Rather than make you hand-fill an `.env`, the script feeds
Docker Compose a defaults file:

```
.config/docker/compose.defaults.env   ← committed, dev-only defaults
.env (repo root, optional)            ← layered on top; your values win
```

So `make deploy` works on a fresh clone. To override anything (e.g. point at a
real Stripe test key or change a port), copy `.env.example` → `.env` and set the
value there — the script passes both files to Compose and the later one wins.

> ⚠️ `compose.defaults.env` contains **well-known dev placeholder secrets**. It
> is for local development only. Never use it for staging or production — those
> environments inject real secrets from the Render dashboard.

## Deploying to production (Render)

Production normally deploys by pushing a `v*` tag, which runs
`.github/workflows/deploy.yml` (gates → Render deploy → migrate → smoke tests).
To trigger the same Render deploy directly from a laptop:

```bash
export RENDER_API_KEY=rnd_...               # Render dashboard → Account → API Keys
export RENDER_API_SERVICE_ID=srv-...        # styx-api service id
export RENDER_WEB_SERVICE_ID=srv-...        # styx-web service id

bash scripts/deploy.sh render
```

This calls the Render Deploys API for both services. Migrations run via Render's
pre-deploy command; verify the result with `scripts/smoke/check-api-ready.sh`.

## Self-hosting the published images

On every `v*` tag, `.github/workflows/docker-publish.yml` builds and pushes
versioned images to the GitHub Container Registry:

```bash
docker pull ghcr.io/<owner>/styx-api:latest
docker pull ghcr.io/<owner>/styx-web:latest
```

Point your own Compose / Kubernetes manifests at these tags to run Styx on any
Docker host.

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| `docker compose v2 is required` | Install / upgrade Docker Desktop or the `docker-compose-plugin`. |
| API container restarts on boot | A required secret is empty. Check `bash scripts/deploy.sh logs`; set the value in `.env`. |
| Web can't reach the API | The browser-facing API URL is `STYX_DOCKER_API_INTERNAL_URL` (default `http://localhost:3000`). Override in `.env` if you changed the API port. |
| Port already in use | Set `STYX_DOCKER_API_PORT` / `STYX_DOCKER_WEB_PORT` in `.env`. |
