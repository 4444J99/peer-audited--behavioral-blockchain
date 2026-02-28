import React from 'react';
import { SupportTraceErrorBanner } from '../components/SupportTraceErrorBanner';
import { parseSupportTraceMessage } from '../utils/support-trace';

function collectText(node: any): string {
  if (node == null || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(collectText).join('');
  return collectText(node.props?.children);
}

describe('ProfileScreen – trace-ID display', () => {
  it('renders trace ID when profile load fails with request_id', () => {
    const tree = SupportTraceErrorBanner({
      value: 'Failed to load profile [request_id: profile-load-001]',
    }) as any;
    const text = collectText(tree);

    expect(text).toContain('Failed to load profile');
    expect(text).toContain('Support trace ID');
    expect(text).toContain('profile-load-001');
    expect(text).not.toContain('[request_id:');
  });

  it('does not render trace ID when error has no request_id suffix', () => {
    const tree = SupportTraceErrorBanner({
      value: 'Profile unavailable',
    }) as any;
    const text = collectText(tree);

    expect(text).toContain('Profile unavailable');
    expect(text).not.toContain('Support trace ID');
  });

  it('renders trace ID for session expired error', () => {
    const tree = SupportTraceErrorBanner({
      value: 'Session expired — please log in again [request_id: profile-auth-exp]',
    }) as any;
    const text = collectText(tree);

    expect(text).toContain('Session expired');
    expect(text).toContain('profile-auth-exp');
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

describe('ProfileScreen – parseSupportTraceMessage edge cases', () => {
  it('extracts trace ID from integrity score load error', () => {
    const result = parseSupportTraceMessage(
      'Failed to compute integrity score [request_id: profile-int-err]',
    );
    expect(result.message).toBe('Failed to compute integrity score');
    expect(result.traceId).toBe('profile-int-err');
  });

  it('returns null traceId for logout error', () => {
    const result = parseSupportTraceMessage('Logout failed');
    expect(result.message).toBe('Logout failed');
    expect(result.traceId).toBeNull();
  });

  it('handles user not found error', () => {
    const result = parseSupportTraceMessage(
      'User not found [request_id: profile-404-usr]',
    );
    expect(result.message).toBe('User not found');
    expect(result.traceId).toBe('profile-404-usr');
  });

  it('returns empty message for undefined input', () => {
    const result = parseSupportTraceMessage(undefined);
    expect(result.message).toBe('');
    expect(result.traceId).toBeNull();
  });
});

/* ------------------------------------------------------------------ */
/*  ProfileScreen – render tests                                      */
/* ------------------------------------------------------------------ */

jest.mock('../services/ApiClient', () => ({
  ApiClient: {
    getMe: jest.fn().mockReturnValue(new Promise(() => {})),
  },
}));

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
    setOptions: jest.fn(),
  }),
}));

describe('ProfileScreen – render', () => {
  const renderer = require('react-test-renderer');
  const { act } = renderer;
  const { ProfileScreen } = require('../screens/ProfileScreen');

  beforeAll(() => { (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true; });
  afterAll(() => { delete (globalThis as any).IS_REACT_ACT_ENVIRONMENT; });

  function render(): any {
    let component: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const el = (React.createElement as any)(ProfileScreen, { onLogout: jest.fn() });
    act(() => { component = renderer.create(el); });
    return component;
  }

  function allText(component: any): string {
    const spans = component.root.findAllByType('span');
    return spans.map((n: any) => (n.children || []).join('')).join(' ');
  }

  it('renders loading state on initial render', () => {
    const c = render();
    const text = allText(c);
    expect(text).toContain('Loading profile...');
  });

  it('does not render profile content while loading', () => {
    const c = render();
    const text = allText(c);
    expect(text).not.toContain('INTEGRITY');
    expect(text).not.toContain('Log Out');
    expect(text).not.toContain('Settings');
  });

  it('exports ProfileScreen as a named function', () => {
    expect(ProfileScreen).toBeDefined();
    expect(typeof ProfileScreen).toBe('function');
    expect(ProfileScreen.name).toBe('ProfileScreen');
  });
});
