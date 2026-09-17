const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');

/** Bind change detection to the exact checkout, not a stale event-base ref. */
function inspectContext({ cwd = process.cwd(), sha, eventName, prHeadSha, groupBaseSha }) {
  const git = (...args) => execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  const validSha = value => typeof value === 'string' && /^[a-f0-9]{40}$/.test(value);
  assert.ok(validSha(sha), 'A complete expected checkout SHA is required');
  assert.equal(git('rev-parse', 'HEAD'), sha, 'Checkout differs from the expected event revision');
  const parents = git('cat-file', 'commit', sha).split('\n\n')[0].split('\n').filter(line => line.startsWith('parent ')).map(line => line.slice(7));
  let base;
  if (eventName === 'pull_request') {
    assert.equal(parents.length, 2, 'PR validation requires the synthetic merge commit');
    assert.ok(validSha(prHeadSha), 'An exact PR head SHA is required');
    assert.equal(parents[1], prHeadSha, 'Merge revision contains a different PR head');
    base = parents[0];
  } else if (eventName === 'merge_group') {
    assert.ok(validSha(groupBaseSha), 'An exact merge-group base SHA is required');
    base = groupBaseSha;
  } else {
    assert.equal(eventName, 'push', 'Unsupported CI event');
    assert.ok(parents.length >= 1, 'A comparison parent is required');
    base = parents[0];
  }
  git('cat-file', '-e', `${base}^{commit}`);
  const changed = git('diff', '--name-only', '--no-renames', base, sha).split('\n').filter(Boolean);
  const web = eventName === 'merge_group' || changed.some(file => /^(src\/web\/|src\/shared\/|e2e\/|\.config\/playwright\/|package(?:-lock)?\.json$|\.node-version$|\.github\/workflows\/ci\.yml$)/.test(file));
  return { sha, base, prHeadSha: eventName === 'pull_request' ? prHeadSha : null, web, changed };
}

module.exports = { inspectContext };
if (require.main === module) {
  try {
    const context = inspectContext({ sha: process.env.GITHUB_SHA, eventName: process.env.GITHUB_EVENT_NAME, prHeadSha: process.env.PR_HEAD_SHA, groupBaseSha: process.env.GROUP_BASE_SHA });
    if (process.env.GITHUB_EVENT_NAME === 'pull_request') {
      // Local comparison ref only; never push or move a remote branch.
      execFileSync('git', ['update-ref', 'refs/remotes/origin/main', context.base]);
    }
    if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT, `web=${context.web}\nbase_sha=${context.base}\nhead_sha=${context.sha}\n`);
    if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, `Checked revision: \`${context.sha}\`; actual comparison base: \`${context.base}\`; browser validation required: ${context.web}.\n`);
    console.log(JSON.stringify(context, null, 2));
  } catch (error) {
    console.error(`CI context failed: ${error.message}`);
    process.exitCode = 1;
  }
}
