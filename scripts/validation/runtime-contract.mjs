import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

export const SUPPORTED_NODE_MAJOR = '24';
export const SUPPORTED_NODE_RANGE = '>=24.15.0 <25';

/** Validate active runtime selectors, never rewrite historical documentation. */
export function validateRuntimeContract(root) {
  const failures = [];
  const text = (file) => {
    try { return readFileSync(join(root, file), 'utf8'); }
    catch { failures.push(`${file}: missing or unreadable`); return ''; }
  };
  if (text('.node-version').trim() !== SUPPORTED_NODE_MAJOR) {
    failures.push('.node-version: expected the supported Node 24 release line');
  }
  if (existsSync(join(root, '.nvmrc')) && text('.nvmrc').trim() !== SUPPORTED_NODE_MAJOR) {
    failures.push('.nvmrc: differs from .node-version');
  }
  const manifests = new Set(['package.json', 'src/api/package.json', 'src/mobile/package.json']);
  for (const parent of ['src', 'packages']) {
    if (!existsSync(join(root, parent))) continue;
    for (const entry of readdirSync(join(root, parent), { withFileTypes: true })) {
      if (entry.isDirectory() && existsSync(join(root, parent, entry.name, 'package.json'))) {
        manifests.add(`${parent}/${entry.name}/package.json`);
      }
    }
  }
  for (const file of manifests) {
    try {
      const manifest = JSON.parse(text(file));
      const required = ['package.json', 'src/api/package.json', 'src/mobile/package.json'].includes(file);
      if ((required || manifest.engines?.node) && manifest.engines?.node !== SUPPORTED_NODE_RANGE) {
        failures.push(`${file}: expected engines.node ${SUPPORTED_NODE_RANGE}`);
      }
    } catch { failures.push(`${file}: invalid JSON`); }
  }
  const workflowDir = join(root, '.github/workflows');
  if (!existsSync(workflowDir)) failures.push('.github/workflows: missing');
  else for (const name of readdirSync(workflowDir).filter((file) => /\.ya?ml$/.test(file))) {
    const file = `.github/workflows/${name}`;
    const source = text(file);
    for (const line of source.split('\n')) {
      const match = line.match(/^\s*node-version(-file)?:\s*(.*?)\s*(?:#.*)?$/);
      if (!match) continue;
      const value = match[2].replace(/^["']|["']$/g, '').trim();
      if (match[1]) {
        if (value !== '.node-version') failures.push(`${file}: node-version-file must use .node-version`);
      } else if (value === '${{ matrix.node-version }}') {
        if (!/^\s*node-version:\s*\[\s*24\s*\]\s*$/m.test(source)) {
          failures.push(`${file}: matrix must select only Node 24`);
        }
      } else if (!['24', '24.x', '[24]'].includes(value)) {
        failures.push(`${file}: unsupported Node selector ${value}`);
      }
    }
  }
  for (const file of ['.config/docker/Dockerfile', 'src/api/Dockerfile', 'src/web/Dockerfile']) {
    const source = text(file);
    const versions = [...source.matchAll(/^FROM\s+node:([^\s]+).*$/gm)].map((match) => match[1]);
    if (!versions.length || versions.some((tag) => !/^24(?:-alpine)?(?:@sha256:[a-f0-9]{64})?$/.test(tag))) {
      failures.push(`${file}: all Node base images must use the supported Node 24 release line`);
    }
  }
  const render = text('render.yaml');
  const selections = [...render.matchAll(/-\s*key:\s*NODE_VERSION\s*\n\s*value:\s*["']?([^\s"']+)/g)];
  if (selections.length !== 2 || selections.some((match) => match[1] !== SUPPORTED_NODE_MAJOR)) {
    failures.push('render.yaml: both service NODE_VERSION selectors must be 24');
  }
  return failures;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const failures = validateRuntimeContract(process.cwd());
  if (Number(process.versions.node.split('.')[0]) !== Number(SUPPORTED_NODE_MAJOR) ||
      Number(process.versions.node.split('.')[1]) < 15) {
    failures.push(`Running Node ${process.versions.node}; required ${SUPPORTED_NODE_RANGE}`);
  }
  if (failures.length) {
    for (const failure of failures) console.error(`Runtime contract: ${failure}`);
    process.exitCode = 1;
  } else console.log(`Runtime contract passed on Node ${process.versions.node}`);
}
