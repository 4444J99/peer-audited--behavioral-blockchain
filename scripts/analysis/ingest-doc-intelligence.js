#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { spawnSync } = require('child_process');

const REPO_ROOT = path.resolve(__dirname, '..', '..');
const TARGET_DIRS = [
  'docs/research',
  'docs/planning',
  'docs/legal',
  'docs/brainstorm',
].map((relativePath) => path.join(REPO_ROOT, relativePath));

const RUN_DATE = new Date().toISOString().slice(0, 10);
const ARTIFACT_DIR = path.join(REPO_ROOT, 'artifacts', 'doc-intelligence', RUN_DATE);
const LINE_REGISTRY_PATH = path.join(ARTIFACT_DIR, 'full-line-registry.jsonl');
const ELEMENT_REGISTRY_PATH = path.join(ARTIFACT_DIR, 'element-registry.json');
const INGEST_REPORT_PATH = path.join(REPO_ROOT, 'docs/planning/planning--doc-ingest-register.md');
const UNITY_REPORT_PATH = path.join(
  REPO_ROOT,
  `docs/planning/planning--unity-contention-register--${RUN_DATE}.md`,
);
const DRIFT_REPORT_PATH = path.join(
  REPO_ROOT,
  `docs/planning/planning--drift-check--${RUN_DATE}.md`,
);
const WORKLOG_PATH = path.join(
  REPO_ROOT,
  `docs/planning/planning--implementation-worklog--${RUN_DATE}.md`,
);
const RESEARCH_TICKET_PACK_MD_PATH = path.join(
  REPO_ROOT,
  `docs/planning/planning--research-ticket-pack--${RUN_DATE}.md`,
);
const RESEARCH_TICKET_PACK_JSON_PATH = path.join(
  REPO_ROOT,
  `docs/planning/planning--research-ticket-pack--${RUN_DATE}.json`,
);

const GENERATED_REPORT_PATH_RE = /docs\/planning\/planning--(doc-ingest-register|drift-check--\d{4}-\d{2}-\d{2}|unity-contention-register--\d{4}-\d{2}-\d{2}|implementation-worklog--\d{4}-\d{2}-\d{2})\.md$/;

const TOPIC_PATTERNS = [
  {
    topic: 'COHORTS_PODS',
    patterns: [/\bcohort\b/i, /\bpod\b/i, /\broster\b/i, /\bactive\b/i, /\bout\b/i],
  },
  {
    topic: 'PRICING_STAKES',
    patterns: [/\bpricing\b/i, /\bentry fee\b/i, /\bstake\b/i, /\bplatform fee\b/i, /\$\d+/],
  },
  {
    topic: 'VERIFICATION_ORACLES',
    patterns: [/\bhealthkit\b/i, /\bwhoop\b/i, /\battestation\b/i, /\bdigital exhaust\b/i],
  },
  {
    topic: 'LEGAL_COMPLIANCE',
    patterns: [/\blegal\b/i, /\bcompliance\b/i, /\bgeofence\b/i, /\bage\b/i, /\bprivacy\b/i],
  },
  {
    topic: 'GROWTH_B2B',
    patterns: [/\bb2b\b/i, /\benterprise\b/i, /\bcrm\b/i, /\brevenue\b/i, /\bmarket\b/i],
  },
  {
    topic: 'PSYCHOLOGY_BEHAVIORAL',
    patterns: [/\bloss aversion\b/i, /\bstreak\b/i, /\bmotivation\b/i, /\bhabit\b/i],
  },
];

function runCommand(cmd, args, cwd = REPO_ROOT) {
  const result = spawnSync(cmd, args, {
    cwd,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  });

  if (result.error) {
    return { ok: false, stdout: '', stderr: String(result.error) };
  }

  if (result.status !== 0) {
    return {
      ok: false,
      stdout: result.stdout || '',
      stderr: result.stderr || '',
    };
  }

  return {
    ok: true,
    stdout: result.stdout || '',
    stderr: result.stderr || '',
  };
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function hashFile(filePath) {
  const hasher = crypto.createHash('sha256');
  const data = fs.readFileSync(filePath);
  hasher.update(data);
  return hasher.digest('hex');
}

function listFilesRecursive(startPath) {
  const out = [];
  const stack = [startPath];

  while (stack.length > 0) {
    const current = stack.pop();
    if (!current) continue;
    if (!fs.existsSync(current)) continue;
    const stat = fs.statSync(current);
    if (stat.isDirectory()) {
      const entries = fs.readdirSync(current).sort();
      for (let i = entries.length - 1; i >= 0; i -= 1) {
        stack.push(path.join(current, entries[i]));
      }
    } else if (stat.isFile()) {
      if (path.basename(current) === '.DS_Store') {
        continue;
      }
      out.push(current);
    }
  }

  return out.sort();
}

function extractPdfText(filePath) {
  const pdftotext = runCommand('pdftotext', ['-layout', '-enc', 'UTF-8', filePath, '-']);
  if (!pdftotext.ok) {
    return { text: '', method: 'pdf_metadata_only' };
  }
  return { text: pdftotext.stdout, method: 'pdf_pdftotext' };
}

function stripHtml(raw) {
  return raw
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/[ \t]{2,}/g, ' ');
}

function extractEpubText(filePath) {
  const list = runCommand('unzip', ['-Z1', filePath]);
  if (!list.ok) {
    return { text: '', method: 'epub_metadata_only' };
  }

  const entries = list.stdout
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((entry) => /\.(xhtml|html|htm|opf|ncx|xml)$/i.test(entry));

  if (entries.length === 0) {
    return { text: '', method: 'epub_no_text_entries' };
  }

  let aggregate = '';
  for (const entry of entries) {
    const text = runCommand('unzip', ['-p', filePath, entry]);
    if (text.ok && text.stdout) {
      aggregate += `\n\n${stripHtml(text.stdout)}`;
    }
  }

  if (!aggregate.trim()) {
    return { text: '', method: 'epub_entries_unreadable' };
  }

  return { text: aggregate, method: 'epub_unzip_html' };
}

function extractAzw3Text(filePath) {
  const text = runCommand('strings', ['-a', '-n', '4', filePath]);
  if (!text.ok) {
    return { text: '', method: 'azw3_metadata_only' };
  }
  return { text: text.stdout, method: 'azw3_strings' };
}

function extractTextByType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.md' || ext === '.txt') {
    return { text: fs.readFileSync(filePath, 'utf8'), method: 'native_text' };
  }
  if (ext === '.pdf') {
    return extractPdfText(filePath);
  }
  if (ext === '.epub') {
    return extractEpubText(filePath);
  }
  if (ext === '.azw3') {
    return extractAzw3Text(filePath);
  }

  const stringsFallback = runCommand('strings', ['-a', '-n', '4', filePath]);
  if (stringsFallback.ok && stringsFallback.stdout.trim()) {
    return { text: stringsFallback.stdout, method: 'strings_fallback' };
  }

  return { text: '', method: 'metadata_only' };
}

function classifyTopic(text) {
  for (const bucket of TOPIC_PATTERNS) {
    for (const pattern of bucket.patterns) {
      if (pattern.test(text)) {
        return bucket.topic;
      }
    }
  }
  return 'GENERAL';
}

function classifyStatusHint(text) {
  if (/\bnot started\b/i.test(text) || /\bdefer(red)?\b/i.test(text) || /\bplanned\b/i.test(text)) {
    return 'PLANNED';
  }
  if (/\bpartial\b/i.test(text) || /\bstub\b/i.test(text) || /\bin progress\b/i.test(text)) {
    return 'PARTIAL';
  }
  if (/\bimplemented\b/i.test(text) || /\bcomplete(d)?\b/i.test(text) || /\[x\]/i.test(text)) {
    return 'IMPLEMENTED';
  }
  return 'UNSPECIFIED';
}

function isElementLine(line) {
  const trimmed = line.trim();
  if (!trimmed) return false;
  if (/^#{1,6}\s+/.test(trimmed)) return true;
  if (/^[-*]\s+\[[ xX]\]\s+/.test(trimmed)) return true;
  if (/^[-*]\s+/.test(trimmed)) return true;
  if (/^\d+\.\s+/.test(trimmed)) return true;
  if (/\|/.test(trimmed) && trimmed.split('|').length >= 3) return true;
  if (
    /\b(must|should|required|critical|blocker|objective|goal|task|micro-task|phase|launch|implement|enforce|cap|limit)\b/i.test(
      trimmed,
    )
  ) {
    return true;
  }
  return false;
}

function getGitMeta(filePath) {
  const rel = path.relative(REPO_ROOT, filePath);
  const first = runCommand('git', [
    'log',
    '--diff-filter=A',
    '--follow',
    '--format=%ad|%h',
    '--date=short',
    '--',
    rel,
  ]);
  const last = runCommand('git', ['log', '-1', '--format=%ad|%h', '--date=short', '--', rel]);

  const firstLine = first.ok ? first.stdout.trim().split('\n').filter(Boolean).pop() || '' : '';
  const lastLine = last.ok ? last.stdout.trim().split('\n')[0] || '' : '';

  const [firstDate = '', firstCommit = ''] = firstLine.split('|');
  const [lastDate = '', lastCommit = ''] = lastLine.split('|');

  return {
    firstDate: firstDate || 'unknown',
    firstCommit: firstCommit || 'unknown',
    lastDate: lastDate || 'unknown',
    lastCommit: lastCommit || 'unknown',
  };
}

function safeAliasFromEmail(email) {
  if (!email || typeof email !== 'string') return 'Anonymous';
  const local = email.split('@')[0] || '';
  const first = local.split(/[._-]/)[0] || local;
  const cleaned = first.replace(/[^a-zA-Z]/g, '');
  if (!cleaned) return 'Anonymous';
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1).toLowerCase();
}

function codeSearch(pattern, dirs) {
  const args = [
    '-n',
    '--pcre2',
    '-g',
    '*.ts',
    '-g',
    '*.tsx',
    '-g',
    '*.sql',
    '-g',
    '*.js',
    '-g',
    '*.jsx',
    '-g',
    '*.mjs',
    '-g',
    '*.cjs',
    '-g',
    '!**/*.spec.ts',
    '-g',
    '!**/*.spec.tsx',
    '-g',
    '!**/*.test.ts',
    '-g',
    '!**/*.test.tsx',
    '-g',
    '!**/package-lock.json',
    '-g',
    '!**/Gemfile.lock',
    pattern,
    ...dirs,
  ];
  const result = runCommand('rg', args);
  return {
    matched: result.ok && result.stdout.trim().length > 0,
    evidence: result.ok ? result.stdout.trim().split('\n').slice(0, 8) : [],
  };
}

function writeFileAtomic(filePath, content) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, content, 'utf8');
}

function main() {
  ensureDir(ARTIFACT_DIR);
  const files = TARGET_DIRS
    .flatMap((dir) => listFilesRecursive(dir))
    .filter((filePath) => !GENERATED_REPORT_PATH_RE.test(path.relative(REPO_ROOT, filePath)))
    .sort();
  const lineStream = fs.createWriteStream(LINE_REGISTRY_PATH, { encoding: 'utf8' });

  /** @type {Array<{
   * id: string;
   * file: string;
   * line: number;
   * text: string;
   * topic: string;
   * statusHint: string;
   * type: string;
   * }>} */
  const elements = [];

  /** @type {Array<any>} */
  const fileSummaries = [];

  let elementCounter = 0;
  const topicToFiles = new Map();
  const topicStatuses = new Map();
  const podSizeMentions = new Set();
  const cohortCapMentions = new Set();
  const pricingMentions = new Set();

  for (const filePath of files) {
    const relPath = path.relative(REPO_ROOT, filePath);
    const stat = fs.statSync(filePath);
    const hash = hashFile(filePath);
    const gitMeta = getGitMeta(filePath);
    const extracted = extractTextByType(filePath);
    const text = extracted.text || '';
    const lines = text.split('\n');
    const nonEmptyLines = lines.filter((line) => line.trim().length > 0).length;
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;

    const fileTopics = new Set();
    let extractedElements = 0;

    lines.forEach((line, index) => {
      const normalized = line.replace(/\s+/g, ' ').trim();
      if (!normalized) return;

      const topic = classifyTopic(normalized);
      fileTopics.add(topic);

      if (!topicToFiles.has(topic)) topicToFiles.set(topic, new Set());
      topicToFiles.get(topic).add(relPath);

      if (!topicStatuses.has(topic)) topicStatuses.set(topic, new Set());
      topicStatuses.get(topic).add(classifyStatusHint(normalized));

      if (isElementLine(normalized)) {
        elementCounter += 1;
        const id = `EL-${String(elementCounter).padStart(6, '0')}`;
        const statusHint = classifyStatusHint(normalized);
        let type = 'statement';
        if (/^#{1,6}\s+/.test(normalized)) type = 'heading';
        else if (/^[-*]\s+\[[ xX]\]\s+/.test(normalized)) type = 'checklist';
        else if (/^[-*]\s+/.test(normalized) || /^\d+\.\s+/.test(normalized)) type = 'bullet';
        else if (normalized.includes('|')) type = 'table_row';

        elements.push({
          id,
          file: relPath,
          line: index + 1,
          text: normalized,
          topic,
          statusHint,
          type,
        });
        extractedElements += 1;
      }

      if (/max(?:imum)?(?:\s+of)?\s+(\d+)\s+people\s+per\s+pod/i.test(normalized)) {
        const m = normalized.match(/max(?:imum)?(?:\s+of)?\s+(\d+)\s+people\s+per\s+pod/i);
        if (m?.[1]) podSizeMentions.add(m[1]);
      }
      if (/\bmax(?:imum)?\s+(?:cohort|participants?)\b/i.test(normalized) && /\b\d+\b/.test(normalized)) {
        const m = normalized.match(/\b(\d+)\b/);
        if (m?.[1]) cohortCapMentions.add(m[1]);
      }
      if (/\$39|\$30|\$9|\b39\b.*\bentry\b|\bentry\b.*\b39\b/i.test(normalized)) {
        const printableAscii = !/[^\x09\x0A\x0D\x20-\x7E]/.test(normalized);
        const hasNaturalLanguage = /[A-Za-z]{3,}/.test(normalized);
        if (printableAscii && hasNaturalLanguage && normalized.length <= 240) {
          pricingMentions.add(normalized);
        }
      }

      lineStream.write(
        `${JSON.stringify({
          file: relPath,
          line: index + 1,
          topic,
          text: normalized,
        })}\n`,
      );
    });

    fileSummaries.push({
      file: relPath,
      sizeBytes: stat.size,
      sha256: hash,
      extractionMethod: extracted.method,
      lines: lines.length,
      nonEmptyLines,
      words,
      extractedElements,
      firstDate: gitMeta.firstDate,
      firstCommit: gitMeta.firstCommit,
      lastDate: gitMeta.lastDate,
      lastCommit: gitMeta.lastCommit,
      topics: Array.from(fileTopics).sort(),
    });
  }

  lineStream.end();

  const unityPoints = [];
  for (const [topic, filesSet] of topicToFiles.entries()) {
    if (topic === 'GENERAL') {
      continue;
    }
    if (filesSet.size >= 3) {
      unityPoints.push({
        topic,
        supportingFiles: Array.from(filesSet).sort(),
        supportCount: filesSet.size,
      });
    }
  }
  unityPoints.sort((a, b) => b.supportCount - a.supportCount || a.topic.localeCompare(b.topic));

  const contentionPoints = [];
  for (const [topic, statuses] of topicStatuses.entries()) {
    const normalizedStatuses = Array.from(statuses).filter((s) => s !== 'UNSPECIFIED');
    if (new Set(normalizedStatuses).size > 1) {
      contentionPoints.push({
        topic,
        reason: `Mixed status signals: ${Array.from(new Set(normalizedStatuses)).sort().join(', ')}`,
      });
    }
  }

  if (podSizeMentions.size > 1) {
    contentionPoints.push({
      topic: 'COHORTS_PODS',
      reason: `Pod size mismatch across docs: ${Array.from(podSizeMentions).sort().join(', ')}`,
    });
  }
  if (cohortCapMentions.size > 1) {
    contentionPoints.push({
      topic: 'COHORTS_PODS',
      reason: `Cohort size cap mismatch across docs: ${Array.from(cohortCapMentions).sort().join(', ')}`,
    });
  }

  const driftChecks = [
    {
      id: 'DRIFT-COHORT-01',
      claim: 'Pod/cohort structures with participant visibility (Active/Out)',
      search: codeSearch('cohorts/:cohortId/snapshot|getCohortSnapshot|POD_BASED|maxPodSize|cohortId', [
        'src/api/src',
        'src/web',
        'src/mobile',
      ]),
      expected: 'Runtime API or UI support for cohorts/pods.',
    },
    {
      id: 'DRIFT-PRICING-01',
      claim: '$39 MVP model ($9 fee + $30 stake)',
      search: codeSearch(
        'MVP_39|totalEntryUsd|platformFeeUsd|refundableStakeUsd',
        ['src/api/src', 'src/api/services', 'src/shared', 'src/web', 'src/mobile'],
      ),
      expected: 'Explicit pricing constants and plan-level handling.',
    },
    {
      id: 'DRIFT-ORACLE-01',
      claim: 'Whoop SCORED state integration',
      search: codeSearch('whoop|SCORED', ['src/api', 'src/mobile', 'src/web']),
      expected: 'Webhook or ingestion logic for SCORED state.',
    },
    {
      id: 'DRIFT-ORACLE-02',
      claim: 'HealthKit manual-entry rejection (WasUserEntered)',
      search: codeSearch('HKMetadataKeyWasUserEntered|wasuserentered|healthkit', ['src/api', 'src/mobile']),
      expected: 'Native bridge checks for manual-entry exclusion.',
    },
  ].map((check) => ({
    ...check,
    status: check.search.matched ? 'EVIDENCE_FOUND' : 'NO_EVIDENCE_FOUND',
  }));

  const elementRegistry = {
    generatedAt: new Date().toISOString(),
    runDate: RUN_DATE,
    targets: TARGET_DIRS.map((abs) => path.relative(REPO_ROOT, abs)),
    fileCount: fileSummaries.length,
    elementCount: elements.length,
    files: fileSummaries,
    elements,
    unityPoints,
    contentionPoints,
    driftChecks,
  };

  writeFileAtomic(ELEMENT_REGISTRY_PATH, `${JSON.stringify(elementRegistry, null, 2)}\n`);

  const ingestLines = [];
  ingestLines.push('# Doc Ingest Register (Full Pass)');
  ingestLines.push('');
  ingestLines.push(`- **Run Date**: ${RUN_DATE}`);
  ingestLines.push(`- **Target Directories**: ${TARGET_DIRS.map((abs) => `\`${path.relative(REPO_ROOT, abs)}\``).join(', ')}`);
  ingestLines.push(`- **Files Processed**: ${fileSummaries.length}`);
  ingestLines.push(`- **Elements Extracted**: ${elements.length}`);
  ingestLines.push(`- **Line Registry Artifact**: \`${path.relative(REPO_ROOT, LINE_REGISTRY_PATH)}\``);
  ingestLines.push(`- **Element Registry Artifact**: \`${path.relative(REPO_ROOT, ELEMENT_REGISTRY_PATH)}\``);
  ingestLines.push('');
  ingestLines.push('## Per-File Inventory');
  ingestLines.push('');
  ingestLines.push('| File | First Added | Last Changed | Size (bytes) | Words | Extract Method | Elements |');
  ingestLines.push('|---|---|---|---:|---:|---|---:|');
  for (const row of fileSummaries) {
    ingestLines.push(
      `| \`${row.file}\` | ${row.firstDate} (${row.firstCommit}) | ${row.lastDate} (${row.lastCommit}) | ${row.sizeBytes} | ${row.words} | ${row.extractionMethod} | ${row.extractedElements} |`,
    );
  }
  ingestLines.push('');
  ingestLines.push('## Notes');
  ingestLines.push('');
  ingestLines.push('- `native_text` indicates direct UTF-8 parsing of markdown/text sources.');
  ingestLines.push('- `pdf_pdftotext`, `epub_unzip_html`, and `azw3_strings` are conversion-based extraction paths.');
  ingestLines.push('- Large binary references were parsed into text artifacts where available; conversion fidelity is method-dependent.');
  ingestLines.push('');
  writeFileAtomic(INGEST_REPORT_PATH, `${ingestLines.join('\n')}\n`);

  const unityLines = [];
  unityLines.push(`# Unity & Contention Register (${RUN_DATE})`);
  unityLines.push('');
  unityLines.push('## Unity Lock-Ins');
  unityLines.push('');
  if (unityPoints.length === 0) {
    unityLines.push('- No cross-document unity clusters met the threshold in this run.');
  } else {
    for (const point of unityPoints) {
      unityLines.push(
        `- **${point.topic}**: supported by ${point.supportCount} files (${point.supportingFiles.map((f) => `\`${f}\``).join(', ')}).`,
      );
    }
  }
  unityLines.push('');
  unityLines.push('## Contention Points');
  unityLines.push('');
  if (contentionPoints.length === 0) {
    unityLines.push('- No major contention points detected by heuristics.');
  } else {
    for (const contention of contentionPoints) {
      unityLines.push(`- **${contention.topic}**: ${contention.reason}`);
    }
  }
  unityLines.push('');
  unityLines.push('## Pricing Signals');
  unityLines.push('');
  if (pricingMentions.size === 0) {
    unityLines.push('- No explicit `$39/$30/$9` pricing lines were extracted.');
  } else {
    const examples = Array.from(pricingMentions).slice(0, 20);
    for (const mention of examples) {
      unityLines.push(`- ${mention}`);
    }
  }
  unityLines.push('');
  writeFileAtomic(UNITY_REPORT_PATH, `${unityLines.join('\n')}\n`);

  const driftLines = [];
  driftLines.push(`# Drift Check (${RUN_DATE})`);
  driftLines.push('');
  driftLines.push('| ID | Claim | Expected Runtime Control | Evidence Status |');
  driftLines.push('|---|---|---|---|');
  for (const check of driftChecks) {
    driftLines.push(`| ${check.id} | ${check.claim} | ${check.expected} | ${check.status} |`);
  }
  driftLines.push('');
  driftLines.push('## Evidence Snippets');
  driftLines.push('');
  for (const check of driftChecks) {
    driftLines.push(`### ${check.id}`);
    if (check.search.evidence.length === 0) {
      driftLines.push('- No code matches found.');
    } else {
      for (const line of check.search.evidence) {
        driftLines.push(`- \`${line}\``);
      }
    }
    driftLines.push('');
  }
  writeFileAtomic(DRIFT_REPORT_PATH, `${driftLines.join('\n')}\n`);

  const worklogLines = [];
  worklogLines.push(`# Implementation Worklog (${RUN_DATE})`);
  worklogLines.push('');
  worklogLines.push('## Context');
  worklogLines.push('');
  worklogLines.push('- This log is generated during the full ingest + drift pass.');
  worklogLines.push('- It records implementation updates tied to drift findings.');
  worklogLines.push('');
  worklogLines.push('## Initial Drift Flags');
  worklogLines.push('');
  for (const check of driftChecks) {
    worklogLines.push(`- ${check.id}: ${check.claim} -> ${check.status}`);
  }
  worklogLines.push('');
  worklogLines.push('## Resolution Status');
  worklogLines.push('');
  const resolved = driftChecks.filter((check) => check.status === 'EVIDENCE_FOUND');
  const unresolved = driftChecks.filter((check) => check.status !== 'EVIDENCE_FOUND');
  if (resolved.length > 0) {
    for (const check of resolved) {
      worklogLines.push(`- Resolved: ${check.id} (${check.claim})`);
    }
  }
  if (unresolved.length > 0) {
    for (const check of unresolved) {
      worklogLines.push(`- Pending: ${check.id} (${check.claim})`);
    }
  } else {
    worklogLines.push('- All tracked drift flags currently have runtime evidence.');
  }
  worklogLines.push('');
  worklogLines.push('## Ticketization Artifacts');
  worklogLines.push('');
  const ticketArtifacts = [
    RESEARCH_TICKET_PACK_MD_PATH,
    RESEARCH_TICKET_PACK_JSON_PATH,
  ];
  const existingTicketArtifacts = ticketArtifacts.filter((artifactPath) => fs.existsSync(artifactPath));
  if (existingTicketArtifacts.length === 0) {
    worklogLines.push('- No same-day research ticket pack artifacts detected.');
  } else {
    for (const artifactPath of existingTicketArtifacts) {
      worklogLines.push(`- \`${path.relative(REPO_ROOT, artifactPath)}\``);
    }
  }

  if (fs.existsSync(RESEARCH_TICKET_PACK_JSON_PATH)) {
    try {
      const payload = JSON.parse(fs.readFileSync(RESEARCH_TICKET_PACK_JSON_PATH, 'utf8'));
      const ticketCount = Array.isArray(payload.tickets) ? payload.tickets.length : 0;
      const coverageDeltaCount = Array.isArray(payload.coverage_delta) ? payload.coverage_delta.length : 0;
      const fullCoverageCount = Array.isArray(payload.full_unresolved_coverage) ? payload.full_unresolved_coverage.length : 0;
      worklogLines.push('');
      worklogLines.push('## Ticketization Summary');
      worklogLines.push('');
      worklogLines.push(`- Proposed executable tickets in pack: ${ticketCount}`);
      worklogLines.push(`- Coverage-delta mappings: ${coverageDeltaCount}`);
      worklogLines.push(`- Full unresolved coverage mappings: ${fullCoverageCount}`);
      if (coverageDeltaCount > 0) {
        for (const mapping of payload.coverage_delta) {
          const sourceFeature = mapping?.source_feature || 'unknown';
          const ticketId = mapping?.ticket_id || 'unknown';
          worklogLines.push(`- Coverage: ${sourceFeature} -> ${ticketId}`);
        }
      }
      if (fullCoverageCount > 0) {
        for (const mapping of payload.full_unresolved_coverage) {
          const sourceFeature = mapping?.source_feature || 'unknown';
          const ticketId = mapping?.ticket_id || 'unknown';
          worklogLines.push(`- Full coverage: ${sourceFeature} -> ${ticketId}`);
        }
      }
    } catch (error) {
      worklogLines.push('');
      worklogLines.push('## Ticketization Summary');
      worklogLines.push('');
      worklogLines.push(`- Failed to parse ticket pack JSON: ${error instanceof Error ? error.message : 'unknown parse error'}`);
    }
  }
  worklogLines.push('');
  writeFileAtomic(WORKLOG_PATH, `${worklogLines.join('\n')}\n`);

  console.log(`Doc intelligence run complete (${RUN_DATE}).`);
  console.log(`Artifacts: ${path.relative(REPO_ROOT, ARTIFACT_DIR)}`);
  console.log(`Ingest report: ${path.relative(REPO_ROOT, INGEST_REPORT_PATH)}`);
  console.log(`Unity/contention report: ${path.relative(REPO_ROOT, UNITY_REPORT_PATH)}`);
  console.log(`Drift report: ${path.relative(REPO_ROOT, DRIFT_REPORT_PATH)}`);
}

main();
