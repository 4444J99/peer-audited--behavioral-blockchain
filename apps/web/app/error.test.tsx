import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ErrorPage from './error';

describe('Error Page', () => {
  const mockReset = jest.fn();

  it('renders the "Something Went Wrong" heading', () => {
    const error = new Error('Test error message');
    const html = renderToStaticMarkup(<ErrorPage error={error} reset={mockReset} />);

    expect(html).toContain('Something Went Wrong');
  });

  it('displays the error message', () => {
    const error = new Error('Connection timed out');
    const html = renderToStaticMarkup(<ErrorPage error={error} reset={mockReset} />);

    expect(html).toContain('Connection timed out');
  });

  it('displays the error digest when present', () => {
    const error = Object.assign(new Error('Something broke'), { digest: 'err-digest-42' });
    const html = renderToStaticMarkup(<ErrorPage error={error} reset={mockReset} />);

    expect(html).toContain('Error ID: err-digest-42');
  });

  it('does not display error digest when not present', () => {
    const error = new Error('No digest here');
    const html = renderToStaticMarkup(<ErrorPage error={error} reset={mockReset} />);

    expect(html).not.toContain('Error ID:');
  });

  it('renders the Try Again button', () => {
    const error = new Error('test');
    const html = renderToStaticMarkup(<ErrorPage error={error} reset={mockReset} />);

    expect(html).toContain('Try Again');
  });

  it('renders the fallback message when error.message is empty', () => {
    const error = new Error('');
    const html = renderToStaticMarkup(<ErrorPage error={error} reset={mockReset} />);

    expect(html).toContain('An unexpected error occurred');
  });
});
