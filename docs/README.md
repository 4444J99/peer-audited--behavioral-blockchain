# Styx Documentation Index

**Product:** Styx — The Blockchain of Truth
**Status:** PUBLIC_PROCESS (hardening phase)
**Updated:** 2026-03-08

---

## Documentation Architecture

Styx documentation is split into two layers:

### Project Corpus (static docs)

Research, architecture, planning, legal analysis, and other foundational documents that exist as traditional files. These live in their original directories:

| Directory | Contents |
|-----------|----------|
| `research/` | Market analysis, competitor teardowns, academic research |
| `thesis/` | Core thesis documents |
| `brainstorm/` | Ideation and exploration |
| `architecture/` | 6 architecture docs, 2 specs, 5 ADRs, 1 API spec |
| `planning/` | 27 planning docs (roadmaps, status reports, calendars, governance) |
| `legal/` | 6 foundational legal docs (guardrails, founder agreement, wagering analysis) |
| `adr/` | Architecture Decision Records |
| `api/` | API specifications |
| `checklists/` | Phase gates (X1) |
| `pitch/` | Pitch deck content (X5) |

### Department Organisms (RE:GE — living docs)

27 department artifacts organized as **Recursive Engine: Generative Entities** — autonomous organisms that generate, critique, heal, and wire to each other. See [`departments/README.md`](departments/README.md) for the full index.

| Dept | Code | Artifacts | Organism |
|------|------|-----------|----------|
| Engineering | `eng` | E4, E5 | [REGE.md](departments/eng/REGE.md) |
| Product | `prd` | P1-P4 | [REGE.md](departments/prd/REGE.md) |
| Legal | `leg` | L2, L3, L5, L7 | [REGE.md](departments/leg/REGE.md) |
| Finance | `fin` | F1-F3, F5, F6 | [REGE.md](departments/fin/REGE.md) |
| Operations | `ops` | O1-O4 | [REGE.md](departments/ops/REGE.md) |
| Growth & Marketing | `gro` | G1-G3 | [REGE.md](departments/gro/REGE.md) |
| Customer Success | `cxs` | C1, C2 | [REGE.md](departments/cxs/REGE.md) |
| Enterprise Sales | `b2b` | B1-B3 | [REGE.md](departments/b2b/REGE.md) |

**System heartbeat:** [departments/PULSE.md](departments/PULSE.md) — cadence matrix, signal routing, staleness dashboard

## Deferred Artifacts (graduation phase)

14 artifacts deferred until GRADUATED: L4, P5, F4, O5, O6, G4-G6, C3-C5, B4-B6. See [`departments/README.md`](departments/README.md) for the full list.

## Generation Metadata

- **RE:GE schema:** [`ergon-prime--business-orchestrator/packages/schema/rege.schema.json`](https://github.com/labores-profani-crux/ergon-prime--business-orchestrator/tree/main/packages/schema/rege.schema.json)
- **Template source:** `praxis-perpetua/templates/dept/` (SLP library)
- **Round 1 (2026-03-08):** 29 department artifacts generated across 8 departments
- **Round 2 (2026-03-08):** RE:GE organism architecture — 8 REGE.md files, PULSE.md, system wiring
- **Full manifest:** [MANIFEST.md](MANIFEST.md)
