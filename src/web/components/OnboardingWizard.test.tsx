import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { OnboardingWizard } from './OnboardingWizard';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

describe('OnboardingWizard', () => {
  const defaultProps = {
    onComplete: jest.fn(),
    onSkip: jest.fn(),
  };

  it('renders the welcome step (step 0) initially', () => {
    const html = renderToStaticMarkup(<OnboardingWizard {...defaultProps} />);

    expect(html).toContain('Welcome to Styx');
    expect(html).toContain('Relationship Recovery Beta');
    expect(html).toContain('Step 1 of 5');
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
});
