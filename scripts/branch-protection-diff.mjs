#!/usr/bin/env node
/**
 * Compare live GitHub branch protection against `.github/rulesets/main.json`.
 *
 * Driven by `scripts/branch-protection.sh check`, which supplies on stdin:
 *
 *   { effective: [...],        // GET /repos/{o}/{r}/rules/branches/{branch}
 *     ruleset:   {...}|null,   // GET /repos/{o}/{r}/rulesets/{id}  (admin only)
 *     classic:   true|false|null }  // classic protection present / absent / unknown
 *
 * `effective` needs no special permission and carries full rule parameters, so
 * the core policy is verifiable with any token. `ruleset` and `classic` require
 * repo admin; when they are unavailable the checks that depend on them are
 * reported as UNVERIFIED rather than silently passed.
 *
 * Exits 0 when everything checked matches, 1 on drift, 3 when nothing could be
 * verified at all.
 */
import fs from "node:fs";

const specPath = process.argv[2];
if (!specPath) {
  console.error(
    "usage: branch-protection-diff.mjs <spec.json>  (payload JSON on stdin)",
  );
  process.exit(2);
}

const spec = JSON.parse(fs.readFileSync(specPath, "utf8"));
const { effective, ruleset, classic } = JSON.parse(fs.readFileSync(0, "utf8"));
const branch = process.env.BRANCH || "the default branch";

const drift = [];
const unverified = [];

/**
 * Order-insensitive canonical form. The API echoes object keys in its own
 * order, and none of the arrays in a ruleset are order-significant
 * (`bypass_actors`, `required_status_checks`, `allowed_merge_methods`,
 * `include`/`exclude`), so both sides are normalized before comparison.
 * Without this the check would report drift on every run and get ignored —
 * the failure mode a drift check exists to prevent.
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

// --- Rules and their parameters (no special permission required) -------------

const liveByType = new Map((effective ?? []).map((r) => [r.type, r]));
for (const want of spec.rules ?? []) {
  const got = liveByType.get(want.type);
  if (!got) {
    drift.push(
      `rules[${want.type}]\n    file: present\n    live: NOT IN EFFECT on '${branch}'`,
    );
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
    `rules[${type}]\n    file: absent\n    live: IN EFFECT on '${branch}' (not declared in the file)`,
  );
}

// --- Ruleset-object fields (admin only) --------------------------------------

if (ruleset && ruleset.bypass_actors !== undefined) {
  for (const key of [
    "name",
    "target",
    "enforcement",
    "conditions",
    "bypass_actors",
  ]) {
    if (key in spec) cmp(key, spec[key], ruleset[key]);
  }
} else {
  unverified.push(
    "enforcement / conditions / bypass_actors — the ruleset object is readable\n" +
      "    only with repo-admin rights, and a non-admin token receives a redacted\n" +
      "    copy with those fields withheld.",
  );
}

// --- Classic branch protection (admin only) ----------------------------------
//
// Classic protection is enforced as a union with rulesets but does NOT appear
// in the effective-rules endpoint (verified empirically), so this is the only
// way to see it. That makes it the one gap a non-admin token cannot close.

if (classic === true) {
  drift.push(
    [
      `classic branch protection on '${branch}'`,
      "    file: rulesets only (single source of truth)",
      "    live: PRESENT - GitHub enforces the union of classic protection and",
      "          rulesets, and classic rules are invisible from the Rulesets UI,",
      "          so this can silently override the file. Remove it.",
    ].join("\n"),
  );
} else if (classic === null) {
  unverified.push(
    "classic branch protection — probing it requires repo-admin rights, and it\n" +
      "    does not surface in the effective-rules endpoint. If it were re-added,\n" +
      "    this run could not tell.",
  );
}

// --- Report ------------------------------------------------------------------

if (drift.length > 0) {
  console.error(
    "FAIL: live branch protection has drifted from .github/rulesets/main.json\n",
  );
  for (const d of drift) console.error(`  - ${d}\n`);
  console.error("Reconcile with: scripts/branch-protection.sh apply");
  process.exit(1);
}

const checkedRules = (spec.rules ?? []).length;
if (checkedRules === 0 && unverified.length > 0) {
  console.error("SKIP: nothing could be verified.");
  process.exit(3);
}

console.log(
  `OK: ${checkedRules} rule(s) in effect on '${branch}' match .github/rulesets/main.json`,
);
if (unverified.length > 0) {
  console.log("\nNOT VERIFIED by this run:");
  for (const u of unverified) console.log(`  - ${u}`);
  console.log(
    "\n  Set BRANCH_PROTECTION_TOKEN (fine-grained PAT, 'Administration: read')\n" +
      "  in CI, or run this locally as the repo owner, to cover them.",
  );
  process.exit(0);
}
console.log(
  `OK: no classic branch protection on '${branch}' (rulesets are the only layer)`,
);
