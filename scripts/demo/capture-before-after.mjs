import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../..');
const OUT = path.join(repoRoot, 'docs/demo/assets');

const browser = await chromium.launch();

// === BEFORE: unauthenticated state (what users see without demo fix) ===
const beforePage = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await beforePage.goto('http://127.0.0.1:4311/login', { waitUntil: 'networkidle', timeout: 10000 });
await beforePage.waitForTimeout(1000);
await beforePage.screenshot({ path: path.join(OUT, 'before-login-page.png'), fullPage: false });
console.log('✓ Before screenshot: login page (unauthenticated)');
await beforePage.close();

// === AFTER: authenticated tour with guided overlay ===
const afterPage = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await afterPage.goto('http://127.0.0.1:4311/tour', { waitUntil: 'networkidle', timeout: 10000 });
await afterPage.waitForTimeout(2000);
await afterPage.screenshot({ path: path.join(OUT, 'after-tour-with-overlay.png'), fullPage: false });
console.log('✓ After screenshot: tour page with guided tour overlay');

// === AFTER: dashboard (authenticated) ===
// Seed auth cookie for dashboard
await afterPage.context().addCookies([{
  name: 'styx-session',
  value: 'eyJhbGciOiJIUzI1NiJ9.eyJ1c2VySWQiOiJ1c19yaXZlciIsImVtYWlsIjoicml2ZXJAZGVtby5zdHl4LnByb3RvY29sIiwicm9sZSI6IlVTRVIifQ.test', // allow-secret: e2e test mock
  domain: '127.0.0.1',
  path: '/',
}]);
await afterPage.goto('http://127.0.0.1:4311/dashboard', { waitUntil: 'networkidle', timeout: 10000 });
await afterPage.waitForTimeout(2000);
await afterPage.screenshot({ path: path.join(OUT, 'after-dashboard.png'), fullPage: false });
console.log('✓ After screenshot: dashboard (authenticated)');
await afterPage.close();

await browser.close();
console.log('\nAll before/after screenshots saved to docs/demo/assets/');
