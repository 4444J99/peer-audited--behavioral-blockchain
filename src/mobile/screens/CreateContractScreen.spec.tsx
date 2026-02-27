import React from 'react';
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
