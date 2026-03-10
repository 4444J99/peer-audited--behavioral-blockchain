# GitHub Project Board Setup (2026-03-09)

This is the recommended cleanup and view design for the live GitHub project:

- Project: `Styx__long+winding-Roadmap_alpha-until-omega`
- Owner: `organvm-iii-ergon`
- Project number: `2`

## Live Apply Status

The following changes have already been applied to the live project on 2026-03-09:

- Added fields: `Lane`, `Work Type`, `Next Action`, `External Party`
- Added field: `Sprint`
- Renamed `Persona` to `Owner Role`
- Updated the project description and readme to match the operating model
- Populated the new fields on the critical partner/blocker issues and the phase epics:
  - `#123`, `#124`, `#125`, `#126`, `#129`, `#132`, `#133`, `#134`, `#136`, `#137`, `#138`, `#139`, `#140`, `#141`, `#146`, `#147`, `#148`
  - `#555`, `#556`, `#557`, `#558`
- Applied sprint assignments to the active Beta/Gamma execution set:
  - `S1 - Beta Core Assault`
  - `S2 - Beta Gate Lock`
  - `S3 - External Beta Prep`
  - `S4 - Gamma Shadow Queue`
  - `Later`

The following changes are still pending because GitHub does not currently expose project-view creation/editing through the public `gh project` CLI or public GraphQL mutations:

- creating the new saved views
- renaming the existing saved views
- applying saved-view filters, grouping, and visible-column settings
- rewriting the built-in `Status` options in-place on the live board

The board feels nonsensical right now because it mixes three different things in one surface:

1. live delivery work
2. founder/partner blockers
3. old audit/session/cache orchestration artifacts

The fix is not "more columns." The fix is a tighter field model and a smaller set of intentional views.

## What Is Wrong Right Now

### Structural problems

- The board contains roadmap work, blocked handoffs, audits, docs programs, session archive items, and cache-cleanup items in one place.
- Phase milestones are carrying too much meaning because they are being used as both launch gate and work bucket.
- The first 200 open issues include **87 with no labels**, which means the board cannot be filtered cleanly by function.
- The project has AI-workflow metadata fields that are not useful for founder or partner operations.

### Fields that are causing noise

These fields should not appear in default operational views:

- `Category` with values `A-Plans`, `B-Sessions`, `C-Cache`, `D-Infra`
- `Source Plan`
- `Token Budget`
- `Phase Energy`
- `Review Persona`
- `Review Stage`

They are historical orchestration metadata, not launch-management controls.

## Field Model

## Keep And Show In Active Views

| Field | Use |
|---|---|
| `Title` | issue name |
| `Status` | actual work state |
| `Priority` | urgency |
| `Milestone` | launch gate or phase |
| `Sprint` | current sprint grouping for active execution |
| `Target Date` | specific commitment date |
| `Department` | business function or product function |
| `Assignees` | named accountable person |
| `Labels` | technical/function tags |
| `Parent issue` | epic linkage |
| `Sub-issues progress` | epic progress |

## Keep But Hide In Most Views

| Field | Why hide |
|---|---|
| `Repository` | useful only if multiple repos feed the project |
| `Linked pull requests` | useful in engineering view only |
| `Reviewers` | useful in engineering review view only |

## Rename Or Replace

### `Status`

Replace the current `Todo / In Progress / Done` options with:

1. `Inbox`
2. `Ready`
3. `In Progress`
4. `Waiting on External`
5. `Blocked`
6. `In Review`
7. `Done`

Reason:

- `Todo` is too coarse.
- partner and legal work needs a clear difference between "not started" and "waiting on someone outside GitHub."
- engineering work needs a visible review state.

### `Persona`

Rename `Persona` to `Owner Role`, then simplify the options to:

1. `AI`
2. `H:LC`
3. `H:BD`
4. `H:RO`
5. `H:FO`
6. `H:MN`
7. `H:CR`

Reason:

- the current values mix AI subagents (`styx-eng`, `styx-finance`, etc.) with human roles.
- the board needs accountability, not orchestration flavor.

## Add These New Fields

### `Lane` (single select)

Options:

1. `Partner`
2. `Engineering`
3. `Shared`
4. `Archive`

Use:

- `Partner`: business/legal/ops work that the partner or founders actively drive
- `Engineering`: code-first work
- `Shared`: mixed work where partner and engineering must coordinate
- `Archive`: old session/audit/cache items that should stay searchable but not clutter active views

### `Work Type` (single select)

Options:

1. `Epic`
2. `Feature`
3. `Blocked Handoff`
4. `Decision`
5. `Bug`
6. `Artifact`
7. `Ops`

Use:

- separate actual deliverables from umbrella issues and decisions
- make `Blocked Handoff` a first-class category instead of relying only on the `blocked` label

### `Sprint` (single select)

Options:

1. `S1 - Beta Core Assault`
2. `S2 - Beta Gate Lock`
3. `S3 - External Beta Prep`
4. `S4 - Gamma Shadow Queue`
5. `Later`

Use:

- create a time-boxed execution frame for the active issue set
- prevent Beta blockers, Gamma prep, and later strategy work from blending together

### `Next Action` (text)

Use:

- one concrete next move, especially for partner and blocked issues

### `External Party` (text)

Use:

- vendor, counsel, Apple, processor, insurer, or partner org tied to the issue

## Label Rules

Every active issue should have:

- one function label:
  - `api`, `mobile`, `desktop`, `devops`, `legal`, `finance`, `marketing`, `b2b`, `support`, `product`, `docs`, `testing`
- one urgency label if relevant:
  - `P0-beta-blocker`, `P1-beta-enhancer`, `P2-post-beta`

Blocked handoffs should also have:

- `blocked`
- exactly one `owner:*` label unless two humans truly co-own it

Use `epic` only on top-level umbrella issues like:

- `#555`
- `#556`
- `#557`
- `#558`

## Milestone Rules

Use phase milestones for delivery work:

- `Phase Beta`
- `Phase Gamma`
- `Phase Delta`
- `Phase Omega`

Use blocked-handoff milestones only for true external blockers:

- `Blocked Handoff - Beta Gate (2026-04-30)`
- `Blocked Handoff - Gamma Gate (2026-06-30)`
- `Blocked Handoff - Delta Gate (2026-09-30)`
- `Blocked Handoff - Omega/Phase2+ (2026-12-31)`

Do not use blocked-handoff milestones for engineering-only delivery issues.

## Recommended Views

Create these views in this order.

## `01 Exec / Partner Command`

- Layout: `Table`
- Purpose: the single operating view for founder + partner
- Filter:
  - `Lane` is `Partner` or `Shared`
  - `Status` is not `Done`
  - `Lane` is not `Archive`
- Sort:
  - `Target Date` ascending
  - `Priority` descending
- Visible fields:
  - `Title`
  - `Status`
  - `Priority`
  - `Milestone`
  - `Target Date`
  - `Owner Role`
  - `Department`
  - `Assignees`
  - `Next Action`
  - `External Party`
  - `Labels`

## `02 Beta Gate`

- Layout: `Board`
- Purpose: current launch gate only
- Filter:
  - `Milestone` is `Phase Beta` or `Blocked Handoff - Beta Gate (2026-04-30)`
  - `Status` is not `Done`
  - `Lane` is not `Archive`
- Group by: `Status`
- Sort within column:
  - `Priority` descending
  - `Target Date` ascending
- Card fields:
  - `Owner Role`
  - `Target Date`
  - `Department`

## `03 Blocked Handoffs`

- Layout: `Board`
- Purpose: all human/external blockers in one place
- Filter:
  - `Work Type` is `Blocked Handoff`
  - `Status` is not `Done`
- Group by: `Owner Role`
- Sort:
  - `Target Date` ascending
- Card fields:
  - `Milestone`
  - `Priority`
  - `Next Action`
  - `External Party`

## `04 Engineering Delivery`

- Layout: `Board`
- Purpose: actual build work, without partner noise
- Filter:
  - `Lane` is `Engineering` or `Shared`
  - `Status` is not `Done`
  - `Work Type` is not `Epic`
  - `Lane` is not `Archive`
- Group by: `Status`
- Sort:
  - `Priority` descending
  - `Target Date` ascending
- Card fields:
  - `Department`
  - `Assignees`
  - `Milestone`
  - `Parent issue`

## `05 Epics / Program Map`

- Layout: `Table`
- Purpose: top-level roadmap tracking
- Filter:
  - `Work Type` is `Epic`
- Sort:
  - `Milestone` ascending
- Visible fields:
  - `Title`
  - `Status`
  - `Milestone`
  - `Sub-issues progress`
  - `Priority`
  - `Assignees`

## `06 Later Pipeline`

- Layout: `Table`
- Purpose: keep later BD/legal strategy visible without polluting Beta operations
- Filter:
  - `Milestone` is `Phase Omega` or `Blocked Handoff - Omega/Phase2+ (2026-12-31)`
  - `Status` is not `Done`
  - `Lane` is `Partner` or `Shared`
- Sort:
  - `Priority` descending
  - `Target Date` ascending
- Visible fields:
  - `Title`
  - `Status`
  - `Owner Role`
  - `Department`
  - `Next Action`
  - `External Party`

## `07 Metadata Cleanup`

- Layout: `Table`
- Purpose: issue hygiene
- Filter:
  - missing `Department` or missing `Priority` or missing `Lane` or missing `Work Type`
- Sort:
  - `Milestone` ascending
  - `Title` ascending

Use this only as an admin cleanup view, not a working board.

## `08 Archive / Legacy Intake`

- Layout: `Table`
- Purpose: keep audit/session/cache items accessible but hidden from day-to-day delivery
- Filter:
  - `Lane` is `Archive`

This is where the current `A-Plans`, `B-Sessions`, `C-Cache`, and similar legacy items belong.

## Fastest Manual Mapping Using The Existing Views

If you want the fastest possible cleanup in the browser, repurpose the six existing views first:

| Current view | Recommended rename | Notes |
|---|---|---|
| `kitchen-sink` | `01 Exec / Partner Command` | keep as table; narrow visible columns to founder/partner fields |
| `sprint_board` | `02 Beta Gate` | keep as board; filter to Beta-only items |
| `backlog` | `04 Engineering Delivery` | use as the default engineering queue |
| `by_epic` | `05 Epics / Program Map` | keep as table; focus on epics and parent/sub-issue progress |
| `needs_triage` | `07 Metadata Cleanup` | use for missing metadata and unlabeled items |
| `roadmap` | `06 Later Pipeline` | use as long-range date view for later-phase work |

Then add two new views manually if you want the full model:

- `03 Blocked Handoffs`
- `08 Archive / Legacy Intake`

## Cleanup Order

Do the cleanup in this order:

1. Rename `Persona` to `Owner Role`.
2. Update `Status` options.
3. Add `Lane`, `Work Type`, `Next Action`, and `External Party`.
4. Bulk-set `Lane=Archive` on old audit/session/cache/program-infrastructure items.
5. Bulk-set `Work Type=Epic` on the four phase epics.
6. Bulk-set `Work Type=Blocked Handoff` on the blocked external issues.
7. Fill `Owner Role`, `Department`, `Priority`, and `Target Date` on all Beta blockers first.
8. Create the eight views above.
9. Make `01 Exec / Partner Command` the default view for business use.

## Minimum Viable Board Standard

An issue is not allowed to sit in an active view unless it has:

- `Status`
- `Lane`
- `Work Type`
- `Priority`
- `Milestone`
- `Department`
- `Target Date`

For blocked handoffs, it must also have:

- `Owner Role`
- `Next Action`
- `External Party`

## Recommendation

Do not try to perfect the whole board at once. Normalize only the Beta blockers and the founder/partner lane first. Once that view is clean, the rest of the roadmap can be regularized without breaking operating visibility.
