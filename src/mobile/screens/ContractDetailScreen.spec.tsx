import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react';
import { Alert } from 'react-native';
import { ContractDetailScreen } from './ContractDetailScreen';
import { ApiClient } from '../services/ApiClient';

jest.mock('../services/ApiClient', () => ({
  ApiClient: {
    getContract: jest.fn(),
    useGraceDay: jest.fn(),
    fileDispute: jest.fn(),
  },
}));

const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
  setOptions: jest.fn(),
} as any;

const mockRoute = {
  params: { contractId: 'contract-123' },
  key: 'ContractDetail',
  name: 'ContractDetail' as const,
} as any;

const activeContract = {
  id: 'contract-123',
  category: 'FITNESS',
  status: 'ACTIVE',
  description: 'Train daily',
  stakeAmount: 75,
  graceDaysUsed: 0,
  graceDaysMax: 3,
  proofs: [],
  startDate: '2026-01-01T00:00:00.000Z',
  endDate: '2026-12-31T00:00:00.000Z',
  metadata: {},
};

describe('ContractDetailScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (ApiClient.getContract as jest.Mock).mockResolvedValue(activeContract);
    (ApiClient.useGraceDay as jest.Mock).mockResolvedValue({
      graceDaysRemaining: 2,
    });
  });

  it('shows loading view while contract request is in-flight', () => {
    (ApiClient.getContract as jest.Mock).mockReturnValue(new Promise(() => {}));
    const { container } = render(
      <ContractDetailScreen navigation={mockNavigation} route={mockRoute} />,
    );

    expect(container.textContent).not.toContain('Capture Proof');
    expect(container.textContent).not.toContain('Contract not found');
  });

  it('routes proof submission into SubmitProof capture flow', async () => {
    const { getByText } = render(
      <ContractDetailScreen navigation={mockNavigation} route={mockRoute} />,
    );

    await waitFor(() => expect(getByText('Capture Proof')).toBeTruthy());
    fireEvent.click(getByText('Capture Proof').closest('button') as HTMLElement);

    expect(mockNavigation.navigate).toHaveBeenCalledWith('SubmitProof', { contractId: 'contract-123' });
  });

  it('uses a grace day and reloads contract', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(jest.fn());
    const { getByText } = render(
      <ContractDetailScreen navigation={mockNavigation} route={mockRoute} />,
    );

    await waitFor(() => expect(getByText('Use Grace Day')).toBeTruthy());
    fireEvent.click(getByText('Use Grace Day').closest('button') as HTMLElement);

    await waitFor(() => {
      expect(ApiClient.useGraceDay).toHaveBeenCalledWith('contract-123');
      expect(alertSpy).toHaveBeenCalledWith('Grace Day Used', '2 remaining');
      expect(ApiClient.getContract).toHaveBeenCalledTimes(2);
    });
  });

  it('renders parsed support trace when contract loading fails', async () => {
    (ApiClient.getContract as jest.Mock).mockRejectedValue(
      new Error('Contract unavailable [request_id: cdetail-500]'),
    );

    const { container } = render(
      <ContractDetailScreen navigation={mockNavigation} route={mockRoute} />,
    );

    await waitFor(() => {
      expect(container.textContent).toContain('Contract unavailable');
      expect(container.textContent).toContain('Support trace ID: cdetail-500');
      expect(container.textContent).not.toContain('[request_id:');
    });
  });
});
