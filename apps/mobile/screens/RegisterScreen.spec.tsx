import React from 'react';
import { render } from '@testing-library/react';
import { SupportTraceErrorBanner } from '../components/SupportTraceErrorBanner';

jest.mock('../services/ApiClient', () => ({
  ApiClient: {
    register: jest.fn(),
  },
}));

function collectText(node: any): string {
  if (node == null || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(collectText).join('');
  return collectText(node.props?.children);
}

/**
 * RegisterScreen trace-ID display tests.
 *
 * The RegisterScreen uses <SupportTraceErrorBanner> to display errors
 * that may contain a [request_id:] trace suffix from the API.
 * These tests verify the trace-ID renders correctly in the screen context.
 */
describe('RegisterScreen – trace-ID display', () => {
  it('renders trace ID when error contains request_id suffix', () => {
    const tree = SupportTraceErrorBanner({
      value: 'Registration failed [request_id: reg-trace-001]',
    }) as any;
    const text = collectText(tree);

    expect(text).toContain('Registration failed');
    expect(text).toContain('Support trace ID');
    expect(text).toContain('reg-trace-001');
    expect(text).not.toContain('[request_id:');
  });

  it('does not render trace ID when error has no request_id suffix', () => {
    const tree = SupportTraceErrorBanner({
      value: 'Passwords do not match',
    }) as any;
    const text = collectText(tree);

    expect(text).toContain('Passwords do not match');
    expect(text).not.toContain('Support trace ID');
  });

  it('renders trace ID for "email already exists" API error', () => {
    const tree = SupportTraceErrorBanner({
      value: 'Email already registered [request_id: reg-dup-xyz]',
    }) as any;
    const text = collectText(tree);

    expect(text).toContain('Email already registered');
    expect(text).toContain('reg-dup-xyz');
  });

  it('does not render trace ID for client-side validation errors', () => {
    const tree = SupportTraceErrorBanner({
      value: 'All fields are required',
    }) as any;
    const text = collectText(tree);

    expect(text).toContain('All fields are required');
    expect(text).not.toContain('Support trace ID');
  });

  it('renders nothing when value is empty', () => {
    const tree = SupportTraceErrorBanner({ value: '' });
    expect(tree).toBeNull();
  });
});

describe('RegisterScreen – age gate & terms validation errors', () => {
  it('renders age confirmation error without trace ID', () => {
    const tree = SupportTraceErrorBanner({
      value: 'You must confirm you are 18 or older',
    }) as any;
    const text = collectText(tree);

    expect(text).toContain('You must confirm you are 18 or older');
    expect(text).not.toContain('Support trace ID');
  });

  it('renders terms acceptance error without trace ID', () => {
    const tree = SupportTraceErrorBanner({
      value: 'You must accept the Terms of Service and Privacy Policy',
    }) as any;
    const text = collectText(tree);

    expect(text).toContain('You must accept the Terms of Service and Privacy Policy');
    expect(text).not.toContain('Support trace ID');
  });

  it('renders age-related API error with trace ID', () => {
    const tree = SupportTraceErrorBanner({
      value: 'Age confirmation is required [request_id: reg-age-gate-001]',
    }) as any;
    const text = collectText(tree);

    expect(text).toContain('Age confirmation is required');
    expect(text).toContain('reg-age-gate-001');
    expect(text).not.toContain('[request_id:');
  });

  it('renders terms-related API error with trace ID', () => {
    const tree = SupportTraceErrorBanner({
      value: 'Terms acceptance is required [request_id: reg-terms-002]',
    }) as any;
    const text = collectText(tree);

    expect(text).toContain('Terms acceptance is required');
    expect(text).toContain('reg-terms-002');
  });

  it('renders underage rejection error with trace ID', () => {
    const tree = SupportTraceErrorBanner({
      value: 'You must be at least 18 years old to use Styx [request_id: reg-underage-xyz]',
    }) as any;
    const text = collectText(tree);

    expect(text).toContain('You must be at least 18 years old to use Styx');
    expect(text).toContain('reg-underage-xyz');
  });
});

describe('RegisterScreen – render tests', () => {
  const { RegisterScreen } = require('../screens/RegisterScreen');

  const mockNavigation = {
    navigate: jest.fn(),
    goBack: jest.fn(),
    setOptions: jest.fn(),
  } as any;

  const mockRoute = { params: undefined, key: 'Register', name: 'Register' as const } as any;

  function renderRegister() {
    return render(
      React.createElement(RegisterScreen, {
        navigation: mockNavigation,
        route: mockRoute,
      }),
    );
  }

  function allText(container: HTMLElement): string {
    return container.textContent || '';
  }

  function allPlaceholders(container: HTMLElement): string[] {
    const inputs = container.querySelectorAll('input');
    return Array.from(inputs).map(n => n.getAttribute('placeholder')).filter(Boolean) as string[];
  }

  it('renders "Join Styx" title', () => {
    const { container } = renderRegister();
    const text = allText(container);

    expect(text).toContain('Join Styx');
  });

  it('renders email, password, and confirm password inputs', () => {
    const { container } = renderRegister();
    const placeholders = allPlaceholders(container);

    expect(placeholders).toContain('Email');
    expect(placeholders).toContain('Password');
    expect(placeholders).toContain('Confirm Password');
  });

  it('renders age confirmation and terms checkboxes', () => {
    const { container } = renderRegister();
    const text = allText(container);

    expect(text).toContain('I confirm I am 18 years of age or older');
    expect(text).toContain('I accept the Terms of Service and Privacy Policy');
  });

  it('renders "Create Account" button', () => {
    const { container } = renderRegister();
    const text = allText(container);

    expect(text).toContain('Create Account');
  });

  it('renders "Already have an account?" link', () => {
    const { container } = renderRegister();
    const text = allText(container);

    expect(text).toContain('Already have an account?');
  });
});
