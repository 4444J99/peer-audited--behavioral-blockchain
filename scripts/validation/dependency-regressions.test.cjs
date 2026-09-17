const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { createRequire } = require('node:module');
const semver = require('semver');

const mobile = createRequire(path.resolve('src/mobile/package.json'));
const expo = createRequire(mobile.resolve('expo/package.json'));
const configPlugins = createRequire(expo.resolve('@expo/config-plugins/package.json'));
// Resolve through the real consumer, without assuming npm hoists this package.
const xcodeRequire = createRequire(configPlugins.resolve('xcode/package.json'));

// Xcode uses CommonJS uuid.v4(), not the removed uuid/v4 path. Keep its override
// scoped; the API retains its independent, newer UUID version.
test('Xcode tooling resolves a patched CommonJS UUID implementation', () => {
  assert.ok(semver.gte(xcodeRequire('uuid/package.json').version, '11.1.1'));
  const uuid = xcodeRequire('uuid');
  assert.equal(typeof uuid.v4, 'function');
  assert.match(uuid.v4(), /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
});

test('UUID name-based generation rejects undersized caller buffers', () => {
  const uuid = xcodeRequire('uuid');
  for (const name of ['v3', 'v5']) {
    assert.throws(() => uuid[name]('styx', uuid[name].DNS, new Uint8Array(15)));
    assert.throws(() => uuid[name]('styx', uuid[name].DNS, new Uint8Array(16), 1));
    assert.equal(uuid.validate(uuid[name]('styx', uuid[name].DNS)), true);
  }
});

test('patched Xcode UUIDs survive project parse, mutation, and serialization', (t) => {
  const folder = fs.mkdtempSync(path.join(os.tmpdir(), 'styx-xcode-'));
  t.after(() => fs.rmSync(folder, { recursive: true, force: true }));
  const file = path.join(folder, 'project.pbxproj');
  fs.writeFileSync(file, `// !$*UTF8*$!
{
  archiveVersion = 1;
  classes = {};
  objectVersion = 56;
  objects = {
    000000000000000000000001 = {
      isa = PBXGroup;
      children = ();
      sourceTree = "<group>";
    };
    000000000000000000000002 = {
      isa = PBXProject;
      mainGroup = 000000000000000000000001;
      targets = ();
    };
  };
  rootObject = 000000000000000000000002;
}
`);
  const xcode = configPlugins('xcode');
  const project = xcode.project(file);
  project.parseSync();
  const generated = new Set(Array.from({ length: 128 }, () => project.generateUuid()));
  assert.equal(generated.size, 128);
  for (const value of generated) assert.match(value, /^[0-9A-F]{24}$/);
  const group = project.addPbxGroup([], 'CompatibilityFixture');
  assert.match(group.uuid, /^[0-9A-F]{24}$/);
  fs.writeFileSync(file, project.writeSync());
  const parsed = xcode.project(file);
  parsed.parseSync();
  assert.equal(parsed.hash.project.objects.PBXGroup[group.uuid].name, 'CompatibilityFixture');
});

test('navigation uses the patched core without the vulnerable query parser', () => {
  const native = mobile('@react-navigation/native/package.json');
  const core = mobile('@react-navigation/core/package.json');
  assert.ok(semver.gte(native.version, '7.4.1'));
  assert.ok(semver.gte(core.version, '7.22.1'));
  assert.equal(core.dependencies['query-string'], undefined);
});

test('navigation still decodes and round-trips contract deep-link parameters', () => {
  const { getStateFromPath, getPathFromState } = mobile('@react-navigation/core');
  const config = { screens: { ContractDetail: 'contracts/:contractId' } };
  const state = getStateFromPath('/contracts/abc%20def?note=hello%20world&mode=test', config);
  assert.ok(state);
  assert.equal(state.routes[0].name, 'ContractDetail');
  assert.deepEqual({ ...state.routes[0].params }, { contractId: 'abc def', note: 'hello world', mode: 'test' });
  const roundTrip = getStateFromPath(getPathFromState(state, config), config);
  assert.equal(roundTrip.routes[0].name, state.routes[0].name);
  assert.deepEqual({ ...roundTrip.routes[0].params }, { ...state.routes[0].params });
});
