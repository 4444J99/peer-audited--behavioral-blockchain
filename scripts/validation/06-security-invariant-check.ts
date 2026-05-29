/**
 * Validation Gate 06: Security Invariant Check
 *
 * Verifies that no development tokens, hardcoded secrets, or debug
 * backdoors exist in compiled production output.
 *
 * Excludes test files (.spec.*, .test.*) since they may contain
 * patterns for regression testing.
 */

import { existsSync, readFileSync, readdirSync, statSync } from 'fs';
import { join, extname, resolve, dirname, basename } from 'path';
import { fileURLToPath } from 'url';

// Resolve repo root from this script's location (scripts/validation/)
const __filename_resolved = typeof __filename !== 'undefined' ? __filename : fileURLToPath(import.meta.url);
const REPO_ROOT = resolve(dirname(__filename_resolved), '../..');

interface ForbiddenPattern {
  pattern: RegExp;
  label: string;
  severity: 'error' | 'warn';
}

const FORBIDDEN_PATTERNS: ForbiddenPattern[] = [
  // Dev mock tokens that should never ship
  { pattern: /dev-mock-jwt-token-alpha-omega/g, label: 'DEV_MOCK_TOKEN', severity: 'error' },
  { pattern: /d0000000-0000-0000-0000-000000000001/g, label: 'DEV_MOCK_USER_ID', severity: 'error' },

  // Debug backdoors
  { pattern: /NODE_ENV\s*!==\s*['"]production['"]\s*&&\s*token\s*===/, label: 'DEV_TOKEN_BYPASS', severity: 'error' },

  // Hardcoded default secrets — these must never be a runtime fallback.
  { pattern: /styx-dev-secret-do-not-use-in-production/g, label: 'HARDCODED_JWT_SECRET', severity: 'error' },
  { pattern: /styx-webhook-dev-secret/g, label: 'HARDCODED_WEBHOOK_SECRET', severity: 'error' },
  { pattern: /styx-default-secret/g, label: 'HARDCODED_APP_SECRET', severity: 'error' },
  { pattern: /styx-anon-salt-v1/g, label: 'HARDCODED_ANON_SALT', severity: 'error' },
  { pattern: /do-not-use-in-production/g, label: 'HARDCODED_DEV_SECRET', severity: 'error' },

  // Known test-only secrets — warn but don't fail (env fallbacks are acceptable)
  { pattern: /sk_test_mock_key/g, label: 'STRIPE_TEST_KEY (env fallback)', severity: 'warn' },
];

const SCAN_DIRS = [
  join(REPO_ROOT, 'src/api/dist'),
  join(REPO_ROOT, 'src/web/.next'),
];

const BUILD_SCAN_EXTENSIONS = new Set(['.js', '.mjs', '.cjs', '.jsx', '.json']);
const SOURCE_SCAN_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.mjs', '.cjs', '.jsx']);

function isTestFile(filePath: string): boolean {
  const name = basename(filePath);
  return /\.(spec|test)\.(js|ts|mjs|cjs|jsx|tsx)$/.test(name);
}

function collectFiles(dir: string, extensions: Set<string>): string[] {
  const files: string[] = [];
  try {
    const entries = readdirSync(dir);
    for (const entry of entries) {
      const full = join(dir, entry);
      try {
        const stat = statSync(full);
        if (stat.isDirectory()) {
          files.push(...collectFiles(full, extensions));
        } else if (extensions.has(extname(full)) && !isTestFile(full)) {
          files.push(full);
        }
      } catch {
        // Skip unreadable files
      }
    }
  } catch {
    // Directory doesn't exist (not built yet) — that's fine
  }
  return files;
}

function runSecurityInvariantCheck() {
  console.log('\n--- STARTING VALIDATION GATE 06: SECURITY INVARIANT CHECK ---\n');

  const errors: { file: string; label: string; line: number }[] = [];
  const warnings: { file: string; label: string; line: number }[] = [];
  let filesScanned = 0;
  const missingScanDirs: string[] = [];
  const emptyScanDirs: string[] = [];

  for (const dir of SCAN_DIRS) {
    if (!existsSync(dir)) {
      missingScanDirs.push(dir);
      continue;
    }

    const files = collectFiles(dir, BUILD_SCAN_EXTENSIONS);
    if (files.length === 0) {
      emptyScanDirs.push(dir);
    }
    for (const file of files) {
      filesScanned++;
      try {
        const content = readFileSync(file, 'utf-8');
        const lines = content.split('\n');

        for (const { pattern, label, severity } of FORBIDDEN_PATTERNS) {
          // Reset regex state
          pattern.lastIndex = 0;
          for (let i = 0; i < lines.length; i++) {
            if (pattern.test(lines[i])) {
              const entry = { file, label, line: i + 1 };
              if (severity === 'error') errors.push(entry);
              else warnings.push(entry);
            }
            pattern.lastIndex = 0;
          }
        }
      } catch {
        // Skip unreadable files
      }
    }
  }

  // Also scan source guard files (non-test) for the most critical patterns.
  // Guards live in several locations; scan all of them, not just one.
  const sourceGuardsDirs = [
    join(REPO_ROOT, 'src/api/guards'),
    join(REPO_ROOT, 'src/api/src/guards'),
    join(REPO_ROOT, 'src/api/src/common/guards'),
  ];
  const existingGuardsDirs = sourceGuardsDirs.filter((d) => existsSync(d));
  const sourceFiles = existingGuardsDirs.flatMap((d) => collectFiles(d, SOURCE_SCAN_EXTENSIONS));
  for (const file of sourceFiles) {
    if (isTestFile(file)) continue;
    filesScanned++;
    try {
      const content = readFileSync(file, 'utf-8');
      if (/DEV_MOCK_TOKEN/.test(content) || /dev-mock-jwt-token/.test(content)) {
        errors.push({ file, label: 'DEV_MOCK_TOKEN in guard source', line: 0 });
      }
    } catch {
      // Skip
    }
  }

  console.log(`Scanned ${filesScanned} files across ${SCAN_DIRS.length} build directories + source guards.`);

  // All build dirs missing = "not built in this context" (e.g. PR-stage beta
  // readiness, which never builds) — that is not-applicable, not a violation,
  // and is handled as a clean skip (exit 2) below. Only a PARTIAL build (some
  // output present, some missing) is a real anomaly worth failing on here.
  const allBuildDirsMissing = missingScanDirs.length === SCAN_DIRS.length;
  if (missingScanDirs.length > 0 && !allBuildDirsMissing) {
    errors.push({
      file: 'validation',
      label: `MISSING_SCAN_DIRS (${missingScanDirs.join(', ')})`,
      line: 0,
    });
  }

  if (emptyScanDirs.length > 0) {
    warnings.push({
      file: 'validation',
      label: `EMPTY_SCAN_DIRS (${emptyScanDirs.join(', ')})`,
      line: 0,
    });
  }

  if (sourceFiles.length === 0 && existingGuardsDirs.length > 0) {
    errors.push({
      file: existingGuardsDirs.join(', '),
      label: 'SOURCE_GUARDS_NOT_SCANNED',
      line: 0,
    });
  }

  if (filesScanned === 0) {
    errors.push({
      file: 'validation',
      label: 'NO_FILES_SCANNED',
      line: 0,
    });
  }

  if (warnings.length > 0) {
    console.warn(`\n⚠️  ${warnings.length} warning(s):`);
    for (const w of warnings) {
      console.warn(`  ⚠️  ${w.label} in ${w.file}:${w.line}`);
    }
  }

  if (errors.length > 0) {
    console.error(`\n❌ GATE 06 FAILED: ${errors.length} security violation(s) found:\n`);
    for (const v of errors) {
      console.error(`  🚨 ${v.label} in ${v.file}:${v.line}`);
    }
    process.exit(1);
  }

  // No violations. If there was simply no build output to scan (no build in
  // this context), exit 2 = "skipped / not verified" so suite wrappers like
  // scripts/smoke/beta-readiness.sh treat it as a clean skip rather than a red.
  // A post-build invocation (the blocking build_and_test_matrix gate) always
  // has the dirs present, so it still exits 0 and enforces the scan on shipped
  // output — security coverage there is unchanged.
  if (allBuildDirsMissing) {
    const rel = SCAN_DIRS.map((d) => d.replace(`${REPO_ROOT}/`, '')).join(', ');
    console.log(`\n⏭️  GATE 06 SKIPPED: no build output present to scan (${rel}). Run after a build to enforce.`);
    process.exit(2);
  }

  console.log('\n✅ GATE 06 PASSED: No dev tokens or debug backdoors found in production output.');
}

runSecurityInvariantCheck();

export default runSecurityInvariantCheck;
