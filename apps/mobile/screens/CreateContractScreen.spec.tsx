import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react';
import { SupportTraceErrorBanner } from '../components/SupportTraceErrorBanner';

function collectText(node: any): string {
  if (node == null || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(collectText).join('');
  return collectText(node.props?.children);
}

/**
 * CreateContractScreen trace-ID display tests.
 *
 * The CreateContractScreen uses <SupportTraceErrorBanner> to display errors
 * that may contain a [request_id:] trace suffix from the API.
 * These tests verify the trace-ID renders correctly in the screen context.
 */
describe('CreateContractScreen – trace-ID display', () => {
  it('renders trace ID when error contains request_id suffix', () => {
    const tree = SupportTraceErrorBanner({
      value: 'Failed to create contract [request_id: cc-trace-001]',
    }) as any;
    const text = collectText(tree);

    expect(text).toContain('Failed to create contract');
    expect(text).toContain('Support trace ID');
    expect(text).toContain('cc-trace-001');
    expect(text).not.toContain('[request_id:');
  });

  it('does not render trace ID when error has no request_id suffix', () => {
    const tree = SupportTraceErrorBanner({
      value: 'All fields are required.',
    }) as any;
    const text = collectText(tree);

    expect(text).toContain('All fields are required.');
    expect(text).not.toContain('Support trace ID');
  });

  it('renders trace ID for stake validation error from API', () => {
    const tree = SupportTraceErrorBanner({
      value: 'Stake amount exceeds maximum [request_id: cc-stake-max]',
    }) as any;
    const text = collectText(tree);

    expect(text).toContain('Stake amount exceeds maximum');
    expect(text).toContain('cc-stake-max');
  });

  it('does not render trace ID for client-side validation', () => {
    const tree = SupportTraceErrorBanner({
      value: 'Stake amount must be a positive number.',
    }) as any;
    const text = collectText(tree);

    expect(text).toContain('Stake amount must be a positive number.');
    expect(text).not.toContain('Support trace ID');
  });

  it('renders nothing when value is empty', () => {
    const tree = SupportTraceErrorBanner({ value: '' });
    expect(tree).toBeNull();
  });

  it('renders nothing when value is null', () => {
    const tree = SupportTraceErrorBanner({ value: null });
    expect(tree).toBeNull();
  });
});

/* ------------------------------------------------------------------ */
/*  CreateContractScreen – render tests                               */
/* ------------------------------------------------------------------ */

jest.mock('../services/ApiClient', () => ({
  ApiClient: {
    createContract: jest.fn(),
  },
}));

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
    setOptions: jest.fn(),
  }),
}));

jest.mock('@styx/shared/libs/behavioral-logic', () => ({
  MIN_SAFE_BMI: 18.5,
  MAX_WEEKLY_LOSS_VELOCITY_PCT: 0.02,
}));

jest.mock('../config/beta', () => ({
  getMobileFeatureFlags: () => ({
    phase1NoContactOnly: true,
    testMoneyMode: true,
    phase1MobilePrimary: true,
    enableB2bHrUi: false,
    maintenanceMode: false,
    privateBeta: true,
    allowlistUsOnly: true,
  }),
}));

describe('CreateContractScreen – render', () => {
  const { CreateContractScreen } = require('../screens/CreateContractScreen');
  const { ApiClient } = require('../services/ApiClient');

  const mockRoute = { params: {} } as any;
  const mockNav = { navigate: jest.fn(), goBack: jest.fn(), setOptions: jest.fn() } as any;

  beforeEach(() => {
    jest.clearAllMocks();
    (ApiClient.createContract as jest.Mock).mockResolvedValue({ contractId: 'contract-123' });
  });

  function renderScreen() {
    return render(
      React.createElement(CreateContractScreen, { route: mockRoute, navigation: mockNav }),
    );
  }

  function allText(container: HTMLElement): string {
    return container.textContent || '';
  }

  it('renders the beta notice text', () => {
    const { container } = renderScreen();
    const text = allText(container);
    expect(text).toContain('Private beta');
    expect(text).toContain('test-money pilot');
  });

  it('renders the oath stream label', () => {
    const { container } = renderScreen();
    const text = allText(container);
    expect(text).toContain('OATH STREAM');
  });

  it('renders verification method options', () => {
    const { container } = renderScreen();
    const text = allText(container);
    expect(text).toContain('VERIFICATION METHOD');
    expect(text).toContain('Screen Time API');
    expect(text).toContain('Fury Peer Review');
    expect(text).toContain('GPS Geofence');
  });

  it('renders stake amount input section', () => {
    const { container } = renderScreen();
    const text = allText(container);
    expect(text).toContain('STAKE AMOUNT (USD)');
    expect(text).toContain('$');
    expect(text).toContain('$20 Light');
    expect(text).toContain('$50 Default');
    expect(text).toContain('$100 Serious');
  });

  it('renders duration options', () => {
    const { container } = renderScreen();
    const text = allText(container);
    expect(text).toContain('DURATION');
    expect(text).toContain('7d');
    expect(text).toContain('14d');
    expect(text).toContain('30d');
    expect(text).toContain('60d');
    expect(text).toContain('90d');
  });

  it('renders submit button', () => {
    const { container } = renderScreen();
    const text = allText(container);
    expect(text).toContain('STAKE AND COMMIT');
  });

  it('renders test-money disclaimer in beta mode', () => {
    const { container } = renderScreen();
    const text = allText(container);
    expect(text).toContain('stake amounts are simulated');
  });

  it('only shows Recovery stream when phase1NoContactOnly is true', () => {
    const { container } = renderScreen();
    const text = allText(container);
    expect(text).toContain('Recovery');
    expect(text).not.toContain('Biological');
    expect(text).not.toContain('Cognitive');
    expect(text).not.toContain('Professional');
    expect(text).not.toContain('Creative');
  });

  it('renders without crashing', () => {
    expect(() => { renderScreen(); }).not.toThrow();
  });

  it('applies preset stake selection to the amount input', () => {
    const { getByText, getByPlaceholderText } = renderScreen();

    fireEvent.click(getByText('$50 Default').closest('button') as HTMLElement);

    const amountInput = getByPlaceholderText('0.00') as HTMLInputElement;
    expect(amountInput.value).toBe('50.00');
  });

  it('blocks submit when stake is below minimum bound', async () => {
    const { getByText, getByPlaceholderText, container } = renderScreen();

    fireEvent.click(getByText('Recovery').closest('button') as HTMLElement);
    fireEvent.click(getByText('No Contact Boundary').closest('button') as HTMLElement);
    fireEvent.click(getByText('Screen Time API').closest('button') as HTMLElement);
    fireEvent.change(getByPlaceholderText('Describe your behavioral commitment...'), {
      target: { value: 'No contact for 30 days.' },
    });
    fireEvent.change(getByPlaceholderText('partner@example.com'), {
      target: { value: 'ally@styx.io' },
    });
    fireEvent.change(getByPlaceholderText('Target #1'), {
      target: { value: 'Former Partner' },
    });
    fireEvent.click(
      getByText('I am entering this contract voluntarily.').closest('button') as HTMLElement,
    );
    fireEvent.click(
      getByText('No minors are involved in this contract.').closest('button') as HTMLElement,
    );
    fireEvent.click(
      getByText('No dependents are affected by this commitment.').closest('button') as HTMLElement,
    );
    fireEvent.click(
      getByText('This does not violate any legal obligations.').closest('button') as HTMLElement,
    );
    fireEvent.change(getByPlaceholderText('0.00'), { target: { value: '5' } });
    fireEvent.click(getByText('STAKE AND COMMIT').closest('button') as HTMLElement);

    await waitFor(() => {
      expect(container.textContent).toContain('Stake amount must be between $10 and $200.');
      expect(ApiClient.createContract).not.toHaveBeenCalled();
    });
  });

  it('submits valid bounded stake and navigates to contract detail', async () => {
    const { getByText, getByPlaceholderText, container } = renderScreen();

    fireEvent.click(getByText('Recovery').closest('button') as HTMLElement);
    fireEvent.click(getByText('No Contact Boundary').closest('button') as HTMLElement);
    fireEvent.click(getByText('Fury Peer Review').closest('button') as HTMLElement);
    fireEvent.change(getByPlaceholderText('Describe your behavioral commitment...'), {
      target: { value: 'No social stalking for 30 days.' },
    });
    fireEvent.change(getByPlaceholderText('partner@example.com'), {
      target: { value: 'ally@styx.io' },
    });
    fireEvent.change(getByPlaceholderText('Target #1'), {
      target: { value: 'Former Partner' },
    });
    fireEvent.click(
      getByText('I am entering this contract voluntarily.').closest('button') as HTMLElement,
    );
    fireEvent.click(
      getByText('No minors are involved in this contract.').closest('button') as HTMLElement,
    );
    fireEvent.click(
      getByText('No dependents are affected by this commitment.').closest('button') as HTMLElement,
    );
    fireEvent.click(
      getByText('This does not violate any legal obligations.').closest('button') as HTMLElement,
    );
    fireEvent.click(getByText('$50 Default').closest('button') as HTMLElement);
    fireEvent.click(getByText('STAKE AND COMMIT').closest('button') as HTMLElement);

    await waitFor(() => {
      expect(ApiClient.createContract).toHaveBeenCalledWith({
        oathCategory: 'RECOVERY_NOCONTACT',
        verificationMethod: 'FURY_NETWORK',
        description: 'No social stalking for 30 days.',
        stakeAmount: 50,
        durationDays: 30,
        recoveryMetadata: {
          accountabilityPartnerEmail: 'ally@styx.io',
          noContactIdentifiers: ['Former Partner'],
          acknowledgments: {
            voluntary: true,
            noMinors: true,
            noDependents: true,
            noLegalObligations: true,
          },
        },
      });
      expect(mockNav.navigate).toHaveBeenCalledWith('ContractDetail', {
        contractId: 'contract-123',
      });
      expect(container.textContent).toContain('Loss Math Preview');
      expect(container.textContent).toContain('Weekly loss cap policy');
    });
  });
});
