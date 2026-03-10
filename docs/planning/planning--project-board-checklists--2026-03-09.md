# Project Board Checklists (2026-03-09)

Use this file for the remaining browser-only project-board work on:

- `organvm-iii-ergon` project `#2`
- `Styx__long+winding-Roadmap_alpha-until-omega`

This is the short execution companion to:

- [planning--project-board-setup--2026-03-09.md](planning--project-board-setup--2026-03-09.md)

## How The GitHub UI Actually Maps

There are no shell commands to type here.

- Use the `Filter` box to paste filter text.
- Use the `View` menu for `Group by`, `Sort`, and `Slice by`.
- Use the view-options button next to the view name to change the layout to `Table`, `Board`, or `Roadmap`.

If a field has spaces in its name, do not guess the syntax. Start typing the field name in the filter box and let GitHub autocomplete it.

## 0. Preflight Checklist

- [ ] Open the project in your normal signed-in browser.
- [ ] Confirm the project readme shows the new field model.
- [ ] Confirm the new fields exist: `Lane`, `Work Type`, `Next Action`, `External Party`, `Owner Role`.
- [ ] Confirm the `Sprint` field exists.
- [ ] Confirm key items now show populated values:
  - [ ] `#132`
  - [ ] `#133`
  - [ ] `#136`
  - [ ] `#141`
  - [ ] `#146`
  - [ ] `#555` through `#558`

## 1. Rename Existing Views

- [ ] Rename `kitchen-sink` to `01 Exec / Partner Command`
- [ ] Rename `sprint_board` to `02 Beta Gate`
- [ ] Rename `backlog` to `04 Engineering Delivery`
- [ ] Rename `by_epic` to `05 Epics / Program Map`
- [ ] Rename `needs_triage` to `07 Metadata Cleanup`
- [ ] Rename `roadmap` to `06 Later Pipeline`

## 2. Configure `01 Exec / Partner Command`

Target:

- layout: `Table`
- purpose: founder + partner command view

Checklist:

- [ ] Set layout to `Table`
- [ ] Paste this into the `Filter` box:
  - [ ] `lane:Partner,Shared -status:Done -lane:Archive`
- [ ] Filter to `Lane` is `Partner` or `Shared`
- [ ] Filter to `Status` is not `Done`
- [ ] Filter to `Lane` is not `Archive`
- [ ] Sort by `Target Date` ascending
- [ ] Secondary sort by `Priority` descending
- [ ] Show these columns only:
  - [ ] `Title`
  - [ ] `Status`
  - [ ] `Priority`
  - [ ] `Milestone`
  - [ ] `Target Date`
  - [ ] `Owner Role`
  - [ ] `Department`
  - [ ] `Assignees`
  - [ ] `Next Action`
  - [ ] `External Party`
  - [ ] `Labels`
- [ ] Hide these columns:
  - [ ] `Category`
  - [ ] `Source Plan`
  - [ ] `Token Budget`
  - [ ] `Phase Energy`
  - [ ] `Reviewers`
  - [ ] `Review Persona`
  - [ ] `Review Stage`

## 3. Configure `02 Beta Gate`

Target:

- layout: `Board`
- purpose: current launch gate only

Checklist:

- [ ] Set layout to `Board`
- [ ] Paste this into the `Filter` box:
  - [ ] `milestone:"Phase Beta","Blocked Handoff - Beta Gate (2026-04-30)" -status:Done -lane:Archive`
- [ ] Filter to `Milestone` is `Phase Beta`
- [ ] Add OR filter for `Blocked Handoff - Beta Gate (2026-04-30)`
- [ ] Filter to `Status` is not `Done`
- [ ] Filter to `Lane` is not `Archive`
- [ ] Group by `Status`
- [ ] Sort cards by `Priority` descending
- [ ] Secondary sort by `Target Date` ascending
- [ ] Show card fields:
  - [ ] `Owner Role`
  - [ ] `Target Date`
  - [ ] `Department`
- [ ] Sanity-check these items appear:
  - [ ] `#132`
  - [ ] `#133`
  - [ ] `#136`
  - [ ] `#141`
  - [ ] `#146`
  - [ ] `#555`

## 4. Configure `04 Engineering Delivery`

Target:

- layout: `Board`
- purpose: build work without partner clutter

Checklist:

- [ ] Set layout to `Board`
- [ ] Paste this into the `Filter` box:
  - [ ] `lane:Engineering,Shared -status:Done -lane:Archive -label:epic`
- [ ] Filter to `Lane` is `Engineering` or `Shared`
- [ ] Filter to `Status` is not `Done`
- [ ] Filter to `Work Type` is not `Epic`
- [ ] Filter to `Lane` is not `Archive`
- [ ] Group by `Status`
- [ ] Sort cards by `Priority` descending
- [ ] Secondary sort by `Target Date` ascending
- [ ] Show card fields:
  - [ ] `Department`
  - [ ] `Assignees`
  - [ ] `Milestone`
  - [ ] `Parent issue`

## 5. Configure `05 Epics / Program Map`

Target:

- layout: `Table`
- purpose: phase/epic tracking only

Checklist:

- [ ] Set layout to `Table`
- [ ] Paste this into the `Filter` box:
  - [ ] `label:epic`
- [ ] Filter to `Work Type` is `Epic`
- [ ] Sort by `Milestone` ascending
- [ ] Show these columns:
  - [ ] `Title`
  - [ ] `Status`
  - [ ] `Milestone`
  - [ ] `Sub-issues progress`
  - [ ] `Priority`
  - [ ] `Assignees`
- [ ] Confirm only the four phase epics are present:
  - [ ] `#555`
  - [ ] `#556`
  - [ ] `#557`
  - [ ] `#558`

## 6. Configure `06 Later Pipeline`

Target:

- layout: `Roadmap` if you want dates visually, otherwise `Table`
- purpose: later BD/legal strategy without Beta noise

Checklist:

- [ ] Keep `Roadmap` layout or switch to `Table` if you prefer simpler filtering
- [ ] Paste this into the `Filter` box:
  - [ ] `milestone:"Phase Omega","Blocked Handoff - Omega/Phase2+ (2026-12-31)" lane:Partner,Shared -status:Done`
- [ ] Filter to `Milestone` is `Phase Omega`
- [ ] Add OR filter for `Blocked Handoff - Omega/Phase2+ (2026-12-31)`
- [ ] Filter to `Lane` is `Partner` or `Shared`
- [ ] Filter to `Status` is not `Done`
- [ ] Show or pin:
  - [ ] `Title`
  - [ ] `Status`
  - [ ] `Owner Role`
  - [ ] `Department`
  - [ ] `Next Action`
  - [ ] `External Party`

## 7. Configure `07 Metadata Cleanup`

Target:

- layout: `Table`
- purpose: admin cleanup only

Checklist:

- [ ] Set layout to `Table`
- [ ] In the `Filter` box, build this gradually with autocomplete:
  - [ ] `no:department`
  - [ ] then add `no:priority`
  - [ ] then add `no:lane`
  - [ ] for `Work Type`, start typing `work` and pick the `Work Type` field from autocomplete, then select `is empty` / `no value` if GitHub offers it
- [ ] Filter to items missing one or more of:
  - [ ] `Department`
  - [ ] `Priority`
  - [ ] `Lane`
  - [ ] `Work Type`
- [ ] Sort by `Milestone` ascending
- [ ] Secondary sort by `Title` ascending
- [ ] Save this as a maintenance-only view, not a daily work view

## 8. Optional: Create `03 Blocked Handoffs`

Checklist:

- [ ] Create a new view named `03 Blocked Handoffs`
- [ ] Set layout to `Board`
- [ ] Paste this into the `Filter` box:
  - [ ] `label:blocked -status:Done`
- [ ] Filter to `Work Type` is `Blocked Handoff`
- [ ] Filter to `Status` is not `Done`
- [ ] Group by `Owner Role`
- [ ] Sort cards by `Target Date` ascending
- [ ] Show card fields:
  - [ ] `Milestone`
  - [ ] `Priority`
  - [ ] `Next Action`
  - [ ] `External Party`

## 9. Optional: Create `08 Archive / Legacy Intake`

Checklist:

- [ ] Create a new view named `08 Archive / Legacy Intake`
- [ ] Set layout to `Table`
- [ ] Paste this into the `Filter` box:
  - [ ] `lane:Archive`
- [ ] Filter to `Lane` is `Archive`
- [ ] Keep it out of normal operating rotation

## 10. Active Item Standard

For any item still visible in an active view, verify:

- [ ] `Status` is set
- [ ] `Priority` is set
- [ ] `Milestone` is set
- [ ] `Department` is set
- [ ] `Lane` is set
- [ ] `Work Type` is set
- [ ] `Target Date` is set
- [ ] `Sprint` is set if the item is in the active execution stack

For blocked handoffs, also verify:

- [ ] `Owner Role` is set
- [ ] `Next Action` is set
- [ ] `External Party` is set

## 11. First Weekly Hygiene Pass

- [ ] Open `07 Metadata Cleanup`
- [ ] Fix the highest-priority Beta items first
- [ ] Remove or archive obvious legacy noise from active views
- [ ] Check that `01 Exec / Partner Command` is readable in one screen without horizontal sprawl
- [ ] Check that `02 Beta Gate` shows only current Beta work
- [ ] Check that the partner blockers are not buried under engineering tasks

## 12. Definition Of Done For The Board

The board is “good enough” when:

- [ ] founder can open one view and immediately see the partner-owned blockers
- [ ] Beta blockers are isolated from long-range ideas
- [ ] epics are visible without drowning daily delivery work
- [ ] blocked handoffs have explicit next actions and external parties
- [ ] metadata cleanup becomes a weekly maintenance task, not a constant confusion source
