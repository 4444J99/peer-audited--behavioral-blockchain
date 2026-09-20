const test = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { inspectContext } = require('./ci-context.cjs');

function fixture(t, changed = 'package-lock.json') {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'styx-ci-context-'));
  t.after(() => fs.rmSync(cwd, { recursive: true, force: true }));
  const git = (...args) => execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  git('init', '-b', 'main');
  git('config', 'user.name', 'CI fixture');
  git('config', 'user.email', 'ci-fixture@example.invalid');
  const commit = (file, content) => {
    fs.mkdirSync(path.dirname(path.join(cwd, file)), { recursive: true });
    fs.writeFileSync(path.join(cwd, file), content);
    git('add', '--', file);
    git('commit', '-m', `fixture ${file}`);
    return git('rev-parse', 'HEAD');
  };
  const oldBase = commit('README.md', 'original\n');
  git('checkout', '-b', 'pr');
  const head = commit(changed, 'candidate\n');
  git('checkout', 'main');
  const actualBase = commit('main-only.txt', 'advanced base\n');
  git('merge', '--no-ff', '-m', 'synthetic PR merge', 'pr');
  return { cwd, git, oldBase, actualBase, head, sha: git('rev-parse', 'HEAD') };
}

test('binds a synthetic merge to its actual base even after main advances', t => {
  const f = fixture(t);
  const result = inspectContext({ cwd: f.cwd, sha: f.sha, eventName: 'pull_request', prHeadSha: f.head });
  assert.notEqual(f.oldBase, f.actualBase);
  assert.equal(result.base, f.actualBase);
  assert.deepEqual(result.changed, ['package-lock.json']);
  assert.equal(result.web, true);
});

test('works with depth-two history without a full-history fetch', t => {
  const f = fixture(t);
  const shallow = fs.mkdtempSync(path.join(os.tmpdir(), 'styx-ci-shallow-'));
  t.after(() => fs.rmSync(shallow, { recursive: true, force: true }));
  execFileSync('git', ['clone', '--depth', '2', `file://${f.cwd}`, shallow], { stdio: 'pipe' });
  assert.equal(inspectContext({ cwd: shallow, sha: f.sha, eventName: 'pull_request', prHeadSha: f.head }).base, f.actualBase);
});

test('rejects a merge containing a different PR head', t => {
  const f = fixture(t);
  assert.throws(() => inspectContext({ cwd: f.cwd, sha: f.sha, eventName: 'pull_request', prHeadSha: f.oldBase }), /different PR head/);
});

test('rejects a checkout different from the event revision', t => {
  const f = fixture(t);
  assert.throws(() => inspectContext({ cwd: f.cwd, sha: f.head, eventName: 'pull_request', prHeadSha: f.head }), /Checkout differs/);
});

test('does not run browser tests for a verified documentation-only diff', t => {
  const f = fixture(t, 'docs/change.md');
  assert.equal(inspectContext({ cwd: f.cwd, sha: f.sha, eventName: 'pull_request', prHeadSha: f.head }).web, false);
});

test('requires browser validation when the CI gate itself changes', t => {
  const f = fixture(t, '.github/workflows/ci.yml');
  assert.equal(inspectContext({ cwd: f.cwd, sha: f.sha, eventName: 'pull_request', prHeadSha: f.head }).web, true);
});

test('merge groups always require browser validation', t => {
  const f = fixture(t, 'docs/change.md');
  assert.equal(inspectContext({ cwd: f.cwd, sha: f.sha, eventName: 'merge_group', groupBaseSha: f.actualBase }).web, true);
});

test('missing merge-group comparison objects fail instead of skipping validation', t => {
  const f = fixture(t);
  assert.throws(() => inspectContext({ cwd: f.cwd, sha: f.sha, eventName: 'merge_group', groupBaseSha: '1'.repeat(40) }));
});

for (const file of ['.github/scripts/ci-context.cjs', '.github/scripts/ci-context.test.cjs']) {
  test(`requires browser validation when ${file} changes`, t => {
    const f = fixture(t, file);
    const result = inspectContext({ cwd: f.cwd, sha: f.sha, eventName: 'pull_request', prHeadSha: f.head });
    assert.deepEqual(result.changed, [file]);
    assert.equal(result.web, true);
  });
}

for (const file of ['dependency-contract.yml', 'mobile-bundle.yml']) {
  test(`${file} validates the event merge revision rather than the isolated PR head`, () => {
    const workflow = fs.readFileSync(path.join(__dirname, '..', 'workflows', file), 'utf8');
    const checkouts = [...workflow.matchAll(/uses: actions\/checkout@[^\n]+\n([\s\S]*?)(?=\n      - |$)/g)];
    assert.equal(checkouts.length, 1, 'Expected one source checkout');
    assert.match(checkouts[0][1], /ref: \$\{\{ github\.sha \}\}/);
    assert.doesNotMatch(checkouts[0][1], /pull_request\.head\.sha/);
    assert.match(checkouts[0][1], /persist-credentials: false/);
  });
}
