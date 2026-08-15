import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

jest.mock('next/link', () => {
  return function MockLink({ children, href }: { children: React.ReactNode; href: string }) {
    return <a href={href}>{children}</a>;
  };
});

import ComplianceArtifactsPage from './page';

describe('ComplianceArtifactsPage', () => {
  it('renders the page title', () => {
    const html = renderToStaticMarkup(<ComplianceArtifactsPage />);
    expect(html).toContain('Compliance Artifact Register');
  });

  it('embeds the live artifact table', () => {
    const html = renderToStaticMarkup(<ComplianceArtifactsPage />);
    expect(html).toContain('skill_contest_whitepaper');
    expect(html).toContain('SHA-256 content hash');
  });

  it('states every condition that blocks a release', () => {
    const html = renderToStaticMarkup(<ComplianceArtifactsPage />);
    expect(html).toContain('No active version is on record');
    expect(html).toContain('recorded expiration date has passed');
  });

  it('renders the back link to home', () => {
    const html = renderToStaticMarkup(<ComplianceArtifactsPage />);
    expect(html).toContain('href="/"');
  });

  it('cross-links the other legal pages', () => {
    const html = renderToStaticMarkup(<ComplianceArtifactsPage />);
    expect(html).toContain('href="/legal/terms"');
    expect(html).toContain('href="/legal/privacy"');
    expect(html).toContain('href="/legal/rules"');
    expect(html).toContain('href="/legal/responsible-use"');
  });
});
