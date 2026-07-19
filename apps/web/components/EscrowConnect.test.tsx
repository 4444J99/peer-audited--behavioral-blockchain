import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { EscrowConnect } from './EscrowConnect';

describe('EscrowConnect', () => {
  it('renders the Fiat Bridge heading', () => {
    const html = renderToStaticMarkup(<EscrowConnect />);

    expect(html).toContain('Fiat Bridge');
  });

  it('renders the connect button in IDLE state', () => {
    const html = renderToStaticMarkup(<EscrowConnect />);

    expect(html).toContain('CONNECT BANK ACCOUNT');
  });

  it('displays security notice about Plaid encryption', () => {
    const html = renderToStaticMarkup(<EscrowConnect />);

    expect(html).toContain('AES-256 encrypted Plaid endpoints');
  });

  it('describes the FBO hold mechanism', () => {
    const html = renderToStaticMarkup(<EscrowConnect />);

    expect(html).toContain('FBO holds');
  });

  it('mentions that banking credentials never touch Styx servers', () => {
    const html = renderToStaticMarkup(<EscrowConnect />);

    expect(html).toContain('banking credentials never touch Styx servers');
  });

  it('does not show LOADING or CONNECTED state initially', () => {
    const html = renderToStaticMarkup(<EscrowConnect />);

    expect(html).not.toContain('ESTABLISHING SECURE HANDSHAKE');
    expect(html).not.toContain('Identity &amp; Capital Verified');
  });
});
