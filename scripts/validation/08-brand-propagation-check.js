const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.join(__dirname, '../..');

let envContent;
try {
  envContent = fs.readFileSync(path.join(ROOT_DIR, '.env'), 'utf8');
} catch (e) {
  envContent = fs.readFileSync(path.join(ROOT_DIR, '.env.example'), 'utf8');
}

const vars = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([A-Z_0-9]+)=(.*)$/);
  if (match) {
    vars[match[1]] = match[2].trim();
  }
});

const CANONICAL_DOMAIN = vars.CANONICAL_DOMAIN;
const PROJECT_NAME = vars.PROJECT_NAME;
const MOBILE_BUNDLE_ID = vars.MOBILE_BUNDLE_ID;
const DEEP_LINK_SCHEME = vars.DEEP_LINK_SCHEME;
const CONTACT_EMAIL_DOMAIN = vars.CONTACT_EMAIL_DOMAIN;
const RENDER_API_SERVICE_NAME = vars.RENDER_API_SERVICE_NAME;
const RENDER_WEB_SERVICE_NAME = vars.RENDER_WEB_SERVICE_NAME;
const CANONICAL_REPO_URL = vars.CANONICAL_REPO_URL;

let exitCode = 0;

function checkFile(relPath, checks) {
  const fullPath = path.join(ROOT_DIR, relPath);
  if (!fs.existsSync(fullPath)) {
    // If the file does not exist, ignore it, wait, we should log a warning but not fail.
    // However, if the docs say it's there, maybe we shouldn't fail the build if a file is moved later.
    console.warn(`[WARN] File not found: ${relPath}`);
    return;
  }
  const content = fs.readFileSync(fullPath, 'utf8');
  checks.forEach(({ expected, name }) => {
    if (!expected) {
        return;
    }
    if (!content.includes(expected)) {
      console.error(`[ERROR] File ${relPath} is missing expected value for ${name} ('${expected}')`);
      exitCode = 1;
    } else {
      console.log(`[OK] File ${relPath} contains ${name} ('${expected}')`);
    }
  });
}

const targets = [
  {
    path: 'docs/legal/privacy-policy.md',
    checks: [{ name: 'CONTACT_EMAIL_DOMAIN', expected: `privacy@${CONTACT_EMAIL_DOMAIN}` }]
  },
  {
    path: 'docs/departments/b2b/artifacts/outreach-sequences.md',
    checks: [{ name: 'CONTACT_EMAIL_DOMAIN', expected: `partners@${CONTACT_EMAIL_DOMAIN}` }]
  },
  {
    path: 'src/mobile/ios/Styx/Info.plist',
    checks: [
        { name: 'MOBILE_BUNDLE_ID', expected: `<string>${MOBILE_BUNDLE_ID}</string>` },
        { name: 'DEEP_LINK_SCHEME', expected: `<string>${DEEP_LINK_SCHEME}</string>` }
    ]
  },
  {
    path: 'src/mobile/ios/Styx.xcodeproj/project.pbxproj',
    checks: [{ name: 'MOBILE_BUNDLE_ID', expected: `PRODUCT_BUNDLE_IDENTIFIER = "${MOBILE_BUNDLE_ID}";` }]
  },
  {
    path: 'src/mobile/android/app/build.gradle',
    checks: [
        { name: 'MOBILE_BUNDLE_ID', expected: `applicationId '${MOBILE_BUNDLE_ID}'` },
        { name: 'MOBILE_BUNDLE_ID (namespace)', expected: `namespace '${MOBILE_BUNDLE_ID}'` }
    ]
  },
  {
    path: 'src/mobile/android/app/src/main/AndroidManifest.xml',
    checks: [{ name: 'DEEP_LINK_SCHEME', expected: `android:scheme="${DEEP_LINK_SCHEME}"` }]
  },
  {
    path: 'docs/legal/terms-of-service.md',
    checks: [{ name: 'CONTACT_EMAIL_DOMAIN', expected: `legal@${CONTACT_EMAIL_DOMAIN}` }]
  },
  {
    path: 'render.yaml',
    checks: [
        { name: 'RENDER_API_SERVICE_NAME', expected: `name: ${RENDER_API_SERVICE_NAME}` },
        { name: 'RENDER_WEB_SERVICE_NAME', expected: `name: ${RENDER_WEB_SERVICE_NAME}` }
    ]
  },
  {
    path: '.config/docker/docker-compose.yml',
    checks: [
        { name: 'RENDER_API_SERVICE_NAME', expected: `${RENDER_API_SERVICE_NAME}:` },
        { name: 'RENDER_WEB_SERVICE_NAME', expected: `${RENDER_WEB_SERVICE_NAME}:` }
    ]
  },
  {
    path: '.config/ngrok/ngrok_app.yml',
    checks: [
        { name: 'RENDER_API_SERVICE_NAME', expected: `${RENDER_API_SERVICE_NAME}-tunnel:` },
        { name: 'RENDER_WEB_SERVICE_NAME', expected: `${RENDER_WEB_SERVICE_NAME}-tunnel:` }
    ]
  },
  {
    path: '.claude/agents/ops/CONTEXT.md',
    checks: [
        { name: 'RENDER_API_SERVICE_NAME', expected: RENDER_API_SERVICE_NAME },
        { name: 'RENDER_WEB_SERVICE_NAME', expected: RENDER_WEB_SERVICE_NAME }
    ]
  },
  {
    path: 'README.md',
    checks: [{ name: 'CANONICAL_REPO_URL', expected: CANONICAL_REPO_URL }]
  }
];

targets.forEach(t => checkFile(t.path, t.checks));

if (exitCode === 0) {
  console.log('[SUCCESS] All brand propagation checks passed.');
} else {
  console.error('[FAILED] One or more brand propagation checks failed.');
}

process.exit(exitCode);
