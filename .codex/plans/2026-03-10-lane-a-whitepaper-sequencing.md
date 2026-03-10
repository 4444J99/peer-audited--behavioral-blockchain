## Lane A Whitepaper Sequencing

Date: 2026-03-10

### Intent

Capture the required sequential order for the whitepaper-overhaul sprint:

1. `#563` `Add adverse authority analysis section to whitepaper`
2. `#562` `Expand case law coverage to 15-25 cases in whitepaper and supporting docs`

### Why This Order

- `#563` inserts a new `Adverse Authority and Counterarguments` section into the whitepaper.
- That changes section numbering and Table of Authorities structure.
- `#562` expands the Table of Authorities and threads citations across the whitepaper and related legal docs.
- If `#562` runs first, `#563` forces a second renumbering and citation cleanup pass over the same material.

### GitHub Changes Applied

- added `follow-up` to `#562` and `#563`
- added `owner:legal-compliance` to `#562` and `#563`
- moved both `#562` and `#563` into milestone `Phase Beta`
- added sequencing comments on both issues documenting `#563 -> #562`

### Board State

- attempted to add both issues to org project `#2`
- GitHub GraphQL rate limit was hit during the board-metadata step
- sequence metadata still intended for board pass:
  - `#563`: `P0-blocker`, `LEG`, `H:LC`, `Partner`, `Artifact`, target `2026-03-11`
  - `#562`: `P1-high`, `LEG`, `H:LC`, `Partner`, `Artifact`, target `2026-03-12`

### Next Follow-Up

After GraphQL rate limit reset, verify project placement and apply the missing board fields for both issues.
