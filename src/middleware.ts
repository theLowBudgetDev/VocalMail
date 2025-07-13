
import { NextResponse, type NextRequest } from 'next/server';
import { getSession } from '@/lib/session';

const protectedRoutes = ['/', '/inbox', '/sent', '/archive', '/contacts', '/compose', '/search', '/drafts', '/help'];
const publicRoutes = ['/login', '/register'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = await getSession();

  const isProtectedRoute = protectedRoutes.some(route => pathname === route);
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));

  if (isProtectedRoute && !session) {
    return NextResponse.redirect(new URL('/login', request.nextUrl));
  }

  if (isPublicRoute && session) {
    return NextResponse.redirect(new URL('/inbox', request.nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
};

    