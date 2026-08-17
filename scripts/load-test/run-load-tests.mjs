#!/usr/bin/env node
import { spawnSync } from 'node:child_process';

const apiBaseUrl = process.env.K6_API_BASE_URL;
const scenarios = [
  'scripts/load-test/scenarios/contract-lifecycle.js',
  'scripts/load-test/scenarios/fury-queue-throughput.js',
];

function run(command, args) {
  const result = spawnSync(command, args, { stdio: 'inherit', env: process.env });
  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

console.log('Styx Load Testing Runner (k6)');
console.log('==============================');

if (!apiBaseUrl) {
  console.error('K6_API_BASE_URL is required; refusing to run against an implicit target.');
  process.exit(1);
}

try {
  run('k6', ['version']);
} catch (error) {
  console.error('k6 is required for load verification and was not available.');
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}

for (const scenario of scenarios) {
  console.log(`Running ${scenario} against ${apiBaseUrl}`);
  run('k6', ['run', scenario]);
}

console.log('All k6 scenarios passed.');
