# `scripts/infra/` — Surface Index

Infrastructure config & lifecycle for storage, edge security, and analytics export.
**User/buyer:** ops / infra engineer. Note `cloudflare-r2-lifecycle.sh` is a **mock**
(emits the rule JSON, does not apply it) and `cloudflare-waf-rules.json` is **data**, not a
script. Template: [`../SURFACE-PACKET.template.md`](../SURFACE-PACKET.template.md).

| Name | Problem solved | Run | Verify | Safety | Level |
|------|----------------|-----|--------|--------|-------|
| `cloudflare-r2-lifecycle.sh` | Define a 30-day delete lifecycle for biometric proof video on R2 (compliance) | `bash scripts/infra/cloudflare-r2-lifecycle.sh` | Writes `lifecycle_rule.json` for bucket `styx-fury-proofs` | **Mock** — generates rule only; does not call Cloudflare. Wire to real API before relying on it | L0 |
| `cloudflare-waf-rules.json` | Geo-block traffic from sanctioned/ambiguous jurisdictions | apply via Cloudflare WAF (config artifact, not executed) | Listed countries are blocked at the edge once applied | Edge-block config; review jurisdiction list before applying | L1 |
| `pg-data-lake-extract.sh` | Nightly sanitized Postgres dump for B2B analytics | `POSTGRES_HOST=… POSTGRES_USER=… POSTGRES_DB=… STYX_DATA_LAKE_EXPORT_DIR=… bash scripts/infra/pg-data-lake-extract.sh` | Timestamped sanitized export written to `STYX_DATA_LAKE_EXPORT_DIR` | **Reads production data** — must stay sanitized; guard the export dir; needs DB creds | L1 |

> **Disable/uninstall:** the `.sh` scripts are stateless (stop scheduling them); remove the
> WAF JSON from Cloudflare to lift geo-blocks. **Proof:** `.sh` use `set -euo pipefail` and
> `:?`-guard required env vars. The R2 script is explicitly mock until wired to the real API.
