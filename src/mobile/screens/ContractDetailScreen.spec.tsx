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

const activeRecoveryContract = {
  id: 'contract-123',
  oath_category: 'RECOVERY_NOCONTACT',
  status: 'ACTIVE',
  description: 'Maintain no contact for 30 days.',
  stake_amount: 75,
  grace_days_used: 0,
  grace_days_max: 3,
  proof_count: 0,
  proofs: [],
  started_at: '2026-01-01T00:00:00.000Z',
  ends_at: '2026-01-31T00:00:00.000Z',
  metadata: {
    recovery: {
      noContactIdentifiers: ['hashed-target-1'],
    },
  },
};

describe('ContractDetailScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (ApiClient.getContract as jest.Mock).mockResolvedValue(activeRecoveryContract);
    (ApiClient.useGraceDay as jest.Mock).mockResolvedValue({
      graceDaysRemaining: 2,
    });
  });

  it('shows loading view while contract request is in-flight', () => {
    (ApiClient.getContract as jest.Mock).mockReturnValue(new Promise(() => {}));
    const { container } = render(
      <ContractDetailScreen navigation={mockNavigation} route={mockRoute} />,
    );

    expect(container.textContent).not.toContain('Daily Check-In');
    expect(container.textContent).not.toContain('Contract not found');
  });

  it('renders snake_case contract fields from the mobile API payload', async () => {
    const { getByText } = render(
      <ContractDetailScreen navigation={mockNavigation} route={mockRoute} />,
    );

    await waitFor(() => {
      expect(getByText('RECOVERY_NOCONTACT')).toBeTruthy();
      expect(getByText('$75.00')).toBeTruthy();
      expect(getByText('Maintain no contact for 30 days.')).toBeTruthy();
      expect(getByText('0/3')).toBeTruthy();
    });
  });

  it('routes recovery check-in into the Attestation flow', async () => {
    const { getByText } = render(
      <ContractDetailScreen navigation={mockNavigation} route={mockRoute} />,
    );

    await waitFor(() => expect(getByText('Daily Check-In')).toBeTruthy());
    fireEvent.click(getByText('Daily Check-In').closest('button') as HTMLElement);

    expect(mockNavigation.navigate).toHaveBeenCalledWith('Attestation', { contractId: 'contract-123' });
  });

  it('routes automatic scan into DigitalExhaust with a safe label', async () => {
    const { getByText } = render(
      <ContractDetailScreen navigation={mockNavigation} route={mockRoute} />,
    );

    await waitFor(() => expect(getByText('Automatic Scan')).toBeTruthy());
    fireEvent.click(getByText('Automatic Scan').closest('button') as HTMLElement);

    expect(mockNavigation.navigate).toHaveBeenCalledWith('DigitalExhaust', {
      contractId: 'contract-123',
      targetPhoneNumber: 'Target #1',
    });
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
