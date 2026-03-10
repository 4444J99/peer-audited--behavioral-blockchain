# Fix: Community docs gaps (SECURITY versions, CoC, issue config)

## Context

The repo has mature community docs (`.github/SECURITY.md`, `.github/CONTRIBUTING.md`, `.github/SUPPORT.md`, issue templates) but three gaps:

1. **SECURITY.md version table** lists only `0.1.x` as supported — CHANGELOG shows `0.4.0` is the latest release
2. **No CODE_OF_CONDUCT.md** — standard for OSS repos, and GitHub surfaces this in the Community profile
3. **No `.github/ISSUE_TEMPLATE/config.yml`** — no way to link Discussions or disable blank issues (existing templates: `bug_report.yml`, `feature_request.yml`)

The user also warns about recurring 400 errors — avoid unnecessary GitHub API calls; keep changes file-only.

## Changes

### 1. Update `.github/SECURITY.md` version table (lines 5–7)

Replace the single-row table with all released versions. Only latest minor supported:

```
| Version | Supported          |
|---------|--------------------|
| 0.4.x   | :white_check_mark: |
| 0.3.x   | :x:                |
| 0.2.x   | :x:                |
| 0.1.x   | :x:                |
| < 0.1   | :x:                |
```

### 2. Create `.github/CODE_OF_CONDUCT.md`

Contributor Covenant v2.1 (standard text). Contact method: GitHub's private vulnerability reporting (consistent with SECURITY.md). Place in `.github/` alongside other community docs.

### 3. Create `.github/ISSUE_TEMPLATE/config.yml`

```yaml
blank_issues_enabled: false
contact_links:
  - name: Questions & Ideas
    url: https://github.com/organvm-iii-ergon/peer-audited--behavioral-blockchain/discussions
    about: Use Discussions for questions, ideas, and general conversation
  - name: Security Vulnerabilities
    url: https://github.com/organvm-iii-ergon/peer-audited--behavioral-blockchain/security/advisories/new
    about: Report security issues privately — do NOT open a public issue
```

## Files Modified

- `.github/SECURITY.md` — edit version table (lines 5–7)
- `.github/CODE_OF_CONDUCT.md` — **new file** (Contributor Covenant v2.1)
- `.github/ISSUE_TEMPLATE/config.yml` — **new file**

## Verification

1. `git diff` to review all changes
2. Visually confirm SECURITY.md table renders correctly
3. Confirm no unintended changes to other files
