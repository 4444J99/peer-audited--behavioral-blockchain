const { spawnSync } = require('node:child_process');

// Nest 12 exposes ESM packages. Jest's synchronous require(esm) support on our
// Node 24 runtime needs the VM-module API enabled. Keep the flag local to this
// test process; do not change production module behavior or other workspaces.
const result = spawnSync(
  process.execPath,
  ['--experimental-vm-modules', require.resolve('jest/bin/jest'), ...process.argv.slice(2)],
  { stdio: 'inherit', env: process.env },
);
if (result.error) {
  console.error(`Unable to start API Jest: ${result.error.message}`);
  process.exitCode = 1;
} else if (result.signal) {
  console.error(`API Jest terminated by ${result.signal}`);
  process.exitCode = 1;
} else {
  process.exitCode = result.status ?? 1;
}
