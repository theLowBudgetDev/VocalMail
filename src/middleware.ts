
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const SESSION_COOKIE_NAME = 'vocalmail_session';

export function middleware(request: NextRequest) {
  const sessionToken = request.cookies.get(SESSION_COOKIE_NAME);
  const { pathname } = request.nextUrl;

  const isPublicPage = pathname === '/login' || pathname === '/register';

  if (!sessionToken && !isPublicPage) {
    const url = new URL('/login', request.url);
    url.searchParams.set('error', 'Please log in to continue.');
    return NextResponse.redirect(url);
  }

  if (sessionToken && isPublicPage) {
    return NextResponse.redirect(new URL('/inbox', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
