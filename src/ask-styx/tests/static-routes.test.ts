import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

describe('Ask Styx Static Pages & Route Provisioning', () => {
  const currentDir = path.dirname(fileURLToPath(import.meta.url));
  const publicDir = path.resolve(currentDir, '../public');

  it('provisions favicon.svg to prevent 404 on browser icon requests', () => {
    const faviconPath = path.join(publicDir, 'favicon.svg');
    expect(fs.existsSync(faviconPath)).toBe(true);
    const content = fs.readFileSync(faviconPath, 'utf8');
    expect(content).toContain('<svg');
    expect(content).toContain('</svg>');
  });

  it('provisions launch/index.html to serve the launch waitlist & prototype explorer', () => {
    const launchPath = path.join(publicDir, 'launch/index.html');
    expect(fs.existsSync(launchPath)).toBe(true);
    const content = fs.readFileSync(launchPath, 'utf8');
    expect(content).toContain('The Blockchain of Truth');
    expect(content).toContain('Request Prototype Access');
    // Ensure Gate 04 compliance (no gambling words)
    expect(content.toLowerCase()).not.toContain('betting');
    expect(content.toLowerCase()).not.toContain('wager');
  });

  it('provisions ask-styx/index.html for route compatibility', () => {
    const askStyxPath = path.join(publicDir, 'ask-styx/index.html');
    expect(fs.existsSync(askStyxPath)).toBe(true);
    const content = fs.readFileSync(askStyxPath, 'utf8');
    expect(content).toContain('Redirecting to Ask Styx');
  });

  it('provisions 404.html for GitHub Pages fallback & SPA routing', () => {
    const fallbackPath = path.join(publicDir, '404.html');
    expect(fs.existsSync(fallbackPath)).toBe(true);
    const content = fs.readFileSync(fallbackPath, 'utf8');
    expect(content).toContain('Route Not Found');
  });
});
