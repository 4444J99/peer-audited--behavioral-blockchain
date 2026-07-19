import { buildEnvFileCandidatePaths, findRepoRoot, resolveEnvFilePath } from './env-path';

describe('env path resolution', () => {
  it('should resolve the repository root from the api workspace', () => {
    expect(findRepoRoot('/repo/src/api')).toBe('/repo');
  });

  it('should prioritize repo-level env files before workspace-local env files', () => {
    const candidates = buildEnvFileCandidatePaths('/repo');
    expect(candidates).toEqual([
      '/repo/.env.local',
      '/repo/.env',
      '/repo/src/api/.env.local',
      '/repo/src/api/.env',
    ]);
  });

  it('should resolve the same root env file from repo root and src/api cwd', () => {
    const exists = (filePath: string) => filePath === '/repo/.env';

    const fromRepoRoot = resolveEnvFilePath('/repo', exists);
    const fromApiDir = resolveEnvFilePath('/repo/src/api', exists);

    expect(fromRepoRoot).toBe('/repo/.env');
    expect(fromApiDir).toBe('/repo/.env');
  });

  it('should fall back to workspace-local env when repo env files are absent', () => {
    const exists = (filePath: string) => filePath === '/repo/src/api/.env';
    expect(resolveEnvFilePath('/repo/src/api', exists)).toBe('/repo/src/api/.env');
  });
});
