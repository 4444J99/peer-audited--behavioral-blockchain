import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import test from 'node:test';

const require = createRequire(import.meta.url);
const coreURL = pathToFileURL(require.resolve('@react-navigation/core')).href;
const { getStateFromPath, getPathFromState } = await import(coreURL);
const xcode = require('xcode');
const xcodeRequire = createRequire(require.resolve('xcode/package.json'));
const uuid = xcodeRequire('uuid');

test('installed navigation parses and round-trips unicode and escaped query values', () => {
  const state = getStateFromPath('/Profile?name=Ana%20Mar%C3%ADa&value=x%26y%3Dz');
  assert.ok(state);
  const params = state.routes.at(-1).params;
  assert.equal(params.name, 'Ana María');
  assert.equal(params.value, 'x&y=z');
  assert.deepEqual(getStateFromPath(getPathFromState(state)).routes.at(-1).params, params);
});

test('malformed navigation URI completes inside a killable subprocess', () => {
  const script = `import { getStateFromPath } from ${JSON.stringify(coreURL)};
    try { getStateFromPath('/Profile?q=' + '%ab'.repeat(5000)); }
    catch (error) { if (!(error instanceof URIError)) throw error; }
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
  const group = project.addPbxGroup([], 'StyxDependencyRegression', 'StyxDependencyRegression');
  const dir = mkdtempSync(path.join(tmpdir(), 'styx-xcode-'));
  try {
    const target = path.join(dir, 'project.pbxproj');
    const serialized = project.writeSync();
    writeFileSync(target, serialized);
    const reread = xcode.project(target).parseSync();
    // The parser uses null-prototype dictionaries; inserted API objects do not.
    // Compare every serialized value, rather than implementation-only prototypes.
    assert.deepEqual(JSON.parse(JSON.stringify(reread.hash)), JSON.parse(JSON.stringify(project.hash)));
    assert.equal(reread.hash.project.objects.PBXGroup[group.uuid].path, 'StyxDependencyRegression');
    assert.equal(reread.writeSync(), serialized);
    assert.equal(readFileSync(projectPath, 'utf8'), original);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
