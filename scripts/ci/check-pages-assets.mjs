import { readFileSync, existsSync, statSync } from 'node:fs';
import { resolve, dirname, relative } from 'node:path';
import { pathToFileURL } from 'node:url';

/** Validate the assembled Pages artifact, not a guessed list of hashed filenames. */
export function checkPagesAssets(root) {
  root = resolve(root);
  const prefix = '/peer-audited--behavioral-blockchain/';
  let count = 0;
  for (const page of ['index.html', 'ask-styx/index.html']) {
    const html = readFileSync(resolve(root, page), 'utf8');
    const tags = [...html.matchAll(/<(?:script|link)\b[^>]*>/gi)].map(m => m[0]);
    let scripts = 0;
    for (const tag of tags) {
      const isScript = /^<script\b/i.test(tag);
      if (!isScript && !/\brel\s*=\s*["']stylesheet["']/i.test(tag)) continue;
      const match = tag.match(/\b(?:src|href)\s*=\s*["']([^"']+)["']/i);
      if (!match) continue;
      const url = new URL(match[1], `https://pages.invalid${prefix}${page}`);
      if (url.origin !== 'https://pages.invalid') continue;
      if (!url.pathname.startsWith(prefix)) throw new Error(`${page}: asset escapes project base: ${match[1]}`);
      if (page.startsWith('ask-styx/') && !url.pathname.startsWith(`${prefix}ask-styx/`)) {
        throw new Error(`${page}: asset is not under Ask Styx deployment subpath: ${match[1]}`);
      }
      const path = resolve(root, decodeURIComponent(url.pathname.slice(prefix.length)));
      if (relative(root, path).startsWith('..') || !existsSync(path) || !statSync(path).isFile()) {
        throw new Error(`${page}: missing local asset ${match[1]}`);
      }
      if (isScript) scripts++;
      count++;
    }
    if (!scripts) throw new Error(`${page}: no local executable bundle was checked`);
  }
  return { pages: 2, localAssetsChecked: count };
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try { console.log(JSON.stringify(checkPagesAssets(process.argv[2] || '_site'))); }
  catch (error) { console.error(error.message); process.exitCode = 1; }
}
