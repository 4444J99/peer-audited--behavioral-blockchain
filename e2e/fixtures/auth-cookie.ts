import { Page } from '@playwright/test';

function resolveE2EBaseUrl(): string {
  const rawUrl =
    process.env.E2E_BASE_URL ||
    process.env.STYX_WEB_PUBLIC_URL ||
    process.env.NEXT_PUBLIC_WEB_URL ||
    'http://localhost:3001';

  return new URL(rawUrl).origin;
}

export async function seedAuthCookie(page: Page, token = 'jwt-e2e-test-token') {
  await page.context().addCookies([
    {
      name: 'styx_auth_token',
      value: token,
      url: resolveE2EBaseUrl(),
    },
  ]);
}
