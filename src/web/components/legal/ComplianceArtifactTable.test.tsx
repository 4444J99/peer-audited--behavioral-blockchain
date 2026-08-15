import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ComplianceArtifactTable from './ComplianceArtifactTable';

describe('ComplianceArtifactTable', () => {
  it('renders the gated artifact type', () => {
    const html = renderToStaticMarkup(<ComplianceArtifactTable />);

    expect(html).toContain('skill_contest_whitepaper');
    expect(html).toContain('Skill-Based Contest Whitepaper');
  });

  it('names the source document the gate hashes', () => {
    const html = renderToStaticMarkup(<ComplianceArtifactTable />);

    expect(html).toContain('docs/legal/legal--skill-based-contest-whitepaper.md');
  });

  it('labels the digest field as SHA-256', () => {
    const html = renderToStaticMarkup(<ComplianceArtifactTable />);

    expect(html).toContain('SHA-256 content hash');
  });

  it('shows a pending state before the live register answers', () => {
    // renderToStaticMarkup never runs effects, so this is the exact markup a
    // reader sees on first paint — it must not read as "no artifact exists".
    const html = renderToStaticMarkup(<ComplianceArtifactTable />);

    expect(html).toContain('Checking the live register');
    expect(html).not.toContain('No active artifact recorded');
  });

  it('does not show the unreachable-register warning before a request fails', () => {
    const html = renderToStaticMarkup(<ComplianceArtifactTable />);

    expect(html).not.toContain('could not be reached');
  });
});
