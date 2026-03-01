import { proxy, config } from '../proxy';
import { NextRequest, NextResponse } from 'next/server';

// Mock NextResponse
jest.mock('next/server', () => {
  const actual = jest.requireActual('next/server');
  return {
    ...actual,
    NextResponse: {
      next: jest.fn(() => ({ type: 'next' })),
      redirect: jest.fn((url: URL) => ({ type: 'redirect', url })),
    },
  };
});

function createRequest(pathname: string, cookies: Record<string, string> = {}): NextRequest {
  const url = new URL(pathname, 'http://localhost:3001');
  const request = new NextRequest(url);
  for (const [key, value] of Object.entries(cookies)) {
    request.cookies.set(key, value);
  }
  return request;
}

describe('proxy', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should allow public paths without a token', () => {
    proxy(createRequest('/'));
    expect(NextResponse.next).toHaveBeenCalled();
    expect(NextResponse.redirect).not.toHaveBeenCalled();
  });

  it('should allow /login without a token', () => {
    proxy(createRequest('/login'));
    expect(NextResponse.next).toHaveBeenCalled();
    expect(NextResponse.redirect).not.toHaveBeenCalled();
  });

  it('should allow /register without a token', () => {
    proxy(createRequest('/register'));
    expect(NextResponse.next).toHaveBeenCalled();
    expect(NextResponse.redirect).not.toHaveBeenCalled();
  });

  it('should redirect /dashboard to /login when no token', () => {
    proxy(createRequest('/dashboard'));
    expect(NextResponse.redirect).toHaveBeenCalledWith(
      expect.objectContaining({ pathname: '/login' }),
    );
  });

  it('should redirect /fury to /login when no token', () => {
    proxy(createRequest('/fury'));
    expect(NextResponse.redirect).toHaveBeenCalledWith(
      expect.objectContaining({ pathname: '/login' }),
    );
  });

  it('should redirect /wallet to /login when no token', () => {
    proxy(createRequest('/wallet'));
    expect(NextResponse.redirect).toHaveBeenCalledWith(
      expect.objectContaining({ pathname: '/login' }),
    );
  });

  it('should redirect /admin to /login when no token', () => {
    proxy(createRequest('/admin'));
    expect(NextResponse.redirect).toHaveBeenCalledWith(
      expect.objectContaining({ pathname: '/login' }),
    );
  });

  it('should redirect /settings to /login when no token', () => {
    proxy(createRequest('/settings'));
    expect(NextResponse.redirect).toHaveBeenCalledWith(
      expect.objectContaining({ pathname: '/login' }),
    );
  });

  it('should redirect /contracts/abc-123 to /login when no token', () => {
    proxy(createRequest('/contracts/abc-123'));
    expect(NextResponse.redirect).toHaveBeenCalledWith(
      expect.objectContaining({ pathname: '/login' }),
    );
  });

  it('should redirect /hr to /login when no token', () => {
    proxy(createRequest('/hr'));
    expect(NextResponse.redirect).toHaveBeenCalledWith(
      expect.objectContaining({ pathname: '/login' }),
    );
  });

  it('should redirect /tavern to /login when no token', () => {
    proxy(createRequest('/tavern'));
    expect(NextResponse.redirect).toHaveBeenCalledWith(
      expect.objectContaining({ pathname: '/login' }),
    );
  });

  it('should allow /dashboard when styx_auth_token cookie is present', () => {
    proxy(createRequest('/dashboard', { styx_auth_token: 'valid-jwt' }));
    expect(NextResponse.next).toHaveBeenCalled();
    expect(NextResponse.redirect).not.toHaveBeenCalled();
  });

  it('should allow /contracts/abc-123 when token is present', () => {
    proxy(createRequest('/contracts/abc-123', { styx_auth_token: 'valid-jwt' }));
    expect(NextResponse.next).toHaveBeenCalled();
    expect(NextResponse.redirect).not.toHaveBeenCalled();
  });

  it('should allow /pitch without a token (public path)', () => {
    proxy(createRequest('/pitch'));
    expect(NextResponse.next).toHaveBeenCalled();
    expect(NextResponse.redirect).not.toHaveBeenCalled();
  });

  it('should allow static asset paths', () => {
    proxy(createRequest('/_next/static/chunk.js'));
    expect(NextResponse.next).toHaveBeenCalled();
    expect(NextResponse.redirect).not.toHaveBeenCalled();
  });

  it('should allow /api routes', () => {
    proxy(createRequest('/api/health'));
    expect(NextResponse.next).toHaveBeenCalled();
    expect(NextResponse.redirect).not.toHaveBeenCalled();
  });
});

describe('proxy config', () => {
  it('should export a matcher that excludes _next, favicon paths', () => {
    expect(config.matcher).toEqual(
      expect.arrayContaining([
        expect.stringContaining('_next'),
      ]),
    );
  });
});
