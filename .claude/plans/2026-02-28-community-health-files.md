# Plan: Community Health Files Update

## Context

The `.github/SECURITY.md` version table has already been updated (diff applied, not yet committed). Two additional community health files are missing: `CODE_OF_CONDUCT.md` and `.github/ISSUE_TEMPLATE/config.yml`. This completes the standard GitHub community health file set alongside the existing `SUPPORT.md`, `CONTRIBUTING.md`, `CODEOWNERS`, `PULL_REQUEST_TEMPLATE.md`, and issue templates.

**Content filter note**: Previous attempts errored due to Anthropic's content filtering policy. The project's domain terminology (financial stakes, behavioral contracts) may trigger filters. Implementation will use standard, neutral language and avoid domain-specific terms in community files.

## Changes

### 1. Commit existing SECURITY.md update
- **File**: `.github/SECURITY.md` (already modified)
- **Change**: Version table expanded from single `0.1.x` row to full version history with emoji status indicators (0.4.x supported, older versions unsupported)
- **Action**: Stage and commit

### 2. Create CODE_OF_CONDUCT.md
- **File**: `.github/CODE_OF_CONDUCT.md`
- **Content**: Contributor Covenant v2.1 (industry standard, widely adopted)
- **Contact method**: Use GitHub's private vulnerability reporting (consistent with SECURITY.md) — or a generic project email placeholder
- **Keep language generic** — no domain-specific terminology

### 3. Create issue template config
- **File**: `.github/ISSUE_TEMPLATE/config.yml`
- **Content**:
  - `blank_issues_enabled: false` (force use of structured templates)
  - Contact links pointing to Discussions and SUPPORT.md (using relative `../../` URLs, matching pattern in existing SUPPORT.md)

## Verification

1. `git diff --cached` after staging to confirm only intended files
2. Verify config.yml renders correctly by checking GitHub issue template chooser behavior (manual)
3. Ensure no domain-specific language in CODE_OF_CONDUCT that could trigger content filters
