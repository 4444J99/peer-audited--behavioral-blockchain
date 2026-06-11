# Activation Ledger — peer-audited--behavioral-blockchain

> Source of truth for activation status, evidence, and next-mile blockers.
> Mirrors `~/Workspace/session-meta/escape-velocity/activation-ledger-2026-06-10.csv`
> row 6 (`a-organvm/peer-audited--behavioral-blockchain, 676`).

## Status

| Field | Value |
|---|---|
| **Status** | `ship-now` (pitch deck on GitHub Pages) / `ship-soon` (interactive launch surface + live API health) |
| **Activated on** | 2026-06-10 (Evidence: `peer_audited_activation_2026-06-10.csv`) |
| **GitHub issue** | https://github.com/a-organvm/peer-audited--behavioral-blockchain/issues/676 |
| **Canonical URL** | https://a-organvm.github.io/peer-audited--behavioral-blockchain/ |
| **Artifact served** | `@styx/pitch` build output → `docs/index.html` (interactive Vite + p5.js pitch deck) |
| **Owning team** | ORGAN-III (Commerce) — Styx |
| **Package scope** | `@styx/*` |
| **Pages source** | `main` branch, `/docs` folder (per repo Pages config) |

## What is shipped (evidence: 2026-06-10T23:04:07Z)

| Endpoint | HTTP | Verdict |
|---|---|---|
| `https://a-organvm.github.io/peer-audited--behavioral-blockchain/` | **200** | `ship-now` — the pitch deck (`@styx/pitch` → `docs/index.html`) is reachable. Title: "STYX — The Blockchain of Truth". |
| `https://a-organvm.github.io/peer-audited--behavioral-blockchain/launch` | 404 | **gap to `ship-soon`** — interactive launch surface (waitlist / sign-up) not yet built into the web app |
| `https://a-organvm.github.io/peer-audited--behavioral-blockchain/ask-styx` | 404 | **gap** — `src/ask-styx` exists but its Pages deploy is a separate workflow (`.github/workflows/deploy-ask-styx.yml`) and is not the source of the canonical URL |
| `https://<api-render-host>/health` | unknown | **gap to `ship-soon`** — API health check is `/health` (per `render.yaml` `healthCheckPath` and `src/api/src/modules/health/health.controller.ts` `@Controller('health')`); Render deploy pending |
| `https://<api-render-host>/api/docs` | unknown | **gap** — Swagger UI exists in non-production only (`src/api/src/main.ts:96`); production deploy will need a docs-route decision |

Evidence file:
- `~/Workspace/session-meta/escape-velocity/activation-evidence/peer_audited_activation_2026-06-10.csv`
- `~/Workspace/session-meta/escape-velocity/activation-evidence/peer_audited_activation_2026-06-10_root.html`
- Live re-verify (2026-06-11): root serves `<title>STYX — The Blockchain of Truth</title>`, 520 bytes, HTTP 200

## Activation command

The single canonical activation probe (re-runnable by any user):

```bash
curl -sS -o /dev/null -w "%{http_code} %{url_effective}\n" \
  -L https://a-organvm.github.io/peer-audited--behavioral-blockchain/
```

**Expected output:** `200 https://a-organvm.github.io/peer-audited--behavioral-blockchain/`

To verify the gap to `ship-soon` (will be 404 until those routes are deployed):

```bash
for path in / /launch /ask-styx; do
  printf "%s -> " "$path"
  curl -sS -o /dev/null -w "%{http_code}\n" \
    "https://a-organvm.github.io/peer-audited--behavioral-blockchain${path}"
done
```

**Expected output today (2026-06-11):**

```
/ -> 200
/launch -> 404
/ask-styx -> 404
```

Once the API is deployed to Render, verify API health with:

```bash
curl -sS -o /dev/null -w "%{http_code}\n" \
  "${STYX_API_PUBLIC_URL:-https://api-styx.onrender.com}/health"
```

**Expected output post-deploy:** `200` (returns Render health-check JSON; 503 from Render is a deploy failure).

## Why is this not fully `ship-soon`?

| Blocker | Root cause | Resolution path |
|---|---|---|
| `/launch` 404 | The launch surface (interactive sign-up / waitlist) is not yet built into the `src/web` Next.js app or not yet routed through the GitHub Pages base | Open a tracked issue in Phase Gamma milestone; port the waitlist flow from `src/web`; re-test |
| API not publicly deployed | The API (NestJS at `src/api`) is not yet deployed to Render — current `render.yaml` blueprint is the deploy target, and the env-backed config hardening (PR #669) is the prerequisite for stable deploys | Issue #675 CLOSED (2026-06-11) — release workflow (`.github/workflows/release.yml`), deploy docs in README, Render secrets checklist documented. Next: set Render secrets in GitHub → cut `v*` tag → `deploy.yml` triggers |
| `/ask-styx` not on canonical URL | `src/ask-styx` exists and is built (title "Ask Styx"), but its Pages deploy is a separate workflow (`.github/workflows/deploy-ask-styx.yml`) that uploads to a Pages sub-path. It is *not* the source of the canonical URL. The canonical URL serves the pitch deck. | Document the routing: canonical URL = pitch deck; `/ask-styx` sub-path = LLM Q&A app. Both are intentional surfaces. |
| Activation evidence regen is manual | `scripts/build-chat-context.ts` re-emits the embedded `styx-knowledge.ts` from `CLAUDE.md`; CLAUDE.md is not in repo, so the knowledge file regenerates from a synthetic empty state | Decide whether to (a) add a CLAUDE.md or (b) replace the build-time synthesis with a checked-in artifact |

## Decision

**`ship-now` on the pitch deck surface, with explicit `ship-soon` gap documented above.** No further action required to keep the static surface live; the gap to `ship-soon` is owned by Issues tracked in Phase Beta (deploy) and Phase Gamma (launch surface).

## Cross-system reconciliation

- `~/Workspace/session-meta/escape-velocity/activation-ledger-2026-06-10.csv` row 6 says `ship-now` — **matches this ledger**.
- If the cross-system ledger is updated, this file must be updated in the same commit to preserve the invariant.

## Triage tracking

This issue (#676) is tracked in `docs/triage.json` via batch `triage-activation-676` with state `INSPECTED → BUILD_DONE → TESTED → PR_CREATED → PR_MERGED → CLOSED` (full path will be applied when PR #677 merges).
