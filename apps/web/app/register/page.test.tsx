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
  return function MockLink({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) {
    return <a href={href} {...props}>{children}</a>;
  };
});

jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: null,
    token: null,
    login: jest.fn(),
    register: jest.fn(),
    logout: jest.fn(),
    isLoading: false,
  }),
}));

import RegisterPage from './page';

describe('RegisterPage', () => {
  it('renders the registration form with email, password, and confirm password fields', () => {
    const html = renderToStaticMarkup(<RegisterPage />);

    expect(html).toContain('id="email"');
    expect(html).toContain('id="password"');
    expect(html).toContain('id="confirm-password"');
  });

  it('renders the page heading', () => {
    const html = renderToStaticMarkup(<RegisterPage />);

    expect(html).toContain('Start Your Recovery');
  });

  it('renders the submit button', () => {
    const html = renderToStaticMarkup(<RegisterPage />);

    expect(html).toContain('CREATE ACCOUNT');
  });

  it('renders the age confirmation checkbox', () => {
    const html = renderToStaticMarkup(<RegisterPage />);

    expect(html).toContain('18 years of age or older');
  });

  it('renders the terms acceptance checkbox with links', () => {
    const html = renderToStaticMarkup(<RegisterPage />);

    expect(html).toContain('Terms of Service');
    expect(html).toContain('Privacy Policy');
    expect(html).toContain('Contest Rules');
    expect(html).toContain('href="/legal/terms"');
    expect(html).toContain('href="/legal/privacy"');
    expect(html).toContain('href="/legal/rules"');
  });

  it('renders a link to the login page', () => {
    const html = renderToStaticMarkup(<RegisterPage />);

    expect(html).toContain('href="/login"');
    expect(html).toContain('Sign in');
  });

  it('renders Legal Requirements section', () => {
    const html = renderToStaticMarkup(<RegisterPage />);

    expect(html).toContain('Legal Requirements');
  });

  it('renders password placeholder with requirements hint', () => {
    const html = renderToStaticMarkup(<RegisterPage />);

    expect(html).toContain('Min. 12 characters');
  });
});
