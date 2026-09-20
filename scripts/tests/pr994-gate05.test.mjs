import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
for (const target of ['', 'https://configured.invalid']) {
  for (const code of [0, 1, 2, 78]) {
    test(`Gate 05 target=${target || 'unset'} exit=${code}`, () => {
      const result = spawnSync('bash', ['scripts/smoke/gate05-ci.sh', process.execPath, '-e', `process.exit(${code})`], {
        env: {...process.env, API_URL:target}, encoding:'utf8',
      });
      assert.equal(result.status, !target && code === 2 ? 0 : code);
      if (!target && code === 2) assert.match(result.stdout, /NOT VERIFIED/);
      if (target && code === 2) assert.doesNotMatch(result.stdout, /offline constants checked/);
    });
  }
}
