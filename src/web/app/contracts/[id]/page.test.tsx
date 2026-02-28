import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
  useParams: () => ({
    id: 'contract-abc-123',
  }),
}));

jest.mock('next/link', () => {
  return function MockLink({ children, href }: { children: React.ReactNode; href: string }) {
    return <a href={href}>{children}</a>;
  };
});

jest.mock('../../../services/api-client', () => ({
  api: {
    getContract: jest.fn().mockResolvedValue({
      id: 'contract-abc-123',
      user_id: 'user-1',
      oath_category: 'BIOLOGICAL_WEIGHT',
      verification_method: 'FURY_NETWORK',
      stake_amount: '50.00',
      status: 'ACTIVE',
      duration_days: 30,
      started_at: '2026-02-01T00:00:00Z',
      ends_at: '2026-03-03T00:00:00Z',
      created_at: '2026-02-01T00:00:00Z',
      email: 'user@test.com',
      integrity_score: 75,
    }),
    getContractProofs: jest.fn().mockResolvedValue([]),
    submitProof: jest.fn(),
    useGraceDay: jest.fn(),
    disputeContract: jest.fn(),
  },
}));

jest.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'user-1', email: 'user@test.com', integrity_score: 75, role: 'USER' },
    token: 'mock-token',
    login: jest.fn(),
    register: jest.fn(),
    logout: jest.fn(),
    isLoading: false,
  }),
}));

import ContractDetailPage from './page';

describe('Contract Detail Page', () => {
  it('renders loading state initially', () => {
    const html = renderToStaticMarkup(<ContractDetailPage />);

    // Component starts with loading=true
    expect(html).toContain('Loading contract');
  });

  it('renders the loading spinner with correct styling', () => {
    const html = renderToStaticMarkup(<ContractDetailPage />);

    expect(html).toContain('animate-spin');
  });
});
