import * as fs from 'fs';
import * as path from 'path';

export function buildEnvFileCandidatePaths(cwd = process.cwd()): string[] {
  return [
    path.resolve(cwd, '.env'),
    path.resolve(cwd, 'src/api/.env'),
    path.resolve(cwd, '../.env'),
    path.resolve(cwd, '../src/api/.env'),
  ];
}

export function resolveEnvFilePath(
  cwd = process.cwd(),
  exists: (filePath: string) => boolean = (filePath) => fs.existsSync(filePath),
): string {
  const candidates = buildEnvFileCandidatePaths(cwd);
  return candidates.find((candidate) => exists(candidate)) ?? candidates[0];
}
