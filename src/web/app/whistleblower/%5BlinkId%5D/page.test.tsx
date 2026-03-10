'use client';

import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

jest.mock('next/navigation', () => ({
  useParams: () => ({ linkId: 'test-link-123' }),
}));

jest.mock('lucide-react', () => ({
  Shield: (props: any) => <span data-testid="shield" {...props} />,
  Send: (props: any) => <span data-testid="send" {...props} />,
  Loader2: (props: any) => <span data-testid="loader" {...props} />,
  CheckCircle: (props: any) => <span data-testid="check" {...props} />,
  AlertTriangle: (props: any) => <span data-testid="alert" {...props} />,
}));

import WhistleblowerPage from './page';

describe('WhistleblowerPage', () => {
  it('renders the page heading', () => {
    const html = renderToStaticMarkup(<WhistleblowerPage />);
    expect(html).toContain('STYX');
    expect(html).toContain('Ex-Bounty Intake');
  });

  it('renders the evidence submission form', () => {
    const html = renderToStaticMarkup(<WhistleblowerPage />);
    expect(html).toContain('<form');
    expect(html).toContain('Evidence Artifact URL');
    expect(html).toContain('https://shared-link.com/screenshot.jpg');
  });

  it('renders the submit button', () => {
    const html = renderToStaticMarkup(<WhistleblowerPage />);
    expect(html).toContain('Submit Evidence');
  });

  it('renders the disclaimer text', () => {
    const html = renderToStaticMarkup(<WhistleblowerPage />);
    expect(html).toContain('truthful');
    expect(html).toContain('Fury network');
  });
});
