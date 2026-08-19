import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../..');
const OUT = path.join(repoRoot, 'docs/demo/assets');

const BASE = process.env.STYX_WEB_URL || 'http://127.0.0.1:4311';

const browser = await chromium.launch();
const viewports = [
  { name: 'desktop-1440', width: 1440, height: 900 },
  { name: 'laptop-1280', width: 1280, height: 800 },
  { name: 'mobile-390', width: 390, height: 844 },
];

const pages = [
  { path: '/tour', name: 'tour' },
  { path: '/', name: 'landing' },
  { path: '/circles', name: 'circles' },
  { path: '/login', name: 'login' },
  { path: '/fury', name: 'fury' },
  { path: '/contracts/new', name: 'contracts-new' },
  { path: '/wallet', name: 'wallet' },
  { path: '/practitioner', name: 'practitioner' },
  { path: '/hr', name: 'hr' },
  { path: '/admin', name: 'admin' },
];

for (const vp of viewports) {
  const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
  for (const pg of pages) {
    const page = await context.newPage();
    try {
      await page.goto(`${BASE}${pg.path}`, { waitUntil: 'networkidle', timeout: 15000 });
      await page.waitForTimeout(1000);
      const filename = path.join(OUT, `${pg.name}-${vp.name}.png`);
      await page.screenshot({ path: filename, fullPage: true });
      console.log(`✓ ${pg.name} @ ${vp.name}`);
    } catch (e) {
      console.log(`✗ ${pg.name} @ ${vp.name}: ${e.message.slice(0, 80)}`);
    }
    await page.close();
  }
  await context.close();
}
await browser.close();
console.log('Done.');
