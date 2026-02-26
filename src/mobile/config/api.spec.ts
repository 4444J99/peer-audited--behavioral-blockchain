import { resolveApiBaseUrl } from './api';

describe('mobile api config', () => {
  it('should prefer EXPO_PUBLIC_STYX_API_URL', () => {
    expect(
      resolveApiBaseUrl({
        EXPO_PUBLIC_STYX_API_URL: 'https://api.staging.styx.example',
        STYX_API_URL: 'http://localhost:3000',
      }),
    ).toBe('https://api.staging.styx.example');
  });

  it('should fall back to STYX_API_URL when expo vars are absent', () => {
    expect(resolveApiBaseUrl({ STYX_API_URL: 'https://api.internal.styx.example' })).toBe(
      'https://api.internal.styx.example',
    );
  });

  it('should fall back to localhost by default', () => {
    expect(resolveApiBaseUrl({})).toBe('http://localhost:3000');
  });
});
