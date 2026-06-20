# `scripts/analysis/` — Surface Index

Repo-content analysis utilities. **User/buyer:** maintainer mining the docs corpus for
intelligence/structure. Template: [`../SURFACE-PACKET.template.md`](../SURFACE-PACKET.template.md).

| Name | Problem solved | Run | Verify | Safety | Level |
|------|----------------|-----|--------|--------|-------|
| `ingest-doc-intelligence.js` | Ingest the docs corpus into a dated intelligence artifact | `npm run docs:ingest` | Reads `docs/{research,planning,legal,brainstorm}`; writes a dated set under `artifacts/doc-intelligence/` | Read-only over `docs/`; writes one artifact dir; no network | L1 |

> **Disable/uninstall:** stateless generator — stop invoking; delete the `artifacts/doc-intelligence/`
> output to clean up. **Proof:** resolves `REPO_ROOT` from its own path; targets four fixed
> doc dirs. Capture a `docs:ingest` run log on next use.
