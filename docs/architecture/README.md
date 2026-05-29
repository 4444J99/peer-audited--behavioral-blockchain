# Architecture & Technical Specs

Technical-feasibility analyses, specs, and operational docs for Styx. For the *decisions* behind this architecture — and the reasoning — see the [Architecture Decision Records](../adr/) (`docs/adr/`).

| Document | Purpose |
|----------|---------|
| [Technical Architecture & Feasibility](architecture--technical-feasibility.md) | Core technical architecture & feasibility (referenced by ADR-001/002) |
| [Aegis / Tier Reconciliation](architecture--aegis-tier-reconciliation.md) | Aegis protocol & tier-system reconciliation |
| [Alpha-to-Omega Plan](architecture--alpha-to-omega-plan.md) | Alpha→Omega roadmap (v3) |
| [Spec: The Fury Router](spec--fury-router.md) | Fury Router spec — decision recorded in [ADR-004](../adr/adr--004-fury-consensus-engine.md) |
| [Spec: Digital Exhaust Intake](spec--digital-exhaust-intake.md) | Digital-exhaust intake spec |
| [Branching & Release Strategy](branching-and-release-strategy.md) | Branching / merge / release |
| [Test Strategy](test-strategy.md) | Testing tiers, validation gates, CI |
| [Load Test Report](load-test-report.md) | Load-test results |

### Archived research inputs (AI-generated — not as-built)

Early AI-generated feasibility studies, retained as historical research inputs. They are **not** the as-built architecture — for that, see the [ADRs](../adr/) and [Technical Architecture & Feasibility](architecture--technical-feasibility.md) above. Each now carries provenance frontmatter + an in-file banner. (Tracked: [#591](https://github.com/a-organvm/peer-audited--behavioral-blockchain/issues/591).)

| Document | Source | Note |
|----------|--------|------|
| [Truth-Blockchain Feasibility](architecture--truth-blockchain.md) | Gemini (inferred) · 2026-02-22 | Superseded by v2 (near-identical content) |
| [Truth-Blockchain Feasibility v2](architecture--truth-blockchain-v2.md) | Gemini (inferred) · 2026-03-04 | Fuller rendering of the above |
| [Feasibility Stack (Pillar 5)](architecture--feasibility-stack.md) | Perplexity Pro · 2026-02-22 | Same question, third take |

Decision records: [`docs/adr/`](../adr/) · Network map: [`network-map.yaml`](network-map.yaml).
