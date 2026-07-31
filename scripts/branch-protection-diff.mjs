#!/usr/bin/env node
/**
 * Compare live GitHub branch protection against `.github/rulesets/main.json`.
 *
 * Driven by `scripts/branch-protection.sh check`, which supplies the live
 * ruleset on stdin and signals classic-protection presence via CLASSIC=1.
 *
 * Exits 0 when they match, 1 on drift (with a per-field report).
 */
import fs from "node:fs";

const specPath = process.argv[2];
if (!specPath) {
  console.error(
    "usage: branch-protection-diff.mjs <spec.json>  (live ruleset JSON on stdin)",
  );
  process.exit(2);
}

const spec = JSON.parse(fs.readFileSync(specPath, "utf8"));
const live = JSON.parse(fs.readFileSync(0, "utf8"));
const drift = [];

// A token without repo-admin rights can still GET a ruleset, but receives a
// *redacted* view: the rules come back while admin-only fields are omitted
// entirely. Diffing that against the file reports drift on every withheld
// field — a false alarm that would train everyone to ignore this check.
//
// `bypass_actors` is the reliable discriminator: an admin read always includes
// it, as `[]` when there are none. `undefined` means redacted, not empty.
if (live.bypass_actors === undefined) {
  console.error(
    [
      "SKIP: the ruleset came back redacted — this token lacks repo-admin rights.",
      "      Rules were returned but admin-only fields (bypass_actors) were withheld,",
      "      so drift cannot be determined without reporting false positives.",
      "      In CI, set BRANCH_PROTECTION_TOKEN to a fine-grained PAT with",
      "      'Administration: read'. Locally, authenticate as the repo owner.",
    ].join("\n"),
  );
  process.exit(3);
}

/**
 * Order-insensitive canonical form. The API echoes object keys in its own
 * order, and none of the arrays in a ruleset are order-significant
 * (`bypass_actors`, `required_status_checks`, `allowed_merge_methods`,
 * `include`/`exclude`), so both are normalized before comparison. Without this
 * the check reports drift every run and gets ignored — the failure mode a
 * drift check exists to prevent.
 */
const canon = (v) => {
  if (Array.isArray(v)) {
    return v
      .map(canon)
      .sort((a, b) => (JSON.stringify(a) < JSON.stringify(b) ? -1 : 1));
  }
  if (v && typeof v === "object") {
    return Object.fromEntries(
      Object.keys(v)
        .sort()
        .map((k) => [k, canon(v[k])]),
    );
  }
  return v;
};

const show = (v) => JSON.stringify(canon(v));
const cmp = (path, want, got) => {
  if (show(want) !== show(got)) {
    drift.push(`${path}\n    file: ${show(want)}\n    live: ${show(got)}`);
  }
};

for (const key of [
  "name",
  "target",
  "enforcement",
  "conditions",
  "bypass_actors",
]) {
  if (key in spec) cmp(key, spec[key], live[key]);
}

const liveByType = new Map((live.rules ?? []).map((r) => [r.type, r]));
for (const want of spec.rules ?? []) {
  const got = liveByType.get(want.type);
  if (!got) {
    drift.push(`rules[${want.type}]\n    file: present\n    live: MISSING`);
    continue;
  }
  liveByType.delete(want.type);
  // Compare only the parameters the file declares. GitHub echoes back extra
  // defaults (e.g. required_reviewers: []) that are not policy decisions.
  for (const [k, v] of Object.entries(want.parameters ?? {})) {
    cmp(`rules[${want.type}].${k}`, v, (got.parameters ?? {})[k]);
  }
}
for (const type of liveByType.keys()) {
  drift.push(
    `rules[${type}]\n    file: absent\n    live: PRESENT (not declared in the file)`,
  );
}

if (process.env.CLASSIC === "1") {
  drift.push(
    [
      "classic branch protection on 'main'",
      "    file: rulesets only (single source of truth)",
      "    live: PRESENT - GitHub enforces the union of classic protection and",
      "          rulesets, so this silently overrides the file. Remove it.",
    ].join("\n"),
  );
}

if (drift.length > 0) {
  console.error(
    "FAIL: live branch protection has drifted from .github/rulesets/main.json\n",
  );
  for (const d of drift) console.error(`  - ${d}\n`);
  console.error("Reconcile with: scripts/branch-protection.sh apply");
  process.exit(1);
}

console.log(
  `OK: live ruleset "${spec.name}" matches .github/rulesets/main.json`,
);
console.log(
  "OK: no classic branch protection on 'main' (rulesets are the only layer)",
);
