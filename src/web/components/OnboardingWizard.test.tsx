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

import { OnboardingWizard } from './OnboardingWizard';

describe('OnboardingWizard', () => {
  const defaultProps = {
    onComplete: jest.fn(),
    onSkip: jest.fn(),
  };

  it('renders the welcome step (step 0) initially', () => {
    const html = renderToStaticMarkup(<OnboardingWizard {...defaultProps} />);

    expect(html).toContain('Welcome to Styx');
    expect(html).toContain('The Blockchain of Truth');
    expect(html).toContain('Step 1 of 5');
  });

  it('renders the progress bar with 5 steps', () => {
    const html = renderToStaticMarkup(<OnboardingWizard {...defaultProps} />);

    // Step indicator text
    expect(html).toContain('Step 1 of 5');
  });

  it('renders the skip button on the first step', () => {
    const html = renderToStaticMarkup(<OnboardingWizard {...defaultProps} />);

    expect(html).toContain('Skip for now');
  });

  it('renders the Continue button', () => {
    const html = renderToStaticMarkup(<OnboardingWizard {...defaultProps} />);

    expect(html).toContain('Continue');
  });

  it('renders loss aversion information', () => {
    const html = renderToStaticMarkup(<OnboardingWizard {...defaultProps} />);

    expect(html).toContain('Loss Aversion');
    expect(html).toContain('Fury Network');
    expect(html).toContain('Financial Stakes');
  });

  it('renders the close/skip button in the top-right corner', () => {
    const html = renderToStaticMarkup(<OnboardingWizard {...defaultProps} />);

    expect(html).toContain('Skip onboarding');
  });

  it('contains peer-audited behavioral market description', () => {
    const html = renderToStaticMarkup(<OnboardingWizard {...defaultProps} />);

    expect(html).toContain('peer-audited behavioral market');
  });
});
