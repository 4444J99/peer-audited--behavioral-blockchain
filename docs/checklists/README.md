# Readiness Checklists

Phase gate checklists that must pass before Styx advances to the next stage. Each checklist is a standalone document with clear pass/fail criteria.

## What Lives Here

- **TestFlight Beta readiness** (`testflight-beta-readiness.md`) — Can we ship to external
  testers? (Advertised here since May 2026 but only created 2026-08-15; the executable half
  of this gate lives in `docs/planning/planning--beta-readiness-contract.md` and runs as
  `npm run beta:readiness`.)
- **Real-money pilot readiness** (`real-money-pilot-readiness.md`, July 2026) — Can we process real dollars safely?
- **App Store launch readiness** (`app-store-launch-readiness.md`, October 2026) — Can we pass Apple's review and serve the public?
- **Enterprise sales readiness** (`enterprise-sales-readiness.md`, November 2026) — Can we sell to businesses?
- **PUBLIC_PROCESS → GRADUATED phase gate** (`phase-gate-public-process.md`) — the ORGANVM
  promotion worksheet (92 items, human approver required).

## Who Uses This

- **Both co-founders**: These are your go/no-go decision gates. Before each major launch milestone, walk through the checklist together. Every item must be checked off before proceeding.

## How It Works

Each checklist item has:
1. **What it is** — Plain English description
2. **How to verify** — Specific steps to confirm it's done
3. **Who owns it** — Which person or team is responsible
4. **Why it matters** — What goes wrong if we skip it

If any item fails, we don't advance. This protects us from shipping before we're ready.
