import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_PATHS = ['/', '/login', '/register', '/pitch', '/users/leaderboard'];

const PROTECTED_PATHS = [
  '/dashboard',
  '/fury',
  '/wallet',
  '/settings',
  '/profile',
  '/admin',
  '/contracts',
  '/hr',
  '/tavern',
];

// Browser auth uses HttpOnly cookie sessions. This proxy enforces auth-gating
// on protected routes and redirects unauthenticated users to /login.
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes
  if (PUBLIC_PATHS.includes(pathname)) {
    return NextResponse.next();
  }

  // Allow static assets and API routes
  if (pathname.startsWith('/_next') || pathname.startsWith('/api') || pathname.includes('.')) {
    return NextResponse.next();
  }

  // Check if the path is protected
  const isProtected = PROTECTED_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + '/'),
  );

  if (isProtected) {
    const token = request.cookies.get('styx_auth_token');
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
