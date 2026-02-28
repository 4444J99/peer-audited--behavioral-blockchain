import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
}));

jest.mock('next/link', () => {
  return function MockLink({ children, href }: { children: React.ReactNode; href: string }) {
    return <a href={href}>{children}</a>;
  };
});

jest.mock('../../../services/api-client', () => ({
  api: {
    createContract: jest.fn(),
  },
}));

import NewContractPage from './page';

describe('New Contract Page', () => {
  it('renders the page heading', () => {
    const html = renderToStaticMarkup(<NewContractPage />);

    expect(html).toContain('New Behavioral Contract');
  });

  it('renders the subtitle about staking capital', () => {
    const html = renderToStaticMarkup(<NewContractPage />);

    expect(html).toContain('Stake capital against your commitment');
  });

  it('renders the Oath Category select', () => {
    const html = renderToStaticMarkup(<NewContractPage />);

    expect(html).toContain('Oath Category');
    expect(html).toContain('Select a behavioral oath');
  });

  it('renders oath categories grouped by stream', () => {
    const html = renderToStaticMarkup(<NewContractPage />);

    // Check for various stream groups
    expect(html).toContain('Biological Stream');
    expect(html).toContain('Cognitive Stream');
    expect(html).toContain('Professional Stream');
    expect(html).toContain('Creative Stream');
    expect(html).toContain('Recovery Stream');
  });

  it('renders the Verification Method select', () => {
    const html = renderToStaticMarkup(<NewContractPage />);

    expect(html).toContain('Verification Method');
    expect(html).toContain('Select oracle type');
    expect(html).toContain('Fury Peer Review');
    expect(html).toContain('HealthKit (iOS)');
  });

  it('renders the Stake Amount input with dollar sign', () => {
    const html = renderToStaticMarkup(<NewContractPage />);

    expect(html).toContain('Stake Amount (USD)');
    expect(html).toContain('FBO escrow');
  });

  it('renders duration buttons', () => {
    const html = renderToStaticMarkup(<NewContractPage />);

    expect(html).toContain('Duration');
    expect(html).toContain('7 days');
    expect(html).toContain('14 days');
    expect(html).toContain('30 days');
    expect(html).toContain('60 days');
    expect(html).toContain('90 days');
  });

  it('renders the submit button', () => {
    const html = renderToStaticMarkup(<NewContractPage />);

    expect(html).toContain('STAKE AND COMMIT');
  });

  it('renders back link to dashboard', () => {
    const html = renderToStaticMarkup(<NewContractPage />);

    expect(html).toContain('href="/dashboard"');
  });

  it('renders the authorization disclaimer', () => {
    const html = renderToStaticMarkup(<NewContractPage />);

    expect(html).toContain('authorize Styx to place an FBO hold');
  });
});
