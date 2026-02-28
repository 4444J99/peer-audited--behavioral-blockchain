import React from 'react';
import { SupportTraceErrorBanner } from '../components/SupportTraceErrorBanner';
import { parseSupportTraceMessage } from '../utils/support-trace';

jest.mock('../services/ApiClient', () => ({
  ApiClient: {
    submitProof: jest.fn(),
  },
}));

function collectText(node: any): string {
  if (node == null || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(collectText).join('');
  return collectText(node.props?.children);
}

describe('CameraScreen – trace-ID display', () => {
  it('renders trace ID when proof submission fails with request_id', () => {
    const tree = SupportTraceErrorBanner({
      value: 'Proof submission failed [request_id: cam-submit-001]',
    }) as any;
    const text = collectText(tree);

    expect(text).toContain('Proof submission failed');
    expect(text).toContain('Support trace ID');
    expect(text).toContain('cam-submit-001');
    expect(text).not.toContain('[request_id:');
  });

  it('does not render trace ID when error has no request_id suffix', () => {
    const tree = SupportTraceErrorBanner({
      value: 'Enter a contract ID first',
    }) as any;
    const text = collectText(tree);

    expect(text).toContain('Enter a contract ID first');
    expect(text).not.toContain('Support trace ID');
  });

  it('renders trace ID for invalid contract error', () => {
    const tree = SupportTraceErrorBanner({
      value: 'Contract not found [request_id: cam-404-contract]',
    }) as any;
    const text = collectText(tree);

    expect(text).toContain('Contract not found');
    expect(text).toContain('cam-404-contract');
  });

  it('renders trace ID for upload failure', () => {
    const tree = SupportTraceErrorBanner({
      value: 'R2 upload failed [request_id: cam-r2-err]',
    }) as any;
    const text = collectText(tree);

    expect(text).toContain('R2 upload failed');
    expect(text).toContain('cam-r2-err');
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

describe('CameraScreen – parseSupportTraceMessage edge cases', () => {
  it('extracts trace ID from upload URL request failure', () => {
    const result = parseSupportTraceMessage(
      'Failed to get upload URL [request_id: cam-url-500]',
    );
    expect(result.message).toBe('Failed to get upload URL');
    expect(result.traceId).toBe('cam-url-500');
  });

  it('returns null traceId for client-side validation', () => {
    const result = parseSupportTraceMessage('Enter a contract ID first');
    expect(result.message).toBe('Enter a contract ID first');
    expect(result.traceId).toBeNull();
  });

  it('handles camera permission error', () => {
    const result = parseSupportTraceMessage(
      'Camera permission denied [request_id: cam-perm-deny]',
    );
    expect(result.message).toBe('Camera permission denied');
    expect(result.traceId).toBe('cam-perm-deny');
  });

  it('returns empty message for undefined input', () => {
    const result = parseSupportTraceMessage(undefined);
    expect(result.message).toBe('');
    expect(result.traceId).toBeNull();
  });
});

describe('CameraScreen – render tests', () => {
  const renderer = require('react-test-renderer');
  const { act } = renderer;
  const { CameraScreen } = require('../screens/CameraScreen');

  beforeAll(() => { (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true; });
  afterAll(() => { delete (globalThis as any).IS_REACT_ACT_ENVIRONMENT; });

  function renderCamera(): any {
    let component: any;
    act(() => {
      component = renderer.create(React.createElement(CameraScreen));
    });
    return component;
  }

  function allText(component: any): string {
    const spans = component.root.findAllByType('span');
    return spans.map((n: any) => (n.children || []).join('')).join(' ');
  }

  function allPlaceholders(component: any): string[] {
    const inputs = component.root.findAllByType('input');
    return inputs.map((n: any) => n.props.placeholder).filter(Boolean);
  }

  it('renders camera placeholder with "Camera Preview" text', () => {
    const c = renderCamera();
    const text = allText(c);

    expect(text).toContain('Camera Preview');
  });

  it('renders contract ID input', () => {
    const c = renderCamera();
    const placeholders = allPlaceholders(c);

    expect(placeholders).toContain('Contract ID');
  });

  it('renders "SUBMIT PROOF" button', () => {
    const c = renderCamera();
    const text = allText(c);

    expect(text).toContain('SUBMIT PROOF');
  });

  it('shows native module notice text', () => {
    const c = renderCamera();
    const text = allText(c);

    expect(text).toContain('Camera integration requires native module');
  });
});
