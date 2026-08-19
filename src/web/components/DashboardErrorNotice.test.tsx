import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { DashboardErrorNotice } from './DashboardErrorNotice';
import { ApiError } from '../services/api-client';

// Regression guard for issue #867: the jurisdiction notice was unreachable
// (the 403 was swallowed into an empty contract list) until #868, and no test
// pinned the repaired behavior. These three branches are the contract.
describe('DashboardErrorNotice', () => {
  it('renders the jurisdiction notice with the API message for JURISDICTION_BLOCKED', () => {
    const err = new ApiError(
      'Styx is not available in your region yet.',
      403,
      'JURISDICTION_BLOCKED',
      'trace-123',
    );
    const html = renderToStaticMarkup(<DashboardErrorNotice error={err} />);

    expect(html).toContain('Not available in your jurisdiction');
    expect(html).toContain('Styx is not available in your region yet.');
    // A deliberate product state must not read as an outage.
    expect(html).not.toContain('Ensure the backend service is reachable.');
  });

  it('renders the reachability hint only for network errors (status 0)', () => {
    const err = new ApiError('Network request failed', 0, null, null);
    const html = renderToStaticMarkup(<DashboardErrorNotice error={err} />);

    expect(html).toContain('Network request failed');
    expect(html).toContain('Ensure the backend service is reachable.');
  });

  it('renders a plain message with no reachability hint for other errors', () => {
    const err = new ApiError('Forbidden', 403, 'FORBIDDEN', null);
    const html = renderToStaticMarkup(<DashboardErrorNotice error={err} />);

    expect(html).toContain('Forbidden');
    expect(html).not.toContain('Ensure the backend service is reachable.');
    expect(html).not.toContain('Not available in your jurisdiction');
  });
});
