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

import LoginPage from './page';

describe('LoginPage', () => {
  it('renders the login form with email and password fields', () => {
    const html = renderToStaticMarkup(<LoginPage />);

    expect(html).toContain('id="email"');
    expect(html).toContain('type="email"');
    expect(html).toContain('id="password"');
    expect(html).toContain('type="password"');
  });

  it('renders the page heading', () => {
    const html = renderToStaticMarkup(<LoginPage />);

    expect(html).toContain('Access Your Recovery');
  });

  it('renders the submit button with SIGN IN text', () => {
    const html = renderToStaticMarkup(<LoginPage />);

    expect(html).toContain('SIGN IN');
  });

  it('renders a link to the registration page', () => {
    const html = renderToStaticMarkup(<LoginPage />);

    expect(html).toContain('href="/register"');
    expect(html).toContain('Register');
  });

  it('renders the Styx logo element', () => {
    const html = renderToStaticMarkup(<LoginPage />);

    // The "S" logo in the red circle
    expect(html).toContain('>S</span>');
  });

  it('renders email placeholder', () => {
    const html = renderToStaticMarkup(<LoginPage />);

    expect(html).toContain('you@styx.protocol');
  });

  it('renders the form element', () => {
    const html = renderToStaticMarkup(<LoginPage />);

    expect(html).toContain('<form');
  });
});
