import { buildEnvFileCandidatePaths, resolveEnvFilePath } from './env-path';

describe('env path resolution', () => {
  it('should prioritize cwd and src/api paths in a deterministic order', () => {
    const candidates = buildEnvFileCandidatePaths('/repo');
    expect(candidates).toEqual([
      '/repo/.env',
      '/repo/src/api/.env',
      '/.env',
      '/src/api/.env',
    ]);
  });

  it('should resolve the same env file from repo root and src/api cwd when only src/api/.env exists', () => {
    const exists = (filePath: string) => filePath === '/repo/src/api/.env';

    const fromRepoRoot = resolveEnvFilePath('/repo', exists);
    const fromApiDir = resolveEnvFilePath('/repo/src/api', exists);

    expect(fromRepoRoot).toBe('/repo/src/api/.env');
    expect(fromApiDir).toBe('/repo/src/api/.env');
  });

  it('should fall back to cwd .env when present', () => {
    const exists = (filePath: string) => filePath === '/repo/.env';
    expect(resolveEnvFilePath('/repo', exists)).toBe('/repo/.env');
  });
});
