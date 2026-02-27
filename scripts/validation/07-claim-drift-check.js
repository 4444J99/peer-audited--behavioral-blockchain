#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '../..');
const matrixPath = path.join(repoRoot, 'docs/planning/implementation-status.md');

if (!fs.existsSync(matrixPath)) {
  console.error(`Claim drift check failed: missing ${matrixPath}`);
  process.exit(1);
}

const content = fs.readFileSync(matrixPath, 'utf8');
const codeFenceStripped = content.replace(/```[\s\S]*?```/g, '');
const inlineCodeMatches = [...codeFenceStripped.matchAll(/`([^`]+)`/g)].map((m) => m[1]);

const candidatePaths = [...new Set(
  inlineCodeMatches.filter((token) => token.startsWith('/') && token.includes('/'))
)];

const missing = [];
for (const token of candidatePaths) {
  // Only validate repo file references, not API routes like /compliance/eligibility.
  if (!token.startsWith('/src/') && !token.startsWith('/docs/') && token !== '/.env.example') {
    continue;
  }
  const fsPath = path.join(repoRoot, token.slice(1));
  if (!fs.existsSync(fsPath)) {
    missing.push({ token, fsPath });
  }
}

if (missing.length > 0) {
  console.error('Claim drift check failed: referenced file paths not found in docs/planning/implementation-status.md');
  for (const item of missing) {
    console.error(`- ${item.token} -> ${item.fsPath}`);
  }
  process.exit(1);
}

console.log(`Claim drift check passed (${candidatePaths.length} inline code references scanned).`);
