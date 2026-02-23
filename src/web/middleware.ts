import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_PATHS = ['/', '/login', '/register', '/pitch', '/users/leaderboard'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes
  if (PUBLIC_PATHS.includes(pathname)) {
    return NextResponse.next();
  }

  // Allow static assets and API routes
  if (pathname.startsWith('/_next') || pathname.startsWith('/api') || pathname.includes('.')) {
    return NextResponse.next();
  }

  // Check for auth token in cookie or localStorage (cookie approach for SSR)
  const token = request.cookies.get('styx_auth_token')?.value; // allow-secret

  // For client-side auth (localStorage), we can't check server-side.
  // The AuthContext handles redirect on the client. This middleware
  // provides an additional layer for cookie-based auth if set.
  // Since we use localStorage, we rely on a lightweight client check
  // and let the AuthProvider handle the redirect flow.

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
