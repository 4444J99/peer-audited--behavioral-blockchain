import * as fs from 'fs';
import * as path from 'path';

function looksLikeApiWorkspace(dir: string): boolean {
  return path.basename(dir) === 'api' && path.basename(path.dirname(dir)) === 'src';
}

export function findRepoRoot(
  cwd = process.cwd(),
  exists: (filePath: string) => boolean = (filePath) => fs.existsSync(filePath),
): string {
  let current = path.resolve(cwd);

  while (true) {
    if (
      exists(path.join(current, 'package.json')) &&
      exists(path.join(current, 'src/api/package.json'))
    ) {
      return current;
    }

    if (looksLikeApiWorkspace(current)) {
      return path.resolve(current, '../..');
    }

    const parent = path.dirname(current);
    if (parent === current) {
      return path.resolve(cwd);
    }
    current = parent;
  }
}

export function buildEnvFileCandidatePaths(cwd = process.cwd()): string[] {
  const repoRoot = findRepoRoot(cwd);
  const apiRoot = path.join(repoRoot, 'src/api');

  return [
    path.join(repoRoot, '.env.local'),
    path.join(repoRoot, '.env'),
    path.join(apiRoot, '.env.local'),
    path.join(apiRoot, '.env'),
  ];
}

export function resolveEnvFilePath(
  cwd = process.cwd(),
  exists: (filePath: string) => boolean = (filePath) => fs.existsSync(filePath),
): string {
  const candidates = buildEnvFileCandidatePaths(cwd);
  return candidates.find((candidate) => exists(candidate)) ?? candidates[0];
}
