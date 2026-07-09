# Architecture & Technical Specs

Technical-feasibility analyses and operational docs for Styx. Module **specs** now live in [`docs/specs/`](../specs/); the *decisions* behind this architecture are in the [Architecture Decision Records](../adr/) (`docs/adr/`).

| Document | Purpose |
|----------|---------|
| [Technical Architecture & Feasibility](architecture--technical-feasibility.md) | Core technical architecture & feasibility (referenced by ADR-001/002) |
| [Aegis / Tier Reconciliation](architecture--aegis-tier-reconciliation.md) | Aegis protocol & tier-system reconciliation |
| [Branching & Release Strategy](branching-and-release-strategy.md) | Branching / merge / release |
| [Test Strategy](test-strategy.md) | Testing tiers, validation gates, CI |
| [Load Test Report](load-test-report.md) | Load-test results |

### Archived research inputs (AI-generated — not as-built)

Early AI-generated feasibility studies, retained as historical research inputs. They are **not** the as-built architecture — for that, see the [ADRs](../adr/) and [Technical Architecture & Feasibility](architecture--technical-feasibility.md) above. Each now carries provenance frontmatter + an in-file banner. (Tracked: [#591](https://github.com/a-organvm/peer-audited--behavioral-blockchain/issues/591).)

| Document | Source | Note |
|----------|--------|------|
| [Truth-Blockchain Feasibility v2](architecture--truth-blockchain-v2.md) | Gemini (inferred) · 2026-03-04 | Surviving, fuller of two near-identical drafts; the v1 draft was deduped away as content-equivalent |
| [Feasibility Stack (Pillar 5)](architecture--feasibility-stack.md) | Perplexity Pro · 2026-02-22 | Same question, a second LLM's take |

**Relocated / superseded** ([#594](https://github.com/a-organvm/peer-audited--behavioral-blockchain/issues/594)): module specs moved to [`docs/specs/`](../specs/); the [Alpha-to-Omega Plan (v3.0 draft)](architecture--alpha-to-omega-plan.md) is superseded by the canonical [Definitive Alpha→Omega Roadmap](../planning/planning--roadmap--alpha-to-omega--definitive--2026-03-04.md).

Decision records: [`docs/adr/`](../adr/) · Network map: [`network-map.yaml`](network-map.yaml).
