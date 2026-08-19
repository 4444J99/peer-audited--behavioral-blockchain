/** @jest-environment jsdom */

import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { OnboardingWizard } from './OnboardingWizard';
import { IDENTITY_ARCHETYPES } from '../../shared/libs/identity-oath';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

jest.mock('next/link', () => {
  return function MockLink({
    children,
    href,
    className,
  }: {
    children: React.ReactNode;
    href: string;
    className?: string;
  }) {
    return (
      <a href={href} className={className}>
        {children}
      </a>
    );
  };
});

const getIdentityOath = jest.fn();
const declareIdentityOath = jest.fn();

jest.mock('../services/api-client', () => ({
  api: {
    getIdentityOath: (...args: unknown[]) => getIdentityOath(...args),
    declareIdentityOath: (...args: unknown[]) => declareIdentityOath(...args),
  },
}));

const archetype = IDENTITY_ARCHETYPES[0];

describe('OnboardingWizard', () => {
  const defaultProps = {
    onComplete: jest.fn(),
    onSkip: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    getIdentityOath.mockResolvedValue({
      oathCategory: 'RECOVERY_NOCONTACT',
      oath: null,
      completed: false,
      archetypes: IDENTITY_ARCHETYPES,
    });
    declareIdentityOath.mockResolvedValue({
      id: 'oath-1',
      archetypeId: archetype.id,
      identityLabel: archetype.label,
      pledgeCopy: 'I am becoming someone who keeps the distance they chose.',
      copyVariant: 'DECLARATIVE',
    });
  });

  it('renders the welcome step (step 0) initially', () => {
    const html = renderToStaticMarkup(<OnboardingWizard {...defaultProps} />);

    expect(html).toContain('Welcome to Styx');
    expect(html).toContain('Relationship Recovery Beta');
    expect(html).toContain('Step 1 of 6');
  });

  it('renders the key features in welcome step', () => {
    const html = renderToStaticMarkup(<OnboardingWizard {...defaultProps} />);

    expect(html).toContain('Emotional Resilience');
    expect(html).toContain('Verified Progress');
    expect(html).toContain('Micro-Stakes');
  });

  it('mentions financial commitments and No Contact rule', () => {
    const html = renderToStaticMarkup(<OnboardingWizard {...defaultProps} />);

    expect(html).toContain('financial commitments');
    expect(html).toContain('No Contact rule');
  });

  it('asks who the user is becoming before it asks what they will do', async () => {
    render(<OnboardingWizard {...defaultProps} />);

    fireEvent.click(screen.getByText('Continue'));

    expect(await screen.findByText('Who Are You Becoming?')).toBeDefined();
    for (const option of IDENTITY_ARCHETYPES) {
      expect(screen.getByText(option.label)).toBeDefined();
    }
    // The oath-stream step is still ahead of us, not behind.
    expect(screen.queryByText('Choose Your First Oath')).toBeNull();
  });

  it('will not advance past the identity step until one is declared', async () => {
    render(<OnboardingWizard {...defaultProps} />);
    fireEvent.click(screen.getByText('Continue'));
    await screen.findByText('Who Are You Becoming?');

    fireEvent.click(screen.getByText('Continue'));

    expect(declareIdentityOath).not.toHaveBeenCalled();
    expect(screen.getByText('Who Are You Becoming?')).toBeDefined();
  });

  it('persists the declaration and carries the pledge to the summary', async () => {
    render(<OnboardingWizard {...defaultProps} />);
    fireEvent.click(screen.getByText('Continue'));
    await screen.findByText('Who Are You Becoming?');

    fireEvent.click(screen.getByText(archetype.label));
    fireEvent.click(screen.getByText('Continue'));

    await waitFor(() =>
      expect(declareIdentityOath).toHaveBeenCalledWith(archetype.id),
    );
    await screen.findByText('Choose Your First Oath');

    // Walk to the final summary: category, stake, payment.
    fireEvent.click(screen.getByText('No Contact'));
    fireEvent.click(screen.getByText('Continue'));
    await screen.findByText('Set Your Stakes');
    // The default stake (25) sits above the beta cap, so a preset must be
    // chosen before the step will advance — unchanged by this work.
    fireEvent.click(screen.getByText('$15'));
    fireEvent.click(screen.getByText('Continue'));
    await screen.findByText('Connect Payment');
    fireEvent.click(screen.getByText('Continue'));

    expect(await screen.findByText('You Are Ready')).toBeDefined();
    expect(
      screen.getByText(
        'I am becoming someone who keeps the distance they chose.',
      ),
    ).toBeDefined();
    expect(screen.getByText(archetype.label)).toBeDefined();
  });

  it('keeps the user on the identity step when the declaration fails', async () => {
    declareIdentityOath.mockRejectedValue(new Error('network down'));
    render(<OnboardingWizard {...defaultProps} />);
    fireEvent.click(screen.getByText('Continue'));
    await screen.findByText('Who Are You Becoming?');

    fireEvent.click(screen.getByText(archetype.label));
    fireEvent.click(screen.getByText('Continue'));

    expect(
      await screen.findByText(
        'Could not save your identity. Check your connection and try again.',
      ),
    ).toBeDefined();
    expect(screen.getByText('Who Are You Becoming?')).toBeDefined();
  });

  it('resumes a declaration made in an earlier session', async () => {
    getIdentityOath.mockResolvedValue({
      oathCategory: 'RECOVERY_NOCONTACT',
      oath: {
        id: 'oath-1',
        userId: 'user-1',
        oathCategory: 'RECOVERY_NOCONTACT',
        archetypeId: archetype.id,
        identityLabel: archetype.label,
        pledgeCopy: 'I am becoming someone who keeps the distance they chose.',
        copyVariant: 'DECLARATIVE',
        activatedAt: '2026-03-04T12:00:00.000Z',
      },
      completed: true,
      archetypes: IDENTITY_ARCHETYPES,
    });

    render(<OnboardingWizard {...defaultProps} />);
    await waitFor(() => expect(getIdentityOath).toHaveBeenCalled());

    fireEvent.click(screen.getByText('Continue'));
    await screen.findByText('Who Are You Becoming?');

    // The prior choice is pre-selected, so Continue moves on immediately.
    fireEvent.click(screen.getByText('Continue'));

    await waitFor(() =>
      expect(declareIdentityOath).toHaveBeenCalledWith(archetype.id),
    );
    expect(await screen.findByText('Choose Your First Oath')).toBeDefined();
  });

  it('does not block onboarding when the resume lookup fails', async () => {
    getIdentityOath.mockRejectedValue(new Error('offline'));
    render(<OnboardingWizard {...defaultProps} />);
    await waitFor(() => expect(getIdentityOath).toHaveBeenCalled());

    fireEvent.click(screen.getByText('Continue'));

    expect(await screen.findByText('Who Are You Becoming?')).toBeDefined();
  });
});
