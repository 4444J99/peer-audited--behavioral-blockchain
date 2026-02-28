import React from 'react';
import { SupportTraceErrorBanner } from '../components/SupportTraceErrorBanner';
import { parseSupportTraceMessage } from '../utils/support-trace';

function collectText(node: any): string {
  if (node == null || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(collectText).join('');
  return collectText(node.props?.children);
}

describe('ProofCaptureScreen – trace-ID display', () => {
  it('renders trace ID when upload fails with request_id', () => {
    const tree = SupportTraceErrorBanner({
      value: 'Upload failed [request_id: proof-upload-001]',
    }) as any;
    const text = collectText(tree);

    expect(text).toContain('Upload failed');
    expect(text).toContain('Support trace ID');
    expect(text).toContain('proof-upload-001');
    expect(text).not.toContain('[request_id:');
  });

  it('does not render trace ID when error has no request_id suffix', () => {
    const tree = SupportTraceErrorBanner({
      value: 'Camera module not installed',
    }) as any;
    const text = collectText(tree);

    expect(text).toContain('Camera module not installed');
    expect(text).not.toContain('Support trace ID');
  });

  it('renders trace ID for pre-signed URL error', () => {
    const tree = SupportTraceErrorBanner({
      value: 'Failed to get upload URL: 403 [request_id: proof-url-403]',
    }) as any;
    const text = collectText(tree);

    expect(text).toContain('Failed to get upload URL: 403');
    expect(text).toContain('proof-url-403');
  });

  it('renders trace ID for upload confirmation error', () => {
    const tree = SupportTraceErrorBanner({
      value: 'Upload confirmation failed: 500 [request_id: proof-confirm-500]',
    }) as any;
    const text = collectText(tree);

    expect(text).toContain('Upload confirmation failed: 500');
    expect(text).toContain('proof-confirm-500');
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

describe('ProofCaptureScreen – parseSupportTraceMessage edge cases', () => {
  it('extracts trace ID from R2 upload failure', () => {
    const result = parseSupportTraceMessage(
      'R2 upload failed: 413 [request_id: proof-r2-413]',
    );
    expect(result.message).toBe('R2 upload failed: 413');
    expect(result.traceId).toBe('proof-r2-413');
  });

  it('returns null traceId for camera unavailable message', () => {
    const result = parseSupportTraceMessage('Camera Unavailable');
    expect(result.message).toBe('Camera Unavailable');
    expect(result.traceId).toBeNull();
  });

  it('handles recording failure', () => {
    const result = parseSupportTraceMessage(
      'Recording failed — storage full [request_id: proof-rec-full]',
    );
    expect(result.message).toBe('Recording failed — storage full');
    expect(result.traceId).toBe('proof-rec-full');
  });

  it('returns empty message for undefined input', () => {
    const result = parseSupportTraceMessage(undefined);
    expect(result.message).toBe('');
    expect(result.traceId).toBeNull();
  });
});

/* ------------------------------------------------------------------ */
/*  ProofCaptureScreen – render tests                                 */
/* ------------------------------------------------------------------ */

jest.mock('../config/api', () => ({
  API_BASE: 'https://api.styx.test',
}));

describe('ProofCaptureScreen – render', () => {
  const renderer = require('react-test-renderer');
  const { act } = renderer;
  const ProofCaptureScreen = require('../screens/ProofCaptureScreen').default;

  beforeAll(() => { (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true; });
  afterAll(() => { delete (globalThis as any).IS_REACT_ACT_ENVIRONMENT; });

  const mockRoute = {
    params: { contractId: 'contract-abc-123', token: 'test-jwt-token' },
  } as any;
  const mockNav = { navigate: jest.fn(), goBack: jest.fn(), setOptions: jest.fn() } as any;

  function render(): any {
    let component: any;
    act(() => {
      component = renderer.create(
        React.createElement(ProofCaptureScreen, { route: mockRoute, navigation: mockNav }),
      );
    });
    return component;
  }

  function allText(component: any): string {
    const spans = component.root.findAllByType('span');
    return spans.map((n: any) => (n.children || []).join('')).join(' ');
  }

  it('renders the camera unavailable fallback', () => {
    const c = render();
    const text = allText(c);
    expect(text).toContain('Camera Unavailable');
  });

  it('renders the fallback explanation text', () => {
    const c = render();
    const text = allText(c);
    expect(text).toContain('camera module is not installed');
    expect(text).toContain('react-native-camera');
  });

  it('renders a Go Back button in fallback mode', () => {
    const c = render();
    const text = allText(c);
    expect(text).toContain('Go Back');
  });

  it('does not render camera controls in fallback mode', () => {
    const c = render();
    const text = allText(c);
    expect(text).not.toContain('Uploading...');
    expect(text).not.toContain('REC');
    expect(text).not.toContain('Live capture only');
  });

  it('exports ProofCaptureScreen as a default export', () => {
    expect(ProofCaptureScreen).toBeDefined();
    expect(typeof ProofCaptureScreen).toBe('function');
  });
});
