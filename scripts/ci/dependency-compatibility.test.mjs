import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import test from 'node:test';

const require = createRequire(import.meta.url);
const coreRequire = createRequire(require.resolve('@react-navigation/core/package.json'));
const queryURL = pathToFileURL(coreRequire.resolve('query-string')).href;
const query = (await import(queryURL)).default;
const xcode = require('xcode');
const xcodeRequire = createRequire(require.resolve('xcode/package.json'));
const uuid = xcodeRequire('uuid');

test('navigation query parsing preserves unicode, repeated keys, and escaping', () => {
  const parsed = query.parse('name=Ana%20Mar%C3%ADa&tag=a&tag=b&value=x%26y%3Dz');
  assert.deepEqual({ ...parsed }, { name: 'Ana María', tag: ['a', 'b'], value: 'x&y=z' });
  assert.deepEqual({ ...query.parse(query.stringify(parsed)) }, { ...parsed });
  assert.equal(query.parse('blank=&flag').blank, '');
  assert.equal(query.parse('blank=&flag').flag, null);
});

test('malformed URI input completes inside a killable subprocess', () => {
  const script = `import query from ${JSON.stringify(queryURL)};
    const malformed = '%ab'.repeat(5000);
    const result = query.parse('q=' + malformed);
    if (typeof result.q !== 'string') throw new Error('Lost query value');
    console.log('completed');`;
  assert.equal(execFileSync(process.execPath, ['--input-type=module', '-e', script], {
    encoding: 'utf8', timeout: 5000,
  }).trim(), 'completed');
});

test('xcode resolves patched CommonJS UUID and preserves its v4 interface', () => {
  assert.equal(xcodeRequire('uuid/package.json').version, '11.1.1');
  assert.equal(typeof uuid.v4, 'function');
  assert.match(uuid.v4(), /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  for (const fn of [uuid.v3, uuid.v5]) {
    assert.throws(() => fn('styx', uuid.v5.DNS, Buffer.alloc(8)), RangeError);
    assert.throws(() => fn('styx', uuid.v5.DNS, Buffer.alloc(16), 1), RangeError);
  }
});

test('Expo xcode dependency round-trips the existing native project', () => {
  const projectPath = path.resolve('src/mobile/ios/Styx.xcodeproj/project.pbxproj');
  const original = readFileSync(projectPath, 'utf8');
  const project = xcode.project(projectPath).parseSync();
  const generated = new Set(Array.from({ length: 1000 }, () => project.generateUuid()));
  assert.equal(generated.size, 1000);
  for (const id of generated) assert.match(id, /^[0-9A-F]{24}$/);
  project.addPbxGroup([], 'StyxDependencyRegression');
  const dir = mkdtempSync(path.join(tmpdir(), 'styx-xcode-'));
  try {
    const target = path.join(dir, 'project.pbxproj');
    writeFileSync(target, project.writeSync());
    const reread = xcode.project(target).parseSync();
    assert.deepEqual(reread.hash, project.hash);
    assert.equal(readFileSync(projectPath, 'utf8'), original);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
