const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const workflow = fs.readFileSync(path.join(__dirname, '../../.github/workflows/ci.yml'), 'utf8');
function job(name) {
  const match = workflow.match(new RegExp(`^  ${name}:\\n([\\s\\S]*?)(?=^  [\\w-]+:|$(?![\\s\\S]))`, 'm'));
  assert.ok(match, `Missing job ${name}`);
  return match[1];
}
function verdict(name, values) {
  const block = job(name).match(/^        run: \|\n((?:          .*\n|\n)+)/m);
  assert.ok(block, `Missing verdict script for ${name}`);
  const script = block[1].replace(/^          /gm, '').replace(/\$\{\{\s*([^}]+?)\s*\}\}/g, (_, key) => {
    assert.ok(Object.hasOwn(values, key.trim()), `Unbound expression: ${key}`);
    return values[key.trim()];
  });
  const result = spawnSync('bash', ['-e', '-c', script], { encoding: 'utf8', timeout: 3000 });
  assert.ifError(result.error);
  return result.status;
}

test('browser tests can execute without converting deployment failure into success', () => {
  assert.match(job('e2e_browsers'), /needs: \[changed-files\]/);
  assert.match(job('build_and_test'), /needs: \[build_and_test_matrix, beta_readiness\]/);
  assert.match(job('build_and_test'), /if: always\(\)/);
});
for (const [matrix, beta, expected] of [
  ['success', 'success', 0], ['failure', 'success', 1], ['success', 'failure', 1],
  ['success', 'skipped', 1], ['cancelled', 'success', 1], ['skipped', 'success', 1],
]) {
  test(`required build verdict: matrix=${matrix}, beta=${beta}`, () => {
    assert.equal(verdict('build_and_test', {
      'needs.build_and_test_matrix.result': matrix, 'needs.beta_readiness.result': beta,
    }), expected);
  });
}
for (const [changed, web, browsers, expected] of [
  ['success', 'true', 'success', 0], ['success', 'true', 'failure', 1],
  ['success', 'true', 'skipped', 1], ['failure', 'false', 'skipped', 1],
  ['success', '', 'success', 1], ['success', 'false', 'skipped', 0],
]) {
  test(`required browser verdict: change=${changed}, web=${web}, browsers=${browsers}`, () => {
    assert.equal(verdict('e2e', {
      'needs.changed-files.result': changed, 'needs.changed-files.outputs.web': web,
      'needs.e2e_browsers.result': browsers,
    }), expected);
  });
}

test('beta readiness builds its scan artifacts and retains strict live targets', () => {
  const beta = job('beta_readiness');
  assert.ok(beta.indexOf('npx turbo run build --filter=@styx/api --filter=@styx/web') < beta.indexOf('Run Beta Readiness Suite'));
  assert.match(beta, /READINESS_PROFILE: beta/);
  assert.match(beta, /READINESS_REQUIRE_TARGETS: "true"/);
  assert.match(beta, /BETA_API_URL: \$\{\{ secrets\.CI_BETA_API_URL \|\| secrets\.CI_GATE05_API_URL \}\}/);
  assert.match(beta, /STYX_DEMO_PASSWORD: \$\{\{ secrets\.BETA_DEMO_PASSWORD \}\}/);
  assert.match(beta, /ref: \$\{\{ github\.sha \}\}/);
  assert.doesNotMatch(beta, /--offline|continue-on-error|READINESS_PROFILE: ci/);
});

test('Gate 05 still requires an external target and security scan errors remain fatal', () => {
  const matrix = job('build_and_test_matrix');
  assert.match(matrix, /API_URL: \$\{\{ secrets\.CI_GATE05_API_URL \}\}/);
  assert.match(matrix, /run: npx tsx scripts\/validation\/05-behavioral-physics-check\.ts\n/);
  const security = matrix.split('name: Gate 06')[1].split('name: Gate 07')[0];
  assert.match(security, /!cancelled\(\) && steps\.build_validation\.outcome == 'success'/);
  assert.match(security, /run: npx tsx scripts\/validation\/06-security-invariant-check\.ts\n/);
  assert.doesNotMatch(security, /exit 0|continue-on-error|\|\| true/);
});
