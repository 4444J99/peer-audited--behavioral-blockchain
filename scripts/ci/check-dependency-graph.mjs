import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync, realpathSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
const root = process.cwd();
const require = createRequire(resolve(root, 'package.json'));
const lock = JSON.parse(readFileSync('package-lock.json', 'utf8'));
const manifests = ['', ...['src','packages'].flatMap(dir => existsSync(dir) ? readdirSync(dir).map(name=>`${dir}/${name}`).filter(path=>existsSync(`${path}/package.json`)) : [])];
for (const path of manifests) {
  const manifest = JSON.parse(readFileSync(resolve(path,'package.json'),'utf8'));
  const snapshot = lock.packages[path];
  assert.ok(snapshot, `missing workspace snapshot ${path}`);
  for (const key of ['dependencies','devDependencies','optionalDependencies']) {
    assert.deepEqual(snapshot[key] || {}, manifest[key] || {}, `${path || 'root'} ${key} differ from lock`);
  }
}
const copies = Object.entries(lock.packages).filter(([path]) => /(?:^|\/)node_modules\/react-native$/.test(path));
assert.equal(copies.length, 1, `Expected one React Native runtime; found ${copies.map(([p,x])=>p+'@'+x.version).join(', ')}`);
assert.equal(copies[0][1].version, '0.86.0');
const mobile = resolve('src/mobile');
const native = realpathSync(require.resolve('react-native/package.json', {paths:[mobile]}));
const peers = ['expo','expo-camera','expo-application','react-native-screens','react-native-safe-area-context'];
for (const name of peers) {
  const packagePath = require.resolve(`${name}/package.json`, { paths:[mobile] });
  const peer = realpathSync(require.resolve('react-native/package.json', { paths:[packagePath.replace(/\/package\.json$/, '')] }));
  assert.equal(peer, native, `${name} resolves a different React Native runtime`);
}
const sentry = require.resolve('@sentry/nestjs', {paths:[resolve('src/api')]});
console.log(JSON.stringify({manifests:manifests.length,reactNativeVersion:copies[0][1].version,runtimeCopies:copies.length,native,peers,sentry},null,2));
