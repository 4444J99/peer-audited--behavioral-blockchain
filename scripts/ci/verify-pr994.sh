#!/usr/bin/env bash
# Read-only exact-head verification. Numeric exit codes survive advisory collection.
set -uo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"
EVIDENCE="${PR994_EVIDENCE_DIR:-${RUNNER_TEMP:-/tmp}/pr994-evidence}"
mkdir -p "$EVIDENCE"
export EVIDENCE
git rev-parse HEAD > "$EVIDENCE/head.txt"
git status --porcelain > "$EVIDENCE/status-before.txt"
node --version > "$EVIDENCE/node-version.txt"
npm --version > "$EVIDENCE/npm-version.txt"
sha256sum package-lock.json > "$EVIDENCE/lockfile-sha256.txt"
: > "$EVIDENCE/outcomes.tsv"
run() {
  local name="$1"; shift
  echo "=== $name ==="
  "$@" 2>&1 | tee "$EVIDENCE/$name.log"
  local code=${PIPESTATUS[0]}
  printf '%s\t%s\n' "$name" "$code" >> "$EVIDENCE/outcomes.tsv"
  return "$code"
}
run install npm ci --engine-strict --strict-peer-deps
installed=$?
run shell-regressions node --test scripts/tests/pr994-*.test.mjs
if [[ "$installed" -eq 0 ]]; then
  run dependency-graph node scripts/ci/check-dependency-graph.mjs
  run dependency-compatibility node --test scripts/ci/dependency-compatibility.test.mjs
  run expo-compatibility bash -c 'cd src/mobile && CI=1 npx expo install --check'
  run shared-build npm run build --workspace=@styx/shared
  shared=$?
  if [[ "$shared" -eq 0 ]]; then
    run api-types npm run lint --workspace=@styx/api
    run api-build npm run build --workspace=@styx/api
    run mobile-types npm run lint --workspace=@styx/mobile
    run database-atomicity bash -c 'cd src/api && npx jest --config jest.pr994.config.cjs --runInBand'
    run workspace-tests npm run test --workspaces --if-present
  fi
  run ask-build npm run build --workspace=@styx/ask-styx
  ask=$?
  if [[ "$ask" -eq 0 ]]; then
    mkdir -p "$EVIDENCE/site/ask-styx"
    cp -R docs/. "$EVIDENCE/site/"
    cp -R src/ask-styx/dist/. "$EVIDENCE/site/ask-styx/"
    run pages-assets node scripts/ci/check-pages-assets.mjs "$EVIDENCE/site"
  fi
  # Every reported severity blocks this acceptance receipt; no exclusions.
  run dependency-audit npm audit --audit-level=low --json
  run production-audit npm audit --omit=dev --audit-level=low --json
fi
git diff --exit-code > "$EVIDENCE/tracked-diff.log"
printf 'tracked-source-unchanged\t%s\n' "$?" >> "$EVIDENCE/outcomes.tsv"
node <<'JS'
const fs=require('fs'),path=require('path');
const root=process.env.EVIDENCE;
const outcomes=Object.fromEntries(fs.readFileSync(path.join(root,'outcomes.tsv'),'utf8').trim().split('\n').map(row=>{const [key,value]=row.split('\t');return [key,Number(value)];}));
const required=['install','shell-regressions','dependency-graph','dependency-compatibility','expo-compatibility','shared-build','api-types','api-build','mobile-types','database-atomicity','workspace-tests','ask-build','pages-assets','dependency-audit','production-audit','tracked-source-unchanged'];
const passed=required.every(key=>outcomes[key]===0);
const result={headSha:fs.readFileSync(path.join(root,'head.txt'),'utf8').trim(),checkedAt:new Date().toISOString(),run:process.env.GITHUB_RUN_ID||null,node:process.version,npm:fs.readFileSync(path.join(root,'npm-version.txt'),'utf8').trim(),passed,outcomes,notVerified:['live beta readiness','native camera recording','external practitioner pilot','live Sentry delivery','merge readiness']};
fs.writeFileSync(path.join(root,'result.json'),JSON.stringify(result,null,2)+'\n');
if(process.env.GITHUB_STEP_SUMMARY)fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,'```json\n'+JSON.stringify(result,null,2)+'\n```\n');
console.log(JSON.stringify(result,null,2));process.exitCode=passed?0:1;
JS
