# Intent

Continue only issue #990 and PR #991 from their durable owner receipts.

At every entry, re-derive the live PR, issue, triage, review, and exact-head
state. If a reviewer requests a correction, apply only the implicated shard in
an isolated branch and rerun its predicate. If no correction exists, the open
PR remains the terminal owner and the session stops without polling.

Preserve these boundaries:

- no merge, deployment, workflow dispatch, credential action, or public send;
- no closure of parent tracker #369;
- no founder product, brand, pilot, naming, or content selection;
- no cleanup or staging from the shared dirty `main` checkout;
- no work on unrelated repository backlog.

The objective is truthful custody and review response, not motion for its own
sake.
