# Audience Growth Engine — Playbooks

This directory holds the **portable, project-agnostic** audience-growth system for ORGAN-III
ventures. It exists because the same engine that grows one venture's audience should be
re-runnable for the next one — without rebuilding the strategy from scratch each time.

## Why this exists

Styx already had its audience strategy written down (the dual-channel architecture and the
Market Attack Plan), but it was fused to Styx's specifics. That made it un-reusable. These
playbooks **abstract the pattern into parameters** so any sibling venture
(`public-record-data-scrapper`, `sovereign-ecosystem--real-estate-luxury`, etc.) can stand
up the same machine by filling in a worksheet.

## Contents

| File | What it is |
|------|------------|
| `playbook--audience-growth-engine.md` | The engine. Five parameters, the ladder, the dual-channel pattern, the 5-level attack, the audience-as-product module, the engagement-economics model. |
| `templates/template--instantiation-worksheet.md` | The blank fill-in form that turns the engine into a live plan for a new venture. |
| `templates/template--content-calendar.md` | N-week calendar grid (channel × week × pillar × CTA). |
| `templates/template--content-asset-pack.md` | Hook bank, post skeletons, story frames, outreach scripts, lead-magnet outline, week-1 publish-ready slots. |
| `templates/template--creator-outreach.md` | Multi-touch borrowed-audience outreach with personalization variables. |
| `templates/template--metrics-tracker.md` | Funnel + audience-asset KPI table, weekly rows. |
| `templates/template--engagement-log.md` | Hourly time + deliverable + outcome log for a paid audience-build engagement. |

## How to use it

1. **New venture?** Copy `templates/template--instantiation-worksheet.md`, fill the five
   parameters, and follow it to produce a planning instance under `docs/planning/`.
2. **Live instance reference:** the Styx/Jessica instantiation lives in `docs/planning/`
   (`planning--audience-growth-engine--styx-instance--2026-06-01.md` and the assets it links).
   Read it as a worked example of every template filled in.

## Relationship to existing docs

- The engine is the **abstraction of** `docs/planning/planning--dual-channel-audience-architecture--2026-03-10.md`
  and `docs/planning/planning--market-attack-plan--2026-03-10.md`. Those remain the canonical
  Styx-specific detail; the engine generalizes their shape.
- It plugs into the governed Growth organism at `docs/departments/gro/REGE.md` (artifacts
  G10/G11). Human checkpoints, content-quality CRIT rules, and messaging guardrails defined
  there still apply to any instance.
