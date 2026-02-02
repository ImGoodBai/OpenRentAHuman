import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Public routes that don't require Google auth
const publicRoutes = ['/welcome', '/api/auth/google', '/api/auth/session', '/api/auth/dev-login'];

// Routes that require Google auth but not moltbook account
const dashboardRoute = '/dashboard';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return addSecurityHeaders(NextResponse.next());
  }

  // Check session cookie
  const sessionToken = request.cookies.get('session')?.value;

  // No session -> redirect to welcome
  if (!sessionToken) {
    return NextResponse.redirect(new URL('/welcome', request.url));
  }

  // Verify session and check for accounts
  try {
    // If accessing dashboard, allow
    if (pathname === dashboardRoute) {
      return addSecurityHeaders(NextResponse.next());
    }

    // For all other routes, verify user has at least one account
    const accountsRes = await fetch(new URL('/api/user/accounts', request.url), {
      headers: {
        Cookie: `session=${sessionToken}`,
      },
    });

    if (!accountsRes.ok) {
      return NextResponse.redirect(new URL('/welcome', request.url));
    }

    const { accounts } = await accountsRes.json();

    // No accounts -> redirect to dashboard
    if (!accounts || accounts.length === 0) {
      return NextResponse.redirect(new URL(dashboardRoute, request.url));
    }

    // Has accounts -> allow access
    return addSecurityHeaders(NextResponse.next());
  } catch (error) {
    console.error('Middleware error:', error);
    return NextResponse.redirect(new URL('/welcome', request.url));
  }
}

function addSecurityHeaders(response: NextResponse) {
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  return response;
}

export const config = {
  matcher: [
    // Match all paths except static files and api routes
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*|api).*)',
  ],
};
