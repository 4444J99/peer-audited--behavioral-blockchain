import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../..');
const OUT = path.join(repoRoot, 'docs/demo/assets');

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

// Navigate to the web server — if it's down, we get a connection error page
try {
  await page.goto('http://127.0.0.1:4311/tour', { timeout: 5000, waitUntil: 'domcontentloaded' });
  // If we get here, the server is up — take screenshot of current state as "before"
  // (This is the broken state if the server shows an error)
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(OUT, 'before-fixed-state.png'), fullPage: false });
  console.log('✓ Before screenshot captured (server responded)');
} catch (e) {
  // Server is down — capture the error page
  await page.screenshot({ path: path.join(OUT, 'before-fixed-state.png'), fullPage: false });
  console.log('✓ Before screenshot captured (server down / error state)');
}

await browser.close();
