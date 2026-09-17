import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { validateRuntimeContract, SUPPORTED_NODE_RANGE } from './runtime-contract.mjs';

function fixture(t, changes = {}) {
  const root = mkdtempSync(join(tmpdir(), 'styx-runtime-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const manifest = JSON.stringify({ engines: { node: SUPPORTED_NODE_RANGE } });
  const files = {
    '.node-version': '24\n',
    'package.json': manifest,
    'src/api/package.json': manifest,
    'src/mobile/package.json': manifest,
    '.github/workflows/ci.yml': 'matrix:\n  node-version: [24]\nwith:\n  node-version: ${{ matrix.node-version }}\n',
    '.github/workflows/deploy.yml': 'with:\n  node-version-file: .node-version\n',
    '.config/docker/Dockerfile': 'FROM node:24-alpine\n',
    'src/api/Dockerfile': 'FROM node:24-alpine AS builder\nFROM node:24-alpine AS runner\n',
    'src/web/Dockerfile': 'FROM node:24-alpine\n',
    'render.yaml': '- key: NODE_VERSION\n  value: "24"\n- key: NODE_VERSION\n  value: "24"\n',
    ...changes,
  };
  for (const [file, content] of Object.entries(files)) {
    const path = join(root, file);
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, content);
  }
  return root;
}

test('accepts the supported runtime across apps, CI, and deployment definitions', (t) => {
  assert.deepEqual(validateRuntimeContract(fixture(t)), []);
});

for (const [label, file, content] of [
  ['root selector', '.node-version', '22\n'],
  ['nvm selector', '.nvmrc', '22\n'],
  ['root engine', 'package.json', '{"engines":{"node":">=22"}}'],
  ['API engine', 'src/api/package.json', '{"engines":{"node":">=22"}}'],
  ['mobile engine', 'src/mobile/package.json', '{}'],
  ['package engine', 'packages/example/package.json', '{"engines":{"node":">=22"}}'],
  ['matrix', '.github/workflows/ci.yml', 'matrix:\n  node-version: [22]\nwith:\n  node-version: ${{ matrix.node-version }}\n'],
  ['workflow literal', '.github/workflows/deploy.yml', 'with:\n  node-version: "22"\n'],
  ['workflow file', '.github/workflows/deploy.yml', 'with:\n  node-version-file: .nvmrc\n'],
  ['container', 'src/api/Dockerfile', 'FROM node:22-alpine\n'],
  ['Render', 'render.yaml', '- key: NODE_VERSION\n  value: "24"\n- key: NODE_VERSION\n  value: "22"\n'],
]) {
  test(`rejects ${label} drift`, (t) => {
    assert.ok(validateRuntimeContract(fixture(t, { [file]: content })).length > 0);
  });
}
