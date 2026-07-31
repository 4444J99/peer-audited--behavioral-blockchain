# Active Handoff — pointer

The active handoff is **`docs/audit/2026-07-31-cross-agent-handoff.md`**.

That is the canonical surface for cross-agent handoffs in this repo (see the
2026-05-27 and 2026-05-28 files beside it). This file exists only because
`CLAUDE.md` instructs agents to read `.conductor/active-handoff.md` first — it is
a breadcrumb, not a second copy. Do not put handoff content here; it will drift
from the dated file and one of the two will be wrong.

- **Handoff to:** Agy
- **From:** Claude, session `8b6f351c`, 2026-07-31
- **State at handoff:** PR #858 merged (`afbf4dd`), 0 open PRs, `main` green.
- **Cross-verification: performed, and it found things.** An adversarial review of
  the handoff confirmed 12 defects in it — eleven stale line citations (captured
  mid-audit, then shifted by #858 itself) and two prescribed remedies that would
  not have worked. All are corrected in the revision; the header explains the
  failure mode. **Grep the symbol, don't trust the line number** — the same drift
  will happen to these citations as soon as anyone edits the files.
- Two review findings were **refuted** on inspection, and are recorded here so
  nobody re-opens them: the handoff *is* on `main` (PR #859 squash-merged; the
  topic branch was deleted, which is what made it look unpushed), and the `162`
  jest baseline is correct (`find` returns 167 because `jest.config.cjs:12`
  excludes 5 `*.int.spec.ts`).
