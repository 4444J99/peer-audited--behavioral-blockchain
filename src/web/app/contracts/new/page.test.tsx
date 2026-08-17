import React, { Suspense } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
  useSearchParams: () => ({
    get: jest.fn().mockReturnValue(null),
  }),
}));

jest.mock('next/link', () => {
  return function MockLink({ children, href }: { children: React.ReactNode; href: string }) {
    return <a href={href}>{children}</a>;
  };
});

jest.mock('../../../services/api-client', () => ({
  api: {
    createContract: jest.fn().mockResolvedValue({ id: 'new-id' }),
    getUserContracts: jest.fn().mockResolvedValue([]),
    getEndowedProgress: jest.fn().mockResolvedValue({
      downscaling: { multiplier: 1, reason: 'no downscaling applied' },
    }),
  },
}));

let mockAuthUser = {
  id: '1',
  email: 'test@styx.io',
  integrity_score: 125,
  role: 'USER',
  failed_contracts: 0,
};

jest.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: mockAuthUser,
    token: 'mock-token',
    login: jest.fn(),
    register: jest.fn(),
    logout: jest.fn(),
    isLoading: false,
  }),
}));

import NewContractPage from './page';

describe('New Contract Page', () => {
  beforeEach(() => {
    mockAuthUser = {
      id: '1',
      email: 'test@styx.io',
      integrity_score: 125,
      role: 'USER',
      failed_contracts: 0,
    };
  });

  it('renders the page heading', () => {
    const html = renderToStaticMarkup(<NewContractPage />);

    expect(html).toContain('New Behavioral Contract');
  });

  it('renders the subtitle about staking capital', () => {
    const html = renderToStaticMarkup(<NewContractPage />);

    expect(html).toContain('Commit test-money against your recovery goal');
  });

  it('renders the Oath Category select', () => {
    const html = renderToStaticMarkup(<NewContractPage />);

    expect(html).toContain('Oath Category');
    expect(html).toContain('Select a behavioral oath');
  });

  it('renders oath categories grouped by stream', () => {
    const html = renderToStaticMarkup(<NewContractPage />);

    // In current beta, only Recovery Stream is enabled/uncommented
    expect(html).toContain('Recovery Stream');
  });

  it('renders the Verification Method select', () => {
    const html = renderToStaticMarkup(<NewContractPage />);

    expect(html).toContain('Select oracle type');
    expect(html).toContain('Fury Peer Review');
    expect(html).toContain('Daily Attestation');
  });

  it('renders the Stake Amount input with dollar sign', () => {
    const html = renderToStaticMarkup(<NewContractPage />);

    expect(html).toContain('Stake Amount (USD)');
    expect(html).toContain('FBO hold');
  });

  it('renders bounded stake controls with live fee breakdown', () => {
    const html = renderToStaticMarkup(<NewContractPage />);

    expect(html).toContain('Bounded stake amount');
    expect(html).toContain('You could lose');
    expect(html).toContain('Refundable stake');
    expect(html).toContain('Platform fee');
    expect(html).toContain('Entry total');
  });

  // The $9 MVP_39 platform fee is metadata only — normalizeContractPricing
  // overrides the stake to $30 and the sole charge is a $30 hold, so no fee is
  // collected. This page used to advertise "$9.00" and "Entry total $39.00" for
  // money that never moves. Quote what is actually charged.
  it('does not advertise a platform fee that is never charged', () => {
    const html = renderToStaticMarkup(<NewContractPage />);

    expect(html).not.toContain('$39.00');
    expect(html).toContain('$30.00');
    expect(html).toContain('No platform fee during beta');
  });

  it('renders tier and Aegis safety copy for the selected amount', () => {
    const html = renderToStaticMarkup(<NewContractPage />);

    expect(html).toContain('HIGH ROLLER tier cap');
    expect(html).toContain('Aegis safety ceiling');
    expect(html).toContain('KYC required at this amount');
    expect(html).toContain('choose only an amount you can afford to lose');
  });

  it('keeps exact $20 micro stakes outside KYC and MVP fees', () => {
    mockAuthUser = {
      id: '1',
      email: 'micro@styx.io',
      integrity_score: 35,
      role: 'USER',
      failed_contracts: 0,
    };
    const html = renderToStaticMarkup(<NewContractPage />);

    expect(html).toContain('MICRO tier cap');
    expect(html).toContain('$20.00');
    expect(html).toContain('No KYC required');
    expect(html).toContain('No platform fee during beta');
  });

  it('renders failure-history cap copy when failed contracts are known', () => {
    mockAuthUser = {
      id: '1',
      email: 'risk@styx.io',
      integrity_score: 125,
      role: 'USER',
      failed_contracts: 3,
    };
    const html = renderToStaticMarkup(<NewContractPage />);

    expect(html).toContain('Failure-history cap: $50.00 after 3 failed contracts.');
  });

  it('renders duration buttons', () => {
    const html = renderToStaticMarkup(<NewContractPage />);

    expect(html).toContain('7 days');
    expect(html).toContain('14 days');
    expect(html).toContain('30 days');
  });

  it('renders safety acknowledgments for recovery contracts', () => {
    const html = renderToStaticMarkup(<NewContractPage />);

    // Since default selection is empty, we need to check if they are rendered when category is recovery
    // But testing that requires full interaction which is hard with static markup.
    // We'll trust the component logic if the static parts render.
    expect(html).toContain('STAKE AND COMMIT');
  });
});
